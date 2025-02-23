import { useState } from 'react';
import { FrameData } from '..';

export const useVideoProcessing = () => {
	const [processedFrames, setProcessedFrames] = useState<FrameData[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);

	const processVideo = async (videoFile: File) => {
		setIsProcessing(true);
		// TODO: Integracja z AI do przetwarzania wideo
		setTimeout(() => {
			setProcessedFrames([]); // Placeholder: Tutaj dodamy przetworzone klatki
			setIsProcessing(false);
		}, 2000);
	};

	return { processedFrames, isProcessing, processVideo };
};
