/**
 * Image preprocessing utilities for medicine label photos
 * Improves OCR accuracy via binarization, noise reduction, and contrast enhancement
 */

export interface PreprocessingOptions {
  brightness: number; // -100 to 100, default 0
  contrast: number;   // -100 to 100, default 20
  binarize: boolean;  // enable black & white thresholding
  binarizationThreshold: number; // 0 to 255, default 128 (or Otsu)
  grayscale: boolean; // default true
  noiseReduction: boolean; // 3x3 median/box blur
  invert: boolean; // invert colors (useful for dark packaging with light text)
}

export const DEFAULT_PREPROCESSING_OPTIONS: PreprocessingOptions = {
  brightness: 5,
  contrast: 25,
  binarize: false,
  binarizationThreshold: 128,
  grayscale: true,
  noiseReduction: true,
  invert: false
};

/**
 * Apply image adjustments directly onto an HTML Canvas ImageData
 */
export function applyImageFilters(
  imageData: ImageData,
  options: PreprocessingOptions
): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Factor for contrast: [-100..100] -> [0..2]
  const contrastFactor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));
  const brightnessOffset = (options.brightness * 255) / 100;

  // 1. Grayscale, Brightness & Contrast
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (options.grayscale || options.binarize) {
      // Luminance formula (ITU-R BT.601)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // Apply brightness
    r += brightnessOffset;
    g += brightnessOffset;
    b += brightnessOffset;

    // Apply contrast
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // Clamp
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // Binarization (thresholding)
    if (options.binarize) {
      const v = (r + g + b) / 3 >= options.binarizationThreshold ? 255 : 0;
      r = v;
      g = v;
      b = v;
    }

    // Invert if dark background
    if (options.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  // 2. Simple 3x3 Noise Reduction (light smoothing on text edges)
  if (options.noiseReduction && width > 2 && height > 2) {
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        // 3x3 box average for luminance channel
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            sum += copy[neighborIdx];
          }
        }
        const avg = Math.round(sum / 9);
        data[idx] = avg;
        data[idx + 1] = avg;
        data[idx + 2] = avg;
      }
    }
  }

  return imageData;
}

/**
 * Calculates optimal Otsu threshold for binarization from luminance histogram
 */
export function calculateOtsuThreshold(imageData: ImageData): number {
  const data = imageData.data;
  const histogram = new Array(256).fill(0);
  const totalPixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  return threshold;
}
