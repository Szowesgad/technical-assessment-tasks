import { promisify } from 'util';
import { exec as execCb } from 'child_process';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';

const exec = promisify(execCb);

/**
 * KONFIGURACJA DOMYŚLNA -  Możesz dostosować te wartości!
 *
 * Te ustawienia są dobrym punktem startowym do walki z powtarzaniem fraz.
 * Pamiętaj, że optymalne wartości mogą zależeć od konkretnego audio i modelu.
 * Eksperymentuj! Zmieniaj wartości pojedynczo i obserwuj efekty.
 */
const DEFAULT_THREADS = Math.min(20, os.cpus().length); // Wykorzystaj do 16 rdzeni CPU, ale nie więcej niż dostępne
const DEFAULT_BEAM_SIZE = 6;   // Mniejszy beam - mniejsze ryzyko powtórzeń, potencjalnie nieco niższa jakość, ale warto zacząć od niższej wartości
const DEFAULT_BEST_OF = 6;     // Podobnie jak beam_size, mniejsza wartość może pomóc w redukcji powtórzeń
const DEFAULT_ENTROPY_THOLD = 2.6; // Wyższy próg entropii = większa niechęć do powtórzeń. Zacznij od 2.4 i testuj wyższe wartości.
const DEFAULT_WORD_THOLD = 0.001;   // Bardzo niska wartość progu słowa (w połączeniu z word_timestamps) pomaga w redukcji powtórzeń. Spróbuj nawet 0.0.
const DEFAULT_MAX_LEN = 2048;   // Dłuższy segment = lepszy kontekst, potencjalnie mniej powtórzeń. Zwiększono z 512.
const DEFAULT_LANG = 'pl';     // Domyślny język transkrypcji: polski
const DEFAULT_TASK = 'transcribe'; // Domyślne zadanie: transkrypcja (a nie tłumaczenie)
const DEFAULT_FORMAT = 'text';  // Domyślny format wyjściowy: tekst (.txt)
const DEFAULT_TIMESTAMPS = true; // Domyślnie włączone timestampy segmentów
const DEFAULT_WORD_TIMESTAMPS = true; // **WAŻNE:** Domyślnie włączone timestampy słów - potrzebne do działania `word_thold`

// Mapowanie formatu wyjściowego na flagę whisper.cpp
const formatToFlag: Record<string, string> = {
  text: '--output-txt',
  srt: '--output-srt',
  vtt: '--output-vtt'
};

export interface WhisperOptions {
  modelPath: string;              // Ścieżka do pliku modelu np. "models/ggml-large-turbo.bin"
  binaryPath: string;             // Ścieżka do binarnego pliku whisper.cpp np. "./whisper/main"
  language?: string;              // Język transkrypcji (np. "pl", "en", "de"). Domyślnie 'pl'
  task?: 'transcribe' | 'translate'; // Zadanie: 'transcribe' (domyślnie) lub 'translate'
  format?: 'text' | 'vtt' | 'srt';// Format wyjściowy: 'text' (domyślnie), 'vtt', 'srt'
  timestamps?: boolean;           // Czy generować timestampy dla segmentów tekstu? (domyślnie true)
  word_timestamps?: boolean;      // Czy generować timestampy dla **słów**? (domyślnie true - **WAŻNE dla `word_thold`**)
  beamSize?: number;              // `-bs N`: Rozmiar beam search. Mniejsza wartość = mniejsze powtórzenia, ale potencjalnie niższa jakość.
  bestOf?: number;                // `-bo N`: Best-of dla beam search. Podobnie jak beam_size, mniejsza wartość może redukować powtórzenia.
  entropyThold?: number;          // `-et N`: Próg entropii. **Wyższa wartość = agresywniejsze tłumienie powtórzeń.** Eksperymentuj z wartościami powyżej 2.2.
  wordThold?: number;             // `-wt N`: Próg słowa. **Niska wartość (np. 0.001, 0.0) w połączeniu z `word_timestamps: true` pomaga redukować powtórzenia.**
  maxLen?: number;                // `-ml N`: Maksymalna długość segmentu w tokenach. **Większa wartość = lepszy kontekst, potencjalnie mniej powtórzeń.**
  splitOnWord?: boolean;          // `-sow`: Podział segmentów na granicach słów. Może poprawić czytelność.
  debug?: boolean;                // `-debug`: Włączenie trybu debugowania whisper.cpp. Przydatne do diagnozowania problemów.
  flashAttn?: boolean;            // `-fa`: Użycie Flash Attention (jeśli wspierane przez Twoją kompilację whisper.cpp). Może przyspieszyć transkrypcję.
}

/**
 * Funkcja `transcribe(audioPath, options)`:
 *  Przeprowadza transkrypcję pliku audio za pomocą whisper.cpp.
 *
 * Kroki:
 *  1. Walidacja: Sprawdza, czy istnieją pliki audio, model i binarka whisper.cpp.
 *  2. Konwersja do WAV: Konwertuje plik audio do formatu WAV (16kHz, mono) za pomocą ffmpeg, jeśli wejściowy plik nie jest WAV.
 *  3. Budowa komendy: Tworzy łańcuch komendy dla whisper.cpp z uwzględnieniem opcji i wartości domyślnych.
 *  4. Uruchomienie whisper.cpp: Wykonuje komendę za pomocą `child_process.exec`.
 *  5. Obsługa wyjścia: Zwraca transkrybowany tekst (stdout) z whisper.cpp. Loguje błędy (stderr), jeśli występują.
 *  6. Sprzątanie: Usuwa tymczasowy plik WAV, jeśli został utworzony.
 */
export async function transcribe(audioPath: string, options: WhisperOptions): Promise<string> {
  // 1. Walidacja plików - upewniamy się, że wszystko, czego potrzebujemy, istnieje
  try {
    await fs.access(audioPath);
    await fs.access(options.modelPath);
    await fs.access(options.binaryPath);
  } catch (error) {
    console.error('[whisper.ts] Błąd dostępu do plików:', error);
    throw error; // Przekazujemy błąd dalej, aby aplikacja mogła go obsłużyć
  }

  // 2. Konwersja do WAV (16kHz, mono) - jeśli plik wejściowy nie jest WAV
  let inputFile = audioPath; // Domyślnie plik wejściowy to oryginalny audioPath
  if (!audioPath.toLowerCase().endsWith('.wav')) {
    const wavFile = path.join(
      path.dirname(audioPath),
      `${path.basename(audioPath, path.extname(audioPath))}.wav`
    );
    // Używamy ffmpeg do konwersji do WAV:
    // -y:  Nadpisz plik wyjściowy, jeśli istnieje
    // -i "${audioPath}": Plik wejściowy
    // -ar 16000: Częstotliwość próbkowania 16kHz (wymagane przez whisper.cpp)
    // -ac 1: Mono (jeden kanał audio)
    // -c:a pcm_s16le: Format audio PCM 16-bit (nieskompresowany WAV)
    // "${wavFile}": Plik wyjściowy WAV
    const ffmpegCmd = `ffmpeg -y -i "${audioPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavFile}"`;
    try {
      await exec(ffmpegCmd);
      inputFile = wavFile; // Teraz plikiem wejściowym jest skonwertowany WAV
    } catch (error) {
      console.error('[whisper.ts] Błąd konwersji do WAV za pomocą ffmpeg:', error);
      throw error; // Przekazujemy błąd dalej
    }
  }

  try {
    // 3. Budowa komendy whisper.cpp
    // Argumenty przekazywane do whisper.cpp jako flaga i wartość (np. `-m "model.bin"`)
    const args = [
      `-m "${options.modelPath}"`,             // --model <ścieżka do modelu> - **wymagane**
      `-f "${inputFile}"`,               // --file <ścieżka do pliku audio> - **wymagane**
      `-l ${options.language ?? DEFAULT_LANG}`,    // --language <język> - język transkrypcji, domyślnie 'pl'
      options.task === 'translate' ? '--translate' : '', // --translate - flaga dla zadania tłumaczenia

      // *** PARAMETRY WPŁYWAJĄCE NA JAKOŚĆ I POWTARZANIE FRAZ ***
      `-t ${DEFAULT_THREADS}`,                // --threads <N> - liczba wątków, domyślnie AUTO
      `-bs ${options.beamSize ?? DEFAULT_BEAM_SIZE}`,     // --beam_size <N> - rozmiar beam search, mniejszy = mniej powtórzeń (eksperymentuj z 2, 4, 8)
      `-bo ${options.bestOf ?? DEFAULT_BEST_OF}`,       // --best_of <N> - best-of dla beam search, mniejszy = mniej powtórzeń (eksperymentuj z 2, 4, 8)
      `-et ${options.entropyThold ?? DEFAULT_ENTROPY_THOLD}`, // --entropy_thold <N> - próg entropii, **WYŻSZY = MNIEJ POWTÓRZEŃ** (eksperymentuj z 2.4, 2.6, 2.8...)
      `-ml ${options.maxLen ?? DEFAULT_MAX_LEN}`,       // --max_len <N> - max długość segmentu, **WIĘKSZY = LEPSZY KONTEKST** (eksperymentuj z 1024, 2048...)

      // *** PARAMETRY DOTYCZĄCE TIMESTAMPÓW ***
      options.timestamps === false ? '--no-timestamps' : '', // --no-timestamps - wyłączenie timestampów segmentów (domyślnie włączone)
      options.word_timestamps ? `-wt ${options.wordThold ?? DEFAULT_WORD_THOLD}` : '', // --word_timestamps + --word_thold <N> - timestampy słów, **NISKI `word_thold` = MNIEJ POWTÓRZEŃ** (eksperymentuj z 0.001, 0.0), **WAŻNE: wymaga `word_timestamps: true`**

      // *** FORMAT WYJŚCIA ***
      formatToFlag[options.format ?? DEFAULT_FORMAT], // --output-format - format wyjściowy, domyślnie 'text'

      // *** INNE OPCJE ***
      options.splitOnWord ? '-sow' : '',             // --split-on-word - podział segmentów na słowach
      options.debug ? '-debug' : '',               // --debug - tryb debugowania
      options.flashAttn ? '-fa' : ''               // --flash-attn - Flash Attention (jeśli wspierane)
    ].filter(Boolean); // Usuwamy puste stringi z tablicy argumentów (np. po '--translate' gdy task != 'translate')

    // Składamy komendę w całość - ścieżka do binarki + argumenty
    const command = `"${options.binaryPath}" ${args.join(' ')}`;
    console.log('[whisper.ts] Wykonywanie komendy:', command); // Logowanie komendy - przydatne do debugowania

    // 4. Uruchamiamy komendę whisper.cpp za pomocą `exec`
    const { stdout, stderr } = await exec(command);

    // 5. Obsługa błędów (stderr) - logujemy ostrzeżenia, ale nie przerywamy procesu (stderr nie zawsze oznacza błąd krytyczny)
    if (stderr) {
      console.warn('[whisper.ts] whisper stderr:', stderr);
    }

    // 5. Zwracamy wynik transkrypcji (stdout) - usuwamy białe znaki z początku i końca
    return stdout.trim();

  } finally {
    // 6. Sprzątanie - usuwamy tymczasowy plik WAV, jeśli został utworzony podczas konwersji
    if (inputFile !== audioPath) { // Sprawdzamy, czy inputFile jest inne niż oryginalne audioPath - czyli czy konwersja WAV była potrzebna
      try {
        await fs.unlink(inputFile); // Usuwamy tymczasowy plik WAV
      } catch (err) {
        console.error('[whisper.ts] Nie udało się usunąć tymczasowego pliku WAV:', err);
        // Nie przerywamy procesu, nawet jeśli usunięcie się nie powiedzie - to nie jest krytyczne
      }
    }
  }
}
