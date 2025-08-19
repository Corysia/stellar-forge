export class RNG {
    private state: number;
    constructor(seed: number) { this.state = seed >>> 0; }
    next(): number {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), 1 | t);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(min: number, max: number) { return Math.floor(this.next() * (max - min + 1)) + min; }
    float(min: number, max: number) { return this.next() * (max - min) + min; }
    bool(p = 0.5) { return this.next() < p; }
    pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
    weighted<T>(items: { item: T; w: number }[]): T {
        const sum = items.reduce((a, b) => a + b.w, 0);
        let t = this.next() * sum;
        for (const { item, w } of items) { if ((t -= w) <= 0) return item; }
        return items[items.length - 1].item;
    }
    normal(mean = 0, sd = 1): number {
        const u = 1 - this.next(); const v = 1 - this.next();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd + mean;
    }
}
export function hashSeed(seed: number, salt: number) {
    return (seed ^ ((salt + 0x9E3779B9) >>> 0)) >>> 0;
}