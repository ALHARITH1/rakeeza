/**
 * White-label branding: each company's logo drives the whole platform's accent colour.
 * The platform's accent is Tailwind's "amber" scale, so re-defining those CSS variables
 * on <html> re-themes every button, badge, highlight and chart accent at once.
 */

export interface BrandInfo { name: string; logoDataUrl?: string; brandColor?: string; shortName?: string }

const DEFAULT_ACCENT = '#bf8b39';

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return [38, 92, 50];
  const [r, g, b] = m.map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

const hsl = (h: number, s: number, l: number) => `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%)`;

/** Shades tuned for the dark UI: keeps dark text on accent buttons readable whatever the logo colour is */
export function brandPalette(hex: string) {
  const [h, s0] = hexToHsl(hex);
  const s = Math.max(45, Math.min(78, s0)); // grey logos still get a visible accent
  return {
    '--color-amber-300': hsl(h, s, 72),
    '--color-amber-400': hsl(h, s, 62),
    '--color-amber-500': hsl(h, s, 54),
    '--color-amber-600': hsl(h, s, 45),
    '--color-amber-950': hsl(h, s, 12)
  } as Record<string, string>;
}

export function applyBrand(brand: BrandInfo | null) {
  const root = document.documentElement;
  const vars = ['--color-amber-300', '--color-amber-400', '--color-amber-500', '--color-amber-600', '--color-amber-950'];
  if (!brand?.brandColor || brand.brandColor.toLowerCase() === DEFAULT_ACCENT) {
    vars.forEach((v) => root.style.removeProperty(v));
  } else {
    Object.entries(brandPalette(brand.brandColor)).forEach(([k, v]) => root.style.setProperty(k, v));
  }
  document.title = brand?.name ? `${brand.name} — إدارة عمليات المقاولات` : 'ركيزة | إدارة عمليات المقاولات';
  // favicon = company logo
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (brand?.logoDataUrl) {
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = brand.logoDataUrl;
  } else if (link) link.remove();
}

/** Pick the dominant, most "brand-like" colour of a logo (ignores white, black, grey and transparent pixels) */
export function extractBrandColor(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const N = 64;
        const c = document.createElement('canvas');
        c.width = N; c.height = N;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, N, N);
        const d = ctx.getImageData(0, 0, N, N).data;
        const buckets = new Map<number, { n: number; r: number; g: number; b: number; sat: number }>();
        for (let i = 0; i < d.length; i += 4) {
          const [r, g, b, a] = [d[i], d[i + 1], d[i + 2], d[i + 3]];
          if (a < 128) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const l = (max + min) / 510, sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
          if (sat < 0.25 || l > 0.92 || l < 0.08) continue; // skip greys, white, black
          const [h] = hexToHsl('#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join(''));
          const key = Math.round(h / 15);
          const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0, sat: 0 };
          e.n++; e.r += r; e.g += g; e.b += b; e.sat += sat;
          buckets.set(key, e);
        }
        let best: { n: number; r: number; g: number; b: number; sat: number } | null = null;
        buckets.forEach((e) => { if (!best || e.n * (0.5 + e.sat / e.n) > best.n * (0.5 + best.sat / best.n)) best = e; });
        if (!best) return resolve(DEFAULT_ACCENT);
        const bb = best as { n: number; r: number; g: number; b: number };
        resolve('#' + [bb.r, bb.g, bb.b].map((x) => Math.round(x / bb.n).toString(16).padStart(2, '0')).join(''));
      } catch {
        resolve(DEFAULT_ACCENT);
      }
    };
    img.onerror = () => resolve(DEFAULT_ACCENT);
    img.src = dataUrl;
  });
}

/** Read a logo file, downscale it (keeps storage small) and return a data URL */
export function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('الملف ليس صورة'));
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      if (file.type === 'image/svg+xml') return resolve(src);
      const img = new Image();
      img.onload = () => {
        const max = 256;
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('تعذر قراءة الصورة'));
      img.src = src;
    };
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

export const DEFAULT_BRAND_COLOR = DEFAULT_ACCENT;
