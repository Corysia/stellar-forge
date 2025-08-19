import type {
    Belt, GenerationParams, MinorBody, OrbitType, Planet, SpectralType, StarComponent, StarSystem
} from './models';
import { RNG, hashSeed } from './random';
import { pickSpectralType, approximateStarProps } from './spectra';
import { clamp, logUniform, poisson } from './distributions';
import { equilibriumTempK, habitableZoneAu, keplerPeriodYears, snowLineAu, systemTotalMassMsun, earthGravityGee } from './physics';

function makeStarComponent(rng: RNG, includeExotics?: boolean, ringedStarFraction?: number): StarComponent {
    const spectralType: SpectralType = pickSpectralType(rng, !!includeExotics);
    const props = approximateStarProps(rng, spectralType);
    const comp: StarComponent = {
        spectralType,
        massMsun: props.massMsun,
        radiusRsun: props.radiusRsun,
        luminosityLsun: props.luminosityLsun,
    };
    if (ringedStarFraction && rng.bool(ringedStarFraction)) {
        const inner = rng.float(0.01, 0.3);
        const outer = inner + rng.float(0.05, 0.5);
        comp.rings = {
            innerAu: inner,
            outerAu: outer,
            opacity: clamp(rng.normal(0.5, 0.2), 0.05, 0.95),
            inclinationDeg: rng.float(0, 30),
        };
    }
    return comp;
}

function pickOrbitType(rng: RNG, params: GenerationParams): OrbitType {
    if (rng.bool(params.wanderingFraction)) return 'Wandering';
    if (rng.bool(params.crazyOrbitFraction)) return 'Crazy';
    return rng.bool(0.07) ? 'S' : 'P'; // satellite vs primary
}

function classifyPlanet(_semimajorAu: number, massEarth: number, eqK: number): Planet['class'] {
    const cold = eqK < 200;
    const hot = eqK > 800;
    if (massEarth >= 60) return hot ? 'Hot Jupiter' : 'Gas Giant';
    if (massEarth >= 10) return cold ? 'Ice Giant' : 'Super-Earth';
    if (massEarth >= 0.1) {
        if (hot) return 'Dwarf';
        if (eqK < 230) return 'Ice World';
        if (eqK > 330) return 'Dwarf';
        return 'Terrestrial';
    }
    return 'Dwarf';
}

function chooseAtmosphere(rng: RNG, klass: Planet['class'], massEarth: number, eqK: number): { kind: Planet['atmosphere'], pressure: number } {
    if (klass === 'Gas Giant' || klass === 'Ice Giant' || klass === 'Hot Jupiter') {
        return { kind: 'Hydrogen-Helium', pressure: rng.float(100, 1000) };
    }
    if (massEarth < 0.2 || eqK > 700) return { kind: 'None', pressure: 0 };
    if (eqK > 350) return { kind: 'Toxic', pressure: rng.float(1, 20) };
    if (eqK >= 260 && eqK <= 320 && massEarth >= 0.5 && massEarth <= 5) {
        // chance for breathable
        const breathable = rng.bool(0.35);
        return { kind: breathable ? 'Breathable' : 'Thin', pressure: breathable ? rng.float(0.6, 1.8) : rng.float(0.1, 0.8) };
    }
    return { kind: rng.bool(0.5) ? 'Thin' : 'Thick', pressure: rng.float(0.2, 5) };
}

function planetHazards(_rng: RNG, p: Planet): string[] {
    const hz: string[] = [];
    if (p.atmosphere === 'None') hz.push('Vacuum');
    if (p.atmosphere === 'Toxic') hz.push('Toxic Atmosphere');
    if (p.equilibriumTempK < 180) hz.push('Cryogenic');
    if (p.equilibriumTempK > 380) hz.push('Extreme Heat');
    if (p.tidalLocked) hz.push('Tidal Lock');
    if (p.atmosphere === 'Hydrogen-Helium' && p.class === 'Hot Jupiter') hz.push('Radiation Belts');
    if (p.eccentricity > 0.4) hz.push('Climate Extremes');
    if (p.gravityGee > 1.8) hz.push('High Gravity');
    if (p.gravityGee < 0.3) hz.push('Low Gravity');
    return hz;
}

function addBelts(rng: RNG, starIndex: number, lsun: number, beltProbability: number): Belt[] {
    const belts: Belt[] = [];
    if (!beltProbability) return belts;
    const frost = snowLineAu(lsun);
    if (rng.bool(beltProbability)) {
        const inner = rng.float(frost * 0.6, frost * 0.9);
        const outer = inner + rng.float(0.2, 1.0);
        belts.push({
            id: cryptoId(rng),
            name: 'Main Belt',
            type: 'Asteroid',
            parentIndex: starIndex,
            innerAu: inner,
            outerAu: outer,
            massEarth: rng.float(0.0001, 0.05),
            inclinationDeg: rng.float(0, 10),
            eccentricity: rng.float(0, 0.2),
        });
    }
    if (rng.bool(beltProbability * 0.7)) {
        const inner = rng.float(frost * 2.5, frost * 4.5);
        const outer = inner + rng.float(5, 20);
        belts.push({
            id: cryptoId(rng),
            name: 'Kuiper Belt',
            type: 'Kuiper',
            parentIndex: starIndex,
            innerAu: inner,
            outerAu: outer,
            massEarth: rng.float(0.01, 0.2),
            inclinationDeg: rng.float(0, 20),
            eccentricity: rng.float(0, 0.3),
        });
    }
    return belts;
}

function cryptoId(rng: RNG) {
    // Short, readable ids
    return Math.floor(rng.next() * 36 ** 6).toString(36);
}

export function forgeSystem(
    seed: number,
    name: string,
    positionPc: { x: number; y: number; z: number },
    params: GenerationParams
): StarSystem {
    const rng = new RNG(seed >>> 0);

    // Stellar multiplicity
    const multRoll = rng.next();
    const nStars = multRoll < params.trinaryFraction ? 3 : multRoll < (params.trinaryFraction + params.binaryFraction) ? 2 : 1;

    const components: StarComponent[] = [];
    for (let i = 0; i < nStars; i++) {
        const compRng = new RNG(hashSeed(seed, 100 + i));
        components.push(makeStarComponent(compRng, !!params.includeExotics, params.ringedStarFraction));
    }

    const systemPlane = randomUnitVector(rng);

    // Orbits and planets (around primary for simplicity; satellites marked via orbitType)
    const totalMass = systemTotalMassMsun(components);
    const primaryLum = components[0]?.luminosityLsun ?? 1;

    const hab = habitableZoneAu(primaryLum);
    const frost = snowLineAu(primaryLum);

    const planets: Planet[] = [];
    const belts = addBelts(new RNG(hashSeed(seed, 0xB17)), 0, primaryLum, params.beltProbability ?? 0.5);

    // Log-spaced lanes
    const N = params.planetCount;
    let a = logUniform(rng, 0.03, 0.3);

    for (let i = 0; i < N; i++) {
        const laneScale = rng.float(1.3, 2.1);
        if (i > 0) a *= laneScale;

        const e = clamp(Math.abs(rng.normal(0.05, 0.08)), 0, 0.8);
        const inc = clamp(Math.abs(rng.normal(2, 3)), 0, 60);
        const orbitType = pickOrbitType(rng, params);

        // Mass model: small inside frost line, giants beyond
        const mass = a < frost ? Math.max(0.02, rng.normal(0.8, 0.6)) : Math.max(1, rng.normal(50, 40));
        const albedo = clamp(rng.normal(a < frost ? 0.25 : 0.45, 0.1), 0.02, 0.9);
        const eqK = equilibriumTempK(primaryLum, a, albedo);
        const klass = classifyPlanet(a, mass, eqK);

        // Size and gravity approx
        // Mass-radius rough scaling for rocky vs gas/ice
        let diameterKm: number;
        if (klass === 'Gas Giant' || klass === 'Hot Jupiter' || klass === 'Ice Giant') {
            const re = clamp(3 + rng.normal(0, 0.5), 2, 12); // in Earth radii
            diameterKm = re * 2 * 6371;
        } else if (klass === 'Super-Earth') {
            const re = clamp(1.5 + rng.normal(0, 0.3), 1.2, 2.2);
            diameterKm = re * 2 * 6371;
        } else if (klass === 'Terrestrial' || klass === 'Ocean World' || klass === 'Ice World') {
            const re = clamp(1 + rng.normal(0, 0.25), 0.5, 1.8);
            diameterKm = re * 2 * 6371;
        } else {
            const re = clamp(0.3 + rng.normal(0, 0.15), 0.1, 0.8);
            diameterKm = re * 2 * 6371;
        }

        const gravityGee = earthGravityGee(mass, diameterKm);
        const atmo = chooseAtmosphere(rng, klass, mass, eqK);
        const period = keplerPeriodYears(a, totalMass);
        const rot = Math.max(4, Math.abs(rng.normal(18, 10)));
        const tidalLocked = (a < 0.08 && (klass === 'Terrestrial' || klass === 'Dwarf' || klass === 'Ocean World')) || (period < 0.1);

        const inHabZone = a >= hab.inner && a <= hab.outer;

        const p: Planet = {
            id: cryptoId(rng),
            name: planetName(name, i, rng),
            class: klass,
            orbitType,
            parentIndex: 0,
            semimajorAxisAu: a,
            eccentricity: e,
            inclinationDeg: inc,
            longitudeAscNodeDeg: rng.float(0, 360),
            argPeriapsisDeg: rng.float(0, 360),
            orbitalPeriodYears: period,
            rotationHours: tidalLocked ? period * 365.25 * 24 : rot,
            tidalLocked,
            axialTiltDeg: clamp(Math.abs(rng.normal(23, 12)), 0, 175),
            diameterKm,
            massEarth: mass,
            gravityGee,
            atmosphere: atmo.kind,
            surfacePressureBar: atmo.pressure,
            albedo,
            equilibriumTempK: eqK,
            landable: !(klass === 'Gas Giant' || klass === 'Hot Jupiter' || klass === 'Ice Giant'),
            hazards: [],
            inHabitableZone: inHabZone,
            terrainSeed: hashSeed(seed, 0xCAFE0000 + i),
            biomeHint: inHabZone && atmo.kind === 'Breathable' ? 'Temperate' : eqK < 200 ? 'Frozen' : eqK > 400 ? 'Desert' : undefined,
        };

        p.hazards = planetHazards(rng, p);
        planets.push(p);
    }

    // Notables (minor bodies)
    const notables = forgeNotables(new RNG(hashSeed(seed, 0xDEAD)), params.notableBodiesMean ?? 3, totalMass);

    return {
        id: seed >>> 0,
        name,
        positionPc,
        components,
        systemPlane,
        planets,
        belts,
        notables,
        notes: [],
    };
}

function forgeNotables(rng: RNG, mean: number, massMsun: number): MinorBody[] {
    const count = poisson(rng, mean);
    const arr: MinorBody[] = [];
    for (let i = 0; i < count; i++) {
        const a = logUniform(rng, 0.1, 60);
        const e = clamp(Math.abs(rng.normal(0.2, 0.15)), 0, 0.97);
        const inc = clamp(Math.abs(rng.normal(10, 8)), 0, 60);
        const diam = Math.max(5, Math.abs(rng.normal(80, 120)));
        const massEarth = diam < 1000 ? rng.float(1e-9, 1e-7) : rng.float(1e-6, 5e-4);
        const classType: MinorBody['class'] = diam > 800 ? 'DwarfPlanet' : rng.bool(0.4) ? 'Comet' : 'Asteroid';
        const comp: MinorBody['composition'][number][] =
            classType === 'Comet' ? ['Icy', 'Volatile'] : rng.bool(0.5) ? ['Rock', 'Metal'] : ['Carbonaceous'];

        arr.push({
            id: cryptoId(rng),
            name: classType === 'Comet' ? `C/${yearish(rng)} ${word(rng, 2)}` : word(rng, 1),
            class: classType,
            composition: comp,
            orbitType: 'P',
            parentIndex: 0,
            semimajorAxisAu: a,
            eccentricity: e,
            inclinationDeg: inc,
            longitudeAscNodeDeg: rng.float(0, 360),
            argPeriapsisDeg: rng.float(0, 360),
            orbitalPeriodYears: keplerPeriodYears(a, massMsun),
            rotationHours: Math.max(3, Math.abs(rng.normal(12, 8))),
            diameterKm: diam,
            massEarth,
            gravityGee: 0, // negligible
            landable: true,
        });
    }
    return arr;
}

function randomUnitVector(rng: RNG) {
    const z = rng.float(-1, 1);
    const t = rng.float(0, Math.PI * 2);
    const r = Math.sqrt(1 - z * z);
    return { x: r * Math.cos(t), y: r * Math.sin(t), z };
}

function planetName(sysName: string, idx: number, _rng: RNG) {
    const suffix = String.fromCharCode(97 + idx); // a, b, c
    return `${sysName} ${suffix}`;
}

function word(rng: RNG, syll: number) {
    const c = 'bcdfghjklmnpqrstvwxyz';
    const v = 'aeiouy';
    let s = '';
    for (let i = 0; i < syll; i++) {
        s += c[Math.floor(rng.next() * c.length)];
        s += v[Math.floor(rng.next() * v.length)];
    }
    return s[0].toUpperCase() + s.slice(1);
}

function yearish(rng: RNG) {
    return 1900 + Math.floor(rng.next() * 200);
}