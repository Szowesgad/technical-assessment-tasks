export interface FrameData {
    id: string;
    timestamp: number;
    segmentation: {
        masks: any[];
        labels: string[];
        confidence: number[];
    };
    thumbnail: string;
}

export interface ProcessedVideoData {
    frames: FrameData[];
    duration: number;
    resolution: {
        width: number;
        height: number;
    };
}
