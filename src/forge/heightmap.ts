import { RNG, hashSeed } from '../forge/random';

// Tiny, fast coherent-ish noise using value noise + interpolation
function smoothstep(t: number) { return t * t * (3 - 2 * t); }

export function heightAt(seed: number, x: number, y: number): number {
    // const rng = new RNG(hashSeed(seed, (Math.floor(x) << 16) ^ Math.floor(y)));
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const xf = x - x0, yf = y - y0;

    const v00 = frac(rngAt(seed, x0, y0));
    const v10 = frac(rngAt(seed, x0 + 1, y0));
    const v01 = frac(rngAt(seed, x0, y0 + 1));
    const v11 = frac(rngAt(seed, x0 + 1, y0 + 1));

    const u = smoothstep(xf);
    const v = smoothstep(yf);
    const a = lerp(v00, v10, u);
    const b = lerp(v01, v11, u);
    return lerp(a, b, v) * 2 - 1; // [-1,1]
}

function rngAt(seed: number, x: number, y: number) {
    const r = new RNG(hashSeed(seed, (x * 374761393) ^ (y * 668265263)));
    return r.next();
}
function frac(n: number) { return n - Math.floor(n); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function generateHeightmap(seed: number, size: number, octaves = 4, freq = 0.01, gain = 0.5): Float32Array {
    const data = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let amp = 1;
            let f = freq;
            let h = 0;
            for (let o = 0; o < octaves; o++) {
                h += heightAt(seed + o * 1013, x * f, y * f) * amp;
                amp *= gain;
                f *= 2;
            }
            data[y * size + x] = h / (2 - 2 ** (1 - octaves)); // normalize
        }
    }
    return data;
}