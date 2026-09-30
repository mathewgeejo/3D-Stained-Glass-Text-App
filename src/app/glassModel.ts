import { FONT } from './utils/font';

export type Artwork = { width: number; height: number; cells: (string | null)[] };
export const palettes: Record<string, string[]> = {
  Cathedral: ['#ed2949', '#ee861e', '#f3c952', '#293abe', '#6953ce', '#30a99a'],
  Ember: ['#bd292b', '#ed6331', '#f8a348', '#ffe1a0', '#952552', '#da5783'],
  Aurora: ['#303dab', '#697be7', '#9a4fc3', '#3ca8c2', '#7fd5bd', '#b2c9ee'],
  Botanical: ['#336960', '#7ab678', '#c9ce71', '#eecc74', '#5c889e', '#aa6084'],
  Crystal: ['#becce7', '#e0e9ef', '#859abe', '#ebe2dc', '#adc7c5', '#cbb9de'],
};
export interface StudioSettings {
  mode: 'text' | 'window' | 'art'; text: string; palette: string; seed: number;
  azimuth: number; elevation: number; intensity: number; warmth: number; sunSize: number;
  haze: number; anisotropy: number; thickness: number; roughness: number; lead: number;
  bloom: number; exposure: number; ambient: number; floor: number; size: number;
  cameraYaw: number; cameraHeight: number; zoom: number; animate: boolean; speed: number;
  quality: 'draft' | 'high';
}
export const defaults: StudioSettings = {
  mode: 'window', text: 'TAKE TWO', palette: 'Cathedral', seed: 3,
  azimuth: -22, elevation: 38, intensity: 5, warmth: 0.3, sunSize: 0.6,
  haze: 0.12, anisotropy: 0.35, thickness: 0.7, roughness: 0.2, lead: 0.09,
  bloom: 0.22, exposure: 1.2, ambient: 0.13, floor: 0.65, size: 1,
  cameraYaw: 18, cameraHeight: 2, zoom: 1, animate: false, speed: 0.5, quality: 'high',
};
export const lightingPresets: Record<string, Partial<StudioSettings>> = {
  'Cathedral morning': { azimuth: -22, elevation: 38, intensity: 5, warmth: 0.3, sunSize: 0.6, haze: 0.12, anisotropy: 0.35, ambient: 0.13, exposure: 1.2 },
  'Golden hour': { azimuth: 24, elevation: 22, intensity: 6, warmth: 0.85, sunSize: 0.8, haze: 0.16, anisotropy: 0.45, ambient: 0.08, exposure: 1.25 },
  'Clear daylight': { azimuth: -10, elevation: 52, intensity: 6, warmth: 0.05, sunSize: 0.53, haze: 0.015, anisotropy: 0.2, ambient: 0.22, exposure: 1 },
  'Misty chapel': { azimuth: -32, elevation: 32, intensity: 6, warmth: 0.15, sunSize: 1.2, haze: 0.25, anisotropy: 0.55, ambient: 0.08, exposure: 1.4 },
};
export function blankArtwork(width = 24, height = 32): Artwork {
  return { width, height, cells: Array(width * height).fill(null) };
}
export function templateArtwork(template: string, paletteName = 'Cathedral', n = 24): Artwork {
  const height = template === 'Rose' || template === 'Pixel heart' ? n : Math.round(n * 4 / 3);
  const art = blankArtwork(n, height), colors = palettes[paletteName] || palettes.Cathedral;
  for (let y = 0; y < height; y++) for (let x = 0; x < n; x++) {
    const u = (x + 0.5) / n * 2 - 1, v = (y + 0.5) / height;
    const radius = Math.hypot(u, (v - 0.5) * 2);
    let inside = true, index = Math.floor(x / 3) + Math.floor(y / 4);
    if (template === 'Gothic') {
      inside = Math.abs(u) < 0.86 && v > 0.04 + 0.33 * Math.abs(u) ** 1.5 && v < 0.96;
      const rose = Math.hypot(u, (v - 0.33) * 2.4);
      index = rose < 0.44 ? Math.floor((Math.atan2(v - 0.33, u) + Math.PI) * 3) : Math.floor(x / 4) + Math.floor(y / 5) * 2;
      if (Math.abs(u) < 0.035 && v > 0.5) inside = false;
    } else if (template === 'Rose') {
      inside = radius < 0.94 && radius > 0.06;
      index = Math.floor((Math.atan2((v - 0.5) * 2, u) + Math.PI) / Math.PI * 6) + Math.floor(radius * 5);
    } else if (template === 'Pixel heart') {
      const hx = u * 1.3, hy = (0.5 - v) * 2.6;
      inside = (hx * hx + hy * hy - 0.65) ** 3 - hx * hx * hy ** 3 < 0;
      index = Math.floor(v * 8);
    } else if (template === 'Diamond') {
      inside = Math.abs(u) + Math.abs(v - 0.5) * 1.7 < 0.94;
      index = Math.floor((Math.abs(u) + Math.abs(v - 0.5) * 2) * 10);
    }
    if (inside) art.cells[y * n + x] = colors[((index % colors.length) + colors.length) % colors.length];
  }
  return art;
}
export function textArtwork(text: string, paletteName: string, seed: number): Artwork {
  const glyphs = Array.from(text.toUpperCase()).map(char => {
    if (FONT[char]) return FONT[char];
    const canvas = document.createElement('canvas'); canvas.width = 12; canvas.height = 14;
    const ctx = canvas.getContext('2d')!; ctx.font = 'bold 12px monospace'; ctx.textBaseline = 'top'; ctx.fillStyle = '#fff'; ctx.fillText(char, 0, 0);
    const data = ctx.getImageData(0, 0, 12, 14).data;
    return Array.from({ length: 7 }, (_, y) => Array.from({ length: 6 }, (_, x) => Number(data[((y * 2 + 1) * 12 + x * 2) * 4 + 3] > 80)));
  });
  const width = Math.max(1, glyphs.reduce((n, g) => n + g[0].length + 1, 0) - 1);
  const art = blankArtwork(width, 7), colors = palettes[paletteName] || palettes.Cathedral;
  let offset = 0;
  for (const g of glyphs) {
    g.forEach((row, y) => row.forEach((active, x) => {
      const hash = Math.sin((offset + x) * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
      if (active) art.cells[y * width + offset + x] = colors[Math.floor((hash - Math.floor(hash)) * colors.length)];
    })); offset += g[0].length + 1;
  }
  return art;
}

export function validateProject(value: unknown): { settings: StudioSettings; artwork: Artwork } {
  const v = value as { version?: number; settings?: StudioSettings; artwork?: Artwork };
  if (!v || v.version !== 2 || !v.settings || !v.artwork) throw new Error('Choose a Stained Glass Studio project (.json).');
  const a = v.artwork;
  if (!Number.isInteger(a.width) || !Number.isInteger(a.height) || a.width < 1 || a.width > 256 || a.height < 1 || a.height > 64 || !Array.isArray(a.cells) || a.cells.length !== a.width * a.height || a.cells.some(c => c !== null && (typeof c !== 'string' || !/^#[\da-f]{6}$/i.test(c)))) throw new Error('This project has an invalid pixel grid.');
  const s = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof StudioSettings)[]) {
    const incoming = v.settings[key];
    if (typeof incoming !== typeof defaults[key] || (typeof incoming === 'number' && !Number.isFinite(incoming))) throw new Error('This project contains invalid settings.');
    Object.assign(s, { [key]: incoming });
  }
  if (!['text', 'window', 'art'].includes(s.mode) || !['draft', 'high'].includes(s.quality) || !palettes[s.palette] || s.text.length > 32) throw new Error('Unsupported project settings.');
  const limits: Partial<Record<keyof StudioSettings, [number, number]>> = { azimuth: [-65, 65], elevation: [12, 75], intensity: [0, 12], warmth: [0, 1], sunSize: [0, 5], haze: [0, 0.5], anisotropy: [-0.3, 0.8], thickness: [0.1, 2.5], roughness: [0, 1], lead: [0, 0.3], bloom: [0, 1.5], exposure: [0.3, 3], ambient: [0, 0.5], floor: [0, 1], size: [0.4, 1.4], cameraYaw: [-45, 45], cameraHeight: [0, 5], zoom: [0.65, 1.6], speed: [0.1, 2] };
  for (const [key, [min, max]] of Object.entries(limits)) Object.assign(s, { [key]: Math.max(min, Math.min(max, Number(s[key as keyof StudioSettings]))) });
  return { settings: s, artwork: { ...a, cells: [...a.cells] } };
}
