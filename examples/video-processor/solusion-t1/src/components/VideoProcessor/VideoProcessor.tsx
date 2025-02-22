import React, { useEffect, useRef, useState } from 'react';
import { VideoProcessorProps } from './index';
import { FrameData } from "./index";
import FrameProcessor from './FrameProcessor';  // Import detekcji AI
import ResolutionManager from './ResolutionManager';  // Import zarządzania rozdzielczością

export const VideoProcessor: React.FC<VideoProcessorProps> = ({ videoFile, onProcessingComplete, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const processVideo = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        setIsProcessing(true);
        const videoUrl = URL.createObjectURL(videoFile);
        videoRef.current.src = videoUrl;

        await new Promise<void>((resolve, reject) => {
          videoRef.current!.onloadedmetadata = () => resolve();
          videoRef.current!.onerror = () => reject(new Error("Błąd ładowania wideo"));
        });

        const { videoWidth, videoHeight, duration } = videoRef.current;
        const { width, height } = ResolutionManager.adjustResolution(videoWidth, videoHeight); // Dynamiczna zmiana rozdzielczości

        const frames: FrameData[] = [];
        for (let time = 0; time < duration; time += 1 / 30) {
          if (isCancelled) return;

          videoRef.current.currentTime = time;
          await new Promise<void>(resolve => {
            videoRef.current!.onseeked = () => requestAnimationFrame(() => resolve());
          });

          canvasRef.current!.width = width;
          canvasRef.current!.height = height;
          const ctx = canvasRef.current!.getContext("2d");
          ctx?.drawImage(videoRef.current, 0, 0, width, height);

          const imageData = ctx?.getImageData(0, 0, width, height);
          if (!imageData) continue;

          // Użycie FrameProcessor do detekcji YOLOv8
          const frameData = await FrameProcessor.processFrame(imageData, time);
          frames.push(frameData);
        }

        URL.revokeObjectURL(videoUrl);
        if (!isCancelled) onProcessingComplete?.({ frames, duration, resolution: { width, height } });
      } catch (error) {
        if (!isCancelled) onError?.(error as Error);
      } finally {
        if (!isCancelled) setIsProcessing(false);
      }
    };

    processVideo();
    return () => { isCancelled = true; };
  }, [videoFile]);

  return (
    <div className="hidden">
      <video ref={videoRef} />
      <canvas ref={canvasRef} />
    </div>
  );
};
