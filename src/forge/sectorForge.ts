import type { GalaxyParams, GenerationParams, Sector, SectorKey, StarHeader } from './models';
import { RNG, hashSeed } from './random';
import { localStarDensityPerPc3 } from './density';
import { forgeSystem } from './forge';
import { poisson } from './distributions';

export function sectorKey(x: number, y: number, z: number, sizePc: number): SectorKey {
    return { x, y, z, sizePc };
}

export function generateSectorHeaders(galaxySeed: number, key: SectorKey, gp: GalaxyParams): Sector {
    const rng = new RNG(hashSeed(galaxySeed, key.x * 73856093 ^ key.y * 19349663 ^ key.z * 83492791));
    const center = {
        x: (key.x + 0.5) * key.sizePc,
        y: (key.y + 0.5) * key.sizePc,
        z: (key.z + 0.5) * key.sizePc,
    };
    const density = localStarDensityPerPc3(center, gp);
    const volumePc3 = key.sizePc ** 3;
    const expectedStars = density * volumePc3;

    const count = Math.max(0, poisson(rng, Math.max(0.1, expectedStars)));
    const starHeaders: StarHeader[] = [];
    for (let i = 0; i < count; i++) {
        const local = {
            x: (key.x * key.sizePc) + rng.float(0, key.sizePc),
            y: (key.y * key.sizePc) + rng.float(0, key.sizePc),
            z: (key.z * key.sizePc) + rng.float(0, key.sizePc),
        };
        const id = (hashSeed(galaxySeed, (key.x << 20) ^ (key.y << 10) ^ key.z) ^ i) >>> 0;
        starHeaders.push({
            id,
            systemName: systemName(rng),
            positionPc: local,
            components: [], // lazy-filled if needed; full systems generated on demand
        });
    }

    return { key, starHeaders };
}

export function expandStarHeaderToSystem(header: StarHeader, gen: GenerationParams): ReturnType<typeof forgeSystem> {
    const sysSeed = header.id;
    return forgeSystem(sysSeed, header.systemName, header.positionPc, gen);
}

function systemName(rng: RNG) {
    // Short alphanumeric sectorish names
    const a = Math.floor(rng.next() * 26);
    const b = Math.floor(rng.next() * 26);
    const n = Math.floor(rng.next() * 900) + 100;
    return `${String.fromCharCode(65 + a)}${String.fromCharCode(65 + b)}-${n}`;
}