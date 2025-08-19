import type { StarComponent } from './models';

const SIGMA = 5.670374419e-8; // W m^-2 K^-4 (not used explicitly; using normalized approx)

export function habitableZoneAu(luminosityLsun: number) {
    const rootL = Math.sqrt(luminosityLsun);
    const inner = 0.95 * rootL;
    const outer = 1.67 * rootL;
    return { inner, outer };
}

export function keplerPeriodYears(semimajorAxisAu: number, totalMassMsun: number) {
    return Math.sqrt((semimajorAxisAu ** 3) / Math.max(1e-6, totalMassMsun));
}

export function equilibriumTempK(luminosityLsun: number, semimajorAxisAu: number, albedo: number) {
    // Normalized to Earth: 278.5 K at 1 AU, L=1, A=0.3
    const base = 278.5;
    const L14 = Math.pow(luminosityLsun, 0.25);
    const r12 = 1 / Math.sqrt(Math.max(1e-6, semimajorAxisAu));
    const alb = Math.pow(Math.max(0, 1 - albedo) / 0.7, 0.25);
    return base * L14 * r12 * alb;
}

export function systemTotalMassMsun(components: StarComponent[]) {
    return components.reduce((s, c) => s + c.massMsun, 0);
}

export function snowLineAu(luminosityLsun: number) {
    // Rough "frost line" scaling
    return 2.7 * Math.sqrt(luminosityLsun);
}

export function earthGravityGee(massEarth: number, diameterKm: number) {
    const rRe = (diameterKm / 2) / 6371;
    if (rRe <= 0) return 0;
    return massEarth / (rRe * rRe);
}