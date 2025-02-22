import * as ort from "onnxruntime-web"; // Import ONNX Runtime
import { FrameData } from "types";

class FrameProcessor {
  private model: ort.InferenceSession | null = null;
  private buffer: Map<number, FrameData> = new Map();
  private modelPath = "/models/yolov8.onnx"; // Upewnij się, że model jest w katalogu public

  constructor() {
    this.initializeModel();
  }

  // Wczytanie modelu YOLOv8 w formacie ONNX
  private async initializeModel() {
    try {
      this.model = await ort.InferenceSession.create(this.modelPath);
      console.log("YOLOv8 model załadowany!");
    } catch (error) {
      console.error("Błąd ładowania modelu YOLOv8:", error);
    }
  }

  // Przetwarzanie klatek wideo
  public async processFrame(imageData: ImageData, timestamp: number): Promise<FrameData> {
    if (this.buffer.has(timestamp)) {
      return this.buffer.get(timestamp)!;
    }

    if (!this.model) {
      console.warn("Model YOLOv8 nie jest jeszcze załadowany.");
      return this.createEmptyFrame(timestamp);
    }

    const tensor = this.preprocessImage(imageData);
    const detections = await this.runInference(tensor);

    const frameData: FrameData = {
      id: `frame-${timestamp.toFixed(3)}`,
      timestamp,
      segmentation: {
        masks: detections.masks || [],
        labels: detections.labels || [],
        confidence: detections.confidences || [],
      },
      thumbnail: this.createThumbnail(imageData),
    };

    this.buffer.set(timestamp, frameData);
    return frameData;
  }

  // Przekształcanie obrazu do formatu tensorowego dla YOLOv8
  private preprocessImage(imageData: ImageData): ort.Tensor {
    const { width, height, data } = imageData;
    const float32Data = new Float32Array(width * height * 3);
    
    for (let i = 0; i < width * height; i++) {
      float32Data[i] = data[i * 4] / 255;      // R
      float32Data[i + width * height] = data[i * 4 + 1] / 255;  // G
      float32Data[i + 2 * width * height] = data[i * 4 + 2] / 255;  // B
    }

    return new ort.Tensor("float32", float32Data, [1, 3, height, width]);
  }

  // Uruchomienie inferencji YOLOv8
  private async runInference(tensor: ort.Tensor) {
    if (!this.model) return { labels: [], masks: [], confidences: [] };

    const feeds = { images: tensor };
    const results = await this.model.run(feeds);
    const output = results["output"]; // Zmienna zależna od struktury modelu

    return this.parseDetections(output);
  }

  // Parsowanie wyników YOLOv8 do struktury segmentacji
  private parseDetections(output: ort.Tensor) {
    const data = output.data as Float32Array;
    const labels: string[] = [];
    const confidences: number[] = [];
    const masks: any[] = [];

    for (let i = 0; i < data.length; i += 6) {
      const confidence = data[i + 4];
      if (confidence < 0.5) continue; // Odrzucenie detekcji poniżej progu pewności

      labels.push(`Object-${i / 6}`);
      confidences.push(confidence);
      masks.push({
        x: data[i],
        y: data[i + 1],
        width: data[i + 2] - data[i],
        height: data[i + 3] - data[i + 1],
      });
    }

    return { labels, masks, confidences };
  }

  // Tworzenie miniatury
  private createThumbnail(imageData: ImageData): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx?.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.5);
  }

  private createEmptyFrame(timestamp: number): FrameData {
    return {
      id: `frame-${timestamp.toFixed(3)}`,
      timestamp,
      segmentation: { masks: [], labels: [], confidence: [] },
      thumbnail: "",
    };
  }
}

export default new FrameProcessor();
