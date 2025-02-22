import React, { useState, useEffect } from 'react';
import { VideoProcessor } from './components/VideoProcessor';
import Tools from './components/Canvas/Tools';
import Filmroll from './components/Canvas/Filmroll';
import Editor from './components/Canvas/Editor';
import Timeline from './components/UI/Timeline';
import Controls from './components/UI/Controls';
import { ProcessedVideoData, FrameData } from './types';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedVideoData | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
  const [selectedTool, setSelectedTool] = useState<'brush' | 'eraser' | 'move'>('brush');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Obsługa wgrywania pliku wideo
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      setVideoFile(event.target.files[0]);
      // Resetowanie stanu przy nowym wgraniu
      setProcessedData(null);
      setSelectedFrame(null);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  // Po zakończeniu przetwarzania wideo zapisujemy dane
  const handleProcessingComplete = (data: ProcessedVideoData) => {
    setProcessedData(data);
  };

  // Zmiana narzędzia w edytorze
  const handleSelectTool = (tool: 'brush' | 'eraser' | 'move') => {
    setSelectedTool(tool);
  };

  // Dummy-handlery dla operacji na maskach
  const handleMaskUpdate = (maskId: string, updates: Partial<any>) => {
    console.log('Mask updated:', maskId, updates);
  };

  const handleCreateMask = (points: any) => {
    console.log('Mask created:', points);
  };

  const handleDeleteMask = (maskId: string) => {
    console.log('Mask deleted:', maskId);
  };

  // Obsługa suwaka (timeline)
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // Sterowanie odtwarzaniem
  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Symulacja odtwarzania – aktualizacja currentTime podczas "odtwarzania" wideo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && processedData) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime >= processedData.duration) {
            setIsPlaying(false);
            return processedData.duration;
          }
          return prevTime + 0.033; // przybliżony przyrost odpowiadający 30 fps
        });
      }, 33);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, processedData]);

  return (
    <div className="app-container">
      <h1>Witaj w mojej aplikacji React!</h1>
      <input type="file" accept="video/*" onChange={handleVideoUpload} />

      {/* Przetwarzanie wideo – pokazuje VideoProcessor dopóki nie mamy przetworzonych danych */}
      {videoFile && !processedData && (
        <VideoProcessor
          videoFile={videoFile}
          onProcessingComplete={handleProcessingComplete}
          onError={(err) => console.error(err)}
        />
      )}

      {/* Po zakończeniu przetwarzania wyświetlamy pozostałe komponenty */}
      {processedData && (
        <div className="video-playback">
          <Tools onSelectTool={handleSelectTool} />
          <Filmroll
            frames={processedData.frames}
            onSelectFrame={(frame) => {
              setSelectedFrame(frame);
              setCurrentTime(frame.timestamp);
            }}
          />
          {selectedFrame ? (
            <Editor
              frame={selectedFrame}
              onMaskUpdate={handleMaskUpdate}
              onCreateMask={handleCreateMask}
              onDeleteMask={handleDeleteMask}
            />
          ) : (
            <p>Wybierz klatkę z filmrolla, aby rozpocząć edycję masek.</p>
          )}
          <Timeline
            duration={processedData.duration}
            currentTime={currentTime}
            onSeek={handleSeek}
          />
          <Controls
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
          />
        </div>
      )}
    </div>
  );
};

export default App;
