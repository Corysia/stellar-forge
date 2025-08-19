import { RNG } from './random';
import type { SpectralType, StarComponent } from './models';

type SpecWeight = { item: SpectralType; w: number };

const MAIN_SEQ_WEIGHTS: SpecWeight[] = [
    { item: 'M', w: 76 },
    { item: 'K', w: 12 },
    { item: 'G', w: 7 },
    { item: 'F', w: 3 },
    { item: 'A', w: 1.5 },
    { item: 'B', w: 0.4 },
    { item: 'O', w: 0.1 },
];

const EXOTIC_WEIGHTS: SpecWeight[] = [
    { item: 'WD', w: 1.2 },
    { item: 'WR', w: 0.2 },
    { item: 'NS', w: 0.2 },
    { item: 'BD', w: 1.5 },
    { item: 'BH', w: 0.05 },
    { item: 'C', w: 0.05 },
];

export function pickSpectralType(rng: RNG, includeExotics = true): SpectralType {
    const exoChance = includeExotics ? 0.03 : 0;
    if (rng.bool(exoChance)) {
        return rng.weighted(EXOTIC_WEIGHTS);
    }
    return rng.weighted(MAIN_SEQ_WEIGHTS);
}

export function sampleMainSequenceMass(rng: RNG, t: SpectralType): number {
    // Very rough mass ranges (Msun)
    switch (t) {
        case 'O': return rng.float(16, 60);
        case 'B': return rng.float(2.1, 16);
        case 'A': return rng.float(1.4, 2.1);
        case 'F': return rng.float(1.04, 1.4);
        case 'G': return rng.float(0.8, 1.04);
        case 'K': return rng.float(0.45, 0.8);
        case 'M': return rng.float(0.08, 0.45);
        default: return rng.float(0.8, 1.04);
    }
}

export function approximateStarProps(rng: RNG, t: SpectralType): Pick<StarComponent, 'massMsun' | 'radiusRsun' | 'luminosityLsun'> {
    if (t === 'WD') {
        const mass = rng.float(0.5, 1.1);
        const radius = rng.float(0.012, 0.015); // ~Earth radius
        const lum = rng.float(0.0001, 0.01);
        return { massMsun: mass, radiusRsun: radius, luminosityLsun: lum };
    }
    if (t === 'NS') {
        const mass = rng.float(1.1, 2.2);
        const radius = 2e-5; // ~10 km
        const lum = rng.float(1e-6, 1e-4); // effectively dark here
        return { massMsun: mass, radiusRsun: radius, luminosityLsun: lum };
    }
    if (t === 'BH') {
        const mass = rng.float(3, 20);
        const radius = mass * 2.95 / 695700; // Schwarzschild radius in Rsun (approx)
        const lum = 0; // unless accreting (handled as a disk/belt later)
        return { massMsun: mass, radiusRsun: radius, luminosityLsun: lum };
    }
    if (t === 'BD') {
        const mass = rng.float(0.01, 0.08);
        const radius = rng.float(0.09, 0.12); // ~Jupiter-ish
        const lum = rng.float(1e-5, 5e-4);
        return { massMsun: mass, radiusRsun: radius, luminosityLsun: lum };
    }
    if (t === 'WR') {
        const mass = rng.float(10, 25);
        const radius = rng.float(1, 5);
        const lum = rng.float(1e4, 5e5); // very bright
        return { massMsun: mass, radiusRsun: radius, luminosityLsun: lum };
    }
    if (t === 'C') {
        // Carbon stars are evolved giants; rough averages.
        const mass = rng.float(1.5, 4);
        const radius = rng.float(50, 300);
        const lum = rng.float(1e3, 1e4);
        return { massMsun: mass, radiusRsun: radius, luminosityLsun: lum };
    }
    // Main sequence approximation
    const m = sampleMainSequenceMass(rng, t);
    const r = Math.pow(m, 0.8);
    const l = Math.pow(m, 3.5);
    return { massMsun: m, radiusRsun: r, luminosityLsun: l };
}