import { useState } from 'react';
import { FrameData } from '../components/VideoProcessor';

export const useSegmentation = () => {
  const [segmentedFrames, setSegmentedFrames] = useState<FrameData[]>([]);

  const segmentFrame = (frame: FrameData) => {
    setSegmentedFrames(prev => [...prev, frame]);
  };

  return { segmentedFrames, segmentFrame };
};
