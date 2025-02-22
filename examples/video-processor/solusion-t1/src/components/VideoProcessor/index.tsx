import React, { useEffect, useRef, useState } from 'react';
import type { Mask } from '@/types';

interface VideoProcessorProps {
  videoFile: File;
  onProcessingComplete?: (data: ProcessedVideoData) => void;
  onError?: (error: Error) => void;
}
export type { VideoProcessorProps };

interface ProcessedVideoData {
  frames: FrameData[];
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
};
  
interface FrameData {
  id: string;
  timestamp: number;
  segmentation: {
    masks: Mask[];
    labels: string[];
    confidence: number[];
  };
  thumbnail: string;
}
export type { FrameData };

export const VideoProcessor: React.FC<VideoProcessorProps> = ({
  videoFile,
  onProcessingComplete,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processVideo = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        setIsProcessing(true);

        // Create video URL
        const videoUrl = URL.createObjectURL(videoFile);
        videoRef.current.src = videoUrl;

        // Wait for video metadata
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return;
          videoRef.current.onloadedmetadata = () => resolve();
        });

        const { videoWidth, videoHeight, duration } = videoRef.current;

        // Calculate processing resolution (downsample to 720p if larger)
        const processingScale = Math.min(1, 720 / Math.max(videoWidth, videoHeight));
        const processingWidth = Math.round(videoWidth * processingScale);
        const processingHeight = Math.round(videoHeight * processingScale);

        // Process frames
        const frames: FrameData[] = [];
        const frameInterval = 1 / 30; // 30 fps
        
        for (let time = 0; time < duration; time += frameInterval) {
          videoRef.current.currentTime = time;
          await new Promise<void>(resolve => {
            if (!videoRef.current) return;
            videoRef.current.onseeked = () => resolve();
          });

          // Draw frame to canvas at processing resolution
          canvasRef.current.width = processingWidth;
          canvasRef.current.height = processingHeight;
          const ctx = canvasRef.current.getContext('2d');
          ctx?.drawImage(videoRef.current, 0, 0, processingWidth, processingHeight);

          // Get frame data for processing
          const imageData = ctx?.getImageData(0, 0, processingWidth, processingHeight);
          if (!imageData) continue;

          // TODO: Process frame through ML model
          // This is where you'd call your chosen segmentation model
          
          // For now, just create a thumbnail
          const thumbnail = canvasRef.current.toDataURL('image/jpeg', 0.5);

          frames.push({
            id: `frame-${time.toFixed(3)}`,
            timestamp: time,
            segmentation: {
              masks: [],  // Would be populated by ML model
              labels: [], // Would be populated by ML model
              confidence: []
            },
            thumbnail
          });
        }

        // Cleanup
        URL.revokeObjectURL(videoUrl);

        // Return results
        const processedData: ProcessedVideoData = {
          frames,
          duration,
          resolution: {
            width: videoWidth,
            height: videoHeight
          }
        };

        onProcessingComplete?.(processedData);
      } catch (error) {
        onError?.(error as Error);
      } finally {
        setIsProcessing(false);
      }
    };

    processVideo();
  }, [videoFile]);

  return (
    <div className="hidden">
      <video ref={videoRef} />
      <canvas ref={canvasRef} />
    </div>
  );
};