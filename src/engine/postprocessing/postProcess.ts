import type { PostProcessConfig, BloomSettings, SSAOSettings, ColorGradeSettings } from '../../types';

export const DEFAULT_POST_PROCESS_CONFIG: PostProcessConfig = {
  bloom: { threshold: 0.8, intensity: 1.2, radius: 4 },
  ssao: { radius: 8, intensity: 1.5, bias: 0.025 },
  colorGrading: { contrast: 1.0, saturation: 1.0, brightness: 1.0, tint: [1.0, 1.0, 1.0] },
  chromaticAberration: false,
  filmGrain: false,
  vignette: false,
  motionBlur: false,
  volumetricLight: false,
};

/** Computes a Gaussian kernel for bloom blur. */
export function gaussianKernel1D(radius: number, sigma = radius / 2): number[] {
  const size = radius * 2 + 1;
  const kernel: number[] = [];
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    const val = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel.push(val);
    sum += val;
  }
  // Normalize
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }
  return kernel;
}

/** Multi-pass bloom approximation: extract bright pixels, blur horizontally, blur vertically, composite. */
export function applyBloom(
  pixels: number[][],
  width: number,
  height: number,
  settings: BloomSettings
): number[][] {
  // Extract bright pixels (HDR threshold)
  const bright: number[][] = [];
  for (let y = 0; y < height; y++) {
    bright[y] = [];
    for (let x = 0; x < width; x++) {
      const brightness = (pixels[y][x * 3] + pixels[y][x * 3 + 1] + pixels[y][x * 3 + 2]) / 3;
      const factor = Math.max(0, brightness - settings.threshold);
      bright[y][x * 3] = factor;
      bright[y][x * 3 + 1] = factor;
      bright[y][x * 3 + 2] = factor;
    }
  }

  const kernel = gaussianKernel1D(settings.radius);

  // Horizontal blur
  const hBlur: number[][] = [];
  for (let y = 0; y < height; y++) {
    hBlur[y] = [];
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < kernel.length; k++) {
        const ox = x + k - settings.radius;
        const sx = Math.max(0, Math.min(width - 1, ox));
        r += bright[y][sx * 3] * kernel[k];
        g += bright[y][sx * 3 + 1] * kernel[k];
        b += bright[y][sx * 3 + 2] * kernel[k];
      }
      hBlur[y][x * 3] = r;
      hBlur[y][x * 3 + 1] = g;
      hBlur[y][x * 3 + 2] = b;
    }
  }

  // Vertical blur
  const vBlur: number[][] = [];
  for (let y = 0; y < height; y++) {
    vBlur[y] = [];
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < kernel.length; k++) {
        const oy = y + k - settings.radius;
        const sy = Math.max(0, Math.min(height - 1, oy));
        r += hBlur[sy][x * 3] * kernel[k];
        g += hBlur[sy][x * 3 + 1] * kernel[k];
        b += hBlur[sy][x * 3 + 2] * kernel[k];
      }
      vBlur[y][x * 3] = r;
      vBlur[y][x * 3 + 1] = g;
      vBlur[y][x * 3 + 2] = b;
    }
  }

  // Composite bloom back onto original
  const result: number[][] = [];
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = x * 3 + c;
        result[y][idx] = Math.min(1, pixels[y][idx] + vBlur[y][idx] * settings.intensity);
      }
    }
  }

  return result;
}

/** Approximate SSAO using a simplified depth-based occlusion computation. */
export function applySSAO(
  depthMap: number[][],
  width: number,
  height: number,
  settings: SSAOSettings
): number[][] {
  const occlusion: number[][] = [];
  for (let y = 0; y < height; y++) {
    occlusion[y] = [];
    for (let x = 0; x < width; x++) {
      const centerDepth = depthMap[y][x];
      let occ = 0;
      const samples = 8;
      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2;
        const sx = x + Math.round(Math.cos(angle) * settings.radius);
        const sy = y + Math.round(Math.sin(angle) * settings.radius);
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const sampleDepth = depthMap[sy][sx];
          const diff = sampleDepth - centerDepth;
          if (diff > settings.bias) {
            occ += Math.min(1, diff * settings.intensity);
          }
        }
      }
      occlusion[y][x] = 1 - Math.min(1, occ / samples);
    }
  }
  return occlusion;
}

/** Apply color grading matrix to an RGB pixel. */
export function applyColorGrade(
  r: number,
  g: number,
  b: number,
  settings: ColorGradeSettings
): [number, number, number] {
  // Brightness
  let nr = r * settings.brightness;
  let ng = g * settings.brightness;
  let nb = b * settings.brightness;

  // Contrast (centered at 0.5)
  const contrastFactor = settings.contrast;
  nr = 0.5 + (nr - 0.5) * contrastFactor;
  ng = 0.5 + (ng - 0.5) * contrastFactor;
  nb = 0.5 + (nb - 0.5) * contrastFactor;

  // Saturation (simplified: lerp toward luminance)
  const luminance = 0.299 * nr + 0.587 * ng + 0.114 * nb;
  nr = luminance + (nr - luminance) * settings.saturation;
  ng = luminance + (ng - luminance) * settings.saturation;
  nb = luminance + (nb - luminance) * settings.saturation;

  // Tint
  nr *= settings.tint[0];
  ng *= settings.tint[1];
  nb *= settings.tint[2];

  return [
    Math.max(0, Math.min(1, nr)),
    Math.max(0, Math.min(1, ng)),
    Math.max(0, Math.min(1, nb)),
  ];
}

/** Vignette factor: 1.0 at center, approaching 0.0 at edges. */
export function vignetteFactor(
  x: number,
  y: number,
  width: number,
  height: number,
  strength = 1.0
): number {
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);
  return Math.max(0, 1 - dist * strength);
}

/** Chromatic aberration offset for a pixel position. */
export function chromaticOffset(
  x: number,
  y: number,
  width: number,
  height: number,
  strength = 1.0
): { rX: number; rY: number; bX: number; bY: number } {
  const cx = width / 2;
  const cy = height / 2;
  const dx = (x - cx) / cx;
  const dy = (y - cy) / cy;
  return {
    rX: dx * strength * 2,
    rY: dy * strength * 2,
    bX: -dx * strength * 2,
    bY: -dy * strength * 2,
  };
}

/** Film grain noise value for a pixel. */
export function filmGrainValue(x: number, y: number, intensity = 0.05): number {
  // Simple pseudo-random hash based on pixel position
  const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  const noise = (hash - Math.floor(hash)) * 2 - 1;
  return 1 + noise * intensity;
}

/** Volumetric light rays (god rays) approximation from a light source position. */
export function godRayFactor(
  px: number,
  py: number,
  lightX: number,
  lightY: number,
  width: number,
  height: number,
  intensity = 0.3
): number {
  const dx = px - lightX;
  const dy = py - lightY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(width * width + height * height);
  const falloff = Math.max(0, 1 - dist / maxDist);
  return falloff * falloff * intensity;
}

export class PostProcessManager {
  private config: PostProcessConfig;

  constructor(config: Partial<PostProcessConfig> = {}) {
    this.config = { ...DEFAULT_POST_PROCESS_CONFIG, ...config };
  }

  getConfig(): PostProcessConfig {
    return { ...this.config };
  }

  setBloom(settings: Partial<BloomSettings>): void {
    this.config.bloom = { ...this.config.bloom, ...settings };
  }

  setSSAO(settings: Partial<SSAOSettings>): void {
    this.config.ssao = { ...this.config.ssao, ...settings };
  }

  setColorGrading(settings: Partial<ColorGradeSettings>): void {
    this.config.colorGrading = { ...this.config.colorGrading, ...settings };
  }

  toggleEffect(effect: keyof Omit<PostProcessConfig, 'bloom' | 'ssao' | 'colorGrading'>): void {
    this.config[effect] = !this.config[effect] as any;
  }

  isEnabled(effect: keyof PostProcessConfig): boolean {
    const val = this.config[effect];
    return typeof val === 'boolean' ? val : true;
  }

  /** Process a full frame through the post-processing pipeline. */
  processFrame(
    pixels: number[][],
    depthMap: number[][],
    width: number,
    height: number
  ): { pixels: number[][]; ssao: number[][] } {
    let result = pixels.map((row) => [...row]);
    let ssaoResult: number[][] = [];

    if (this.isEnabled('bloom')) {
      result = applyBloom(result, width, height, this.config.bloom);
    }

    if (this.isEnabled('ssao')) {
      ssaoResult = applySSAO(depthMap, width, height, this.config.ssao);
    }

    if (this.isEnabled('colorGrading')) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = x * 3;
          const [r, g, b] = applyColorGrade(
            result[y][idx],
            result[y][idx + 1],
            result[y][idx + 2],
            this.config.colorGrading
          );
          result[y][idx] = r;
          result[y][idx + 1] = g;
          result[y][idx + 2] = b;
        }
      }
    }

    if (this.config.vignette) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const factor = vignetteFactor(x, y, width, height, 0.8);
          const idx = x * 3;
          result[y][idx] *= factor;
          result[y][idx + 1] *= factor;
          result[y][idx + 2] *= factor;
        }
      }
    }

    if (this.config.filmGrain) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const grain = filmGrainValue(x, y, 0.05);
          const idx = x * 3;
          result[y][idx] = Math.min(1, result[y][idx] * grain);
          result[y][idx + 1] = Math.min(1, result[y][idx + 1] * grain);
          result[y][idx + 2] = Math.min(1, result[y][idx + 2] * grain);
        }
      }
    }

    return { pixels: result, ssao: ssaoResult };
  }
}
