/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as tf from '@tensorflow/tfjs-core';
import { Color, DeepLabInput, ModelArchitecture, QuantizationBytes, SegmentationData } from './types';
export declare function createPascalColormap(): Color[];
/**
 * Returns
 *
 * @param base  :: `ModelArchitecture`
 *
 * The type of model to load (either `pascal`, `cityscapes` or `ade20k`).
 *
 * @param quantizationBytes (optional) :: `QuantizationBytes`
 *
 * The degree to which weights are quantized (either 1, 2 or 4).
 * Setting this attribute to 1 or 2 will load the model with int32 and
 * float32 compressed to 1 or 2 bytes respectively.
 * Set it to 4 to disable quantization.
 *
 * @return The URL of the TF.js model
 */
export declare function getURL(base: ModelArchitecture, quantizationBytes: QuantizationBytes): string;
/**
 * @param base  :: `ModelArchitecture`
 *
 * The type of model to load (either `pascal`, `cityscapes` or `ade20k`).
 *
 * @return colormap :: `[number, number, number][]`
 *
 * The list of colors in RGB format, represented as arrays and corresponding
 * to labels.
 */
export declare function getColormap(base: ModelArchitecture): Color[];
/**
 * @param base  :: `ModelArchitecture`
 *
 * The type of model to load (either `pascal`, `cityscapes` or `ade20k`).
 *
 * @return labellingScheme :: `string[]`
 *
 * The list with verbal descriptions of labels
 */
export declare function getLabels(base: ModelArchitecture): string[];
/**
 * @param input  ::
 * `ImageData|HTMLImageElement|HTMLCanvasElement| HTMLVideoElement|tf.Tensor3D`
 *
 * The input image to prepare for segmentation.
 *
 * @return resizedInput :: `string[]`
 *
 * The input tensor to run through the model.
 */
export declare function toInputTensor(input: DeepLabInput): tf.Tensor<tf.Rank>;
/**
 * @param colormap :: `Color[]`
 *
 * The list of colors in RGB format, represented as arrays and corresponding
 * to labels.
 *
 * @param labellingScheme :: `string[]`
 *
 * The list with verbal descriptions of labels
 *
 * @param rawSegmentationMap :: `tf.Tensor2D`
 *
 * The segmentation map of the image
 *
 * @param canvas (optional) :: `HTMLCanvasElement`
 *
 * The canvas where to draw the output
 *
 * @returns A promise of a `DeepLabOutput` object, with four attributes:
 *
 * - **legend** :: `{ [name: string]: [number, number, number] }`
 *
 *   The legend is a dictionary of objects recognized in the image and their
 *   colors in RGB format.
 *
 * - **height** :: `number`
 *
 *   The height of the returned segmentation map
 *
 * - **width** :: `number`
 *
 *   The width of the returned segmentation map
 *
 * - **segmentationMap** :: `Uint8ClampedArray`
 *
 *   The colored segmentation map as `Uint8ClampedArray` which can be
 *   fed into `ImageData` and mapped to a canvas.
 */
export declare function toSegmentationImage(colormap: Color[], labelNames: string[], rawSegmentationMap: tf.Tensor2D, canvas?: HTMLCanvasElement): Promise<SegmentationData>;
