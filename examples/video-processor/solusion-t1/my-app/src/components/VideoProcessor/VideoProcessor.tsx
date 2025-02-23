import React, { useEffect, useRef, useState } from 'react';
import { VideoProcessorProps } from '../../index';
import { FrameData } from '../../index';
import FrameProcessor from './FrameProcessor'; // Import detekcji AI
import ResolutionManager from './ResolutionManager'; // Import zarządzania rozdzielczością

export const VideoProcessor: React.FC<VideoProcessorProps> = ({
	videoFile,
	onProcessingComplete,
	onError,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [videoLoaded, setVideoLoaded] = useState(false);

	// Funkcja do przetwarzania wideo
	useEffect(() => {
		let isCancelled = false;

		const processVideo = async () => {
			if (!videoRef.current || !canvasRef.current) return;

			try {
				setIsProcessing(true);
				const videoUrl = URL.createObjectURL(videoFile);
				videoRef.current.src = videoUrl;

				// Dodajemy logi do sprawdzenia, co się dzieje
				console.log('Wideo załadowane');
				
				videoRef.current.onloadedmetadata = () => {
					console.log('Metadata załadowana');
					setVideoLoaded(true);
				};

				videoRef.current.onerror = (e) => {
					console.error('Błąd ładowania wideo', e);
					onError?.(new Error('Błąd ładowania wideo'));
				};

				// Czekamy na załadowanie wideo
				await new Promise<void>((resolve) => {
					videoRef.current!.onloadedmetadata = () => resolve();
				});

				// Sprawdzamy metadane wideo
				const { videoWidth, videoHeight, duration } = videoRef.current;
				console.log(`Wideo załadowane, szerokość: ${videoWidth}, wysokość: ${videoHeight}, długość: ${duration}`);
				const { width, height } = ResolutionManager.adjustResolution(videoWidth, videoHeight); // Dynamiczna zmiana rozdzielczości

				const frames: FrameData[] = [];
				for (let time = 0; time < duration; time += 1 / 30) {
					if (isCancelled) return;

					videoRef.current.currentTime = time; // Ustawiamy currentTime wideo do przetwarzania odpowiedniej klatki
					await new Promise<void>((resolve) => {
						videoRef.current!.onseeked = () => requestAnimationFrame(() => resolve());
					});

					canvasRef.current!.width = width;
					canvasRef.current!.height = height;
					const ctx = canvasRef.current!.getContext('2d');
					ctx?.drawImage(videoRef.current, 0, 0, width, height);

					const imageData = ctx?.getImageData(0, 0, width, height);
					if (!imageData) continue;

					// Użycie FrameProcessor do detekcji YOLOv8 (zastąp własnym kodem detekcji)
					const frameData = await FrameProcessor.processFrame(imageData, time);
					frames.push(frameData);
				}

				URL.revokeObjectURL(videoUrl);
				if (!isCancelled)
					onProcessingComplete?.({
						frames,
						duration,
						resolution: { width, height },
					});
			} catch (error) {
				console.error('Błąd przetwarzania wideo:', error);
				if (!isCancelled) onError?.(error as Error);
			} finally {
				if (!isCancelled) setIsProcessing(false);
			}
		};

		// Uruchamiamy przetwarzanie wideo
		processVideo();

		return () => {
			isCancelled = true;
		};
	}, [videoFile, onProcessingComplete, onError]);

	// Ustawienia wideo i canvas
	return (
		<div style={{ position: 'relative', width: '100%', height: 'auto' }}>
			{/* Wideo */}
			<video
				ref={videoRef}
				style={{
					position: 'absolute',
					width: '100%',
					maxWidth: '100%',
					height: 'auto',
					top: 0,
					left: 0,
					zIndex: 1,
				}}
				controls
			/>
			{/* Canvas */}
			<canvas
				ref={canvasRef}
				style={{
					position: 'absolute',
					width: '100%',
					maxWidth: '100%',
					height: 'auto',
					top: 0,
					left: 0,
					zIndex: 2,
				}}
			/>
		</div>
	);
};
