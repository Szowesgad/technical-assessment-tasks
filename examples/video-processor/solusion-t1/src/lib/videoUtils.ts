import { FrameData } from '../types';

export const extractFrames = async (videoFile: File): Promise<FrameData[]> => {
    console.log(`Extracting frames from video: ${videoFile.name}`);
    // TODO: Implementacja ekstrakcji klatek
    return [];
  };
  
  export const convertTimestampToFrame = (timestamp: number, fps: number = 30): number => {
    return Math.floor(timestamp * fps);
  };
  