import { RNG } from './random';

export function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export function logUniform(rng: RNG, min: number, max: number) {
    const lnMin = Math.log(min);
    const lnMax = Math.log(max);
    return Math.exp(lerp(lnMin, lnMax, rng.next()));
}

export function poisson(rng: RNG, mean: number) {
    // Knuth
    const L = Math.exp(-mean);
    let k = 0, p = 1;
    do { k++; p *= rng.next(); } while (p > L);
    return k - 1;
}

export function chooseDistinctIndices(rng: RNG, n: number, k: number): number[] {
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = 0; i < k; i++) {
        const j = i + Math.floor(rng.next() * (n - i));
        [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, k);
}