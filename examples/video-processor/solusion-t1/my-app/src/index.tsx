import React, { useEffect, useRef, useState } from 'react';
import App from './App';
import { createRoot } from 'react-dom/client';
import type { Mask } from './types';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error("Nie znaleziono elementu 'root' w DOM");
}

// Sprawdź, czy już istnieje utworzony root i zapisz go globalnie
const existingRoot = (window as any).__root__;
const root = existingRoot ? existingRoot : createRoot(container);
(window as any).__root__ = root;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

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
}

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
	onError,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		const processVideo = async () => {
			if (!videoRef.current || !canvasRef.current) return;

			try {
				setIsProcessing(true);

				// Utworzenie URL dla wideo
				const videoUrl = URL.createObjectURL(videoFile);
				videoRef.current.src = videoUrl;

				// Czekamy na metadane wideo
				await new Promise<void>((resolve) => {
					if (!videoRef.current) return;
					videoRef.current.onloadedmetadata = () => resolve();
				});

				const { videoWidth, videoHeight, duration } = videoRef.current;

				// Obliczenie rozdzielczości do przetwarzania (zmniejszenie do 720p, jeśli większe)
				const processingScale = Math.min(
					1,
					720 / Math.max(videoWidth, videoHeight)
				);
				const processingWidth = Math.round(videoWidth * processingScale);
				const processingHeight = Math.round(videoHeight * processingScale);

				// Przetwarzanie klatek
				const frames: FrameData[] = [];
				const frameInterval = 1 / 30; // 30 fps

				for (let time = 0; time < duration; time += frameInterval) {
					videoRef.current.currentTime = time;
					await new Promise<void>((resolve) => {
						if (!videoRef.current) return;
						videoRef.current.onseeked = () => resolve();
					});

					// Rysowanie klatki na canvas przy ustalonej rozdzielczości
					canvasRef.current.width = processingWidth;
					canvasRef.current.height = processingHeight;
					const ctx = canvasRef.current.getContext('2d');
					ctx?.drawImage(
						videoRef.current,
						0,
						0,
						processingWidth,
						processingHeight
					);

					// Pobieranie danych obrazu z canvas
					const imageData = ctx?.getImageData(
						0,
						0,
						processingWidth,
						processingHeight
					);
					if (!imageData) continue;

					// TODO: Przetwarzanie klatki przy użyciu modelu ML (np. segmentacja)
					// Na razie tworzymy tylko miniaturkę
					const thumbnail = canvasRef.current.toDataURL('image/jpeg', 0.5);

					frames.push({
						id: `frame-${time.toFixed(3)}`,
						timestamp: time,
						segmentation: {
							masks: [], // Wypełnione przez model ML
							labels: [], // Wypełnione przez model ML
							confidence: [],
						},
						thumbnail,
					});
				}

				// Czyszczenie URL
				URL.revokeObjectURL(videoUrl);

				// Zwracamy wyniki przetwarzania
				const processedData: ProcessedVideoData = {
					frames,
					duration,
					resolution: {
						width: videoWidth,
						height: videoHeight,
					},
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
		<div className='hidden'>
			<video ref={videoRef} />
			<canvas ref={canvasRef} />
		</div>
	);
};
