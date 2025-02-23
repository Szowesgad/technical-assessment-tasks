import * as tf from '@tensorflow/tfjs';
import { load as loadDeepLab } from '@tensorflow-models/deeplab';
import { FrameData, Mask } from '../types';

export interface ModelConfig {
  type: 'SAM2' | 'other';
  configuration: Record<string, any>;
}

export class AIModel {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async processFrame(frame: FrameData): Promise<FrameData> {
    const segmentationModel = await this.loadModel();
    const segmentedFrame = await segmentationModel.segment(frame);
    return { ...frame, segmentation: segmentedFrame };
  }

  private async loadModel() {
    console.log('Ładowanie modelu SAM2 do segmentacji...');
    const model = await loadDeepLab({ base: 'pascal' });

    return {
      segment: async (frame: FrameData) => {
        console.log(`Segmentacja dla klatki ${frame.id}`);
        const image = new Image();
        image.src = frame.thumbnail;
        await new Promise((resolve) => (image.onload = resolve));
        const imgTensor = tf.browser.fromPixels(image).toFloat().expandDims(0) as tf.Tensor3D;
        const prediction = await model.segment(imgTensor);
        
        const masks: Mask[] = Array.from(prediction.segmentationMap).map((value, index) => ({
          id: `mask-${index}`,
          points: [], // TODO: Przetworzyć mapę segmentacji na punkty
          color: `rgba(0, 255, 0, ${value / 255})` // Skalowanie wartości na kolor
        }));

        return {
          masks: masks,
          labels: Object.values(prediction.legend).map(label => label.toString()),
          confidence: []
        };
      }
    };
  }
}
