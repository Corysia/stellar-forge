import type { GalaxyParams } from './models';

// Simple exponential disk with spiral modulation and vertical scale height
export function localStarDensityPerPc3(p: { x: number; y: number; z: number }, gp: GalaxyParams): number {
    // Convert to kpc for galactic scales
    const xk = p.x / 1000 - gp.originPc.x / 1000;
    const yk = p.y / 1000 - gp.originPc.y / 1000;
    const zk = p.z / 1000 - gp.originPc.z / 1000;

    const r = Math.sqrt(xk * xk + yk * yk);
    const theta = Math.atan2(yk, xk);

    const radial = Math.exp(-r / Math.max(0.1, gp.diskScaleLenKpc));
    const vertical = Math.exp(-Math.abs(zk) / Math.max(0.05, gp.diskScaleHeightKpc));

    // Spiral arms modulation: A * cos(k * ln r - m theta)
    const m = Math.max(1, gp.spiralArms | 0);
    const k = gp.spiralK;
    const amp = gp.spiralAmplitude;
    const spiral = 1 + amp * Math.cos(k * Math.log(Math.max(0.1, r)) - m * theta);

    // Bulge near center
    const bulge = Math.exp(-r / Math.max(0.1, gp.bulgeScaleKpc));

    // Normalize to a local density multiplier
    const base = radial * vertical * spiral + 0.2 * bulge;
    return base * gp.localNormalization;
}