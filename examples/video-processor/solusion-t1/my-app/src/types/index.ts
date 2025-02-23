export interface Point {
    x: number;
    y: number;
  }
  
export interface Mask {
    id: string;
    points: Point[];
    color: string;
    width?: number;
    height?: number;
  }
  
export interface FrameData {
    id: string;
    timestamp: number;
    segmentation: {
      masks: Mask[];
      labels: string[];
      confidence: number[];
    };
    thumbnail: string;
  }
  
export interface VideoProcessorProps {
    videoFile: File;
    onProcessingComplete?: (data: ProcessedVideoData) => void;
    onError?: (error: Error) => void;
  }
  
export interface ProcessedVideoData {
    frames: FrameData[];
    duration: number;
    resolution: {
      width: number;
      height: number;
    };
}