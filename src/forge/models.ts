export type SpectralType =
    | 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M'
    | 'C'    // carbon star
    | 'WR'   // Wolf–Rayet
    | 'WD'   // white dwarf
    | 'NS'   // neutron star
    | 'BD'   // brown dwarf
    | 'BH';  // black hole

export type OrbitType = 'S' | 'P' | 'Crazy' | 'Wandering';

export interface GenerationParams {
    seed: number;
    starCount: number;
    planetCount: number;
    volumeSizePc: number;
    binaryFraction: number;
    trinaryFraction: number;
    crazyOrbitFraction: number;
    wanderingFraction: number;
    includeExotics?: boolean;
    ringedStarFraction?: number;
    beltProbability?: number;
    notableBodiesMean?: number;
}

export interface GalaxyParams {
    galaxySeed: number;
    sectorSizePc: number;
    originPc: { x: number; y: number; z: number };
    diskScaleLenKpc: number;
    diskScaleHeightKpc: number;
    bulgeScaleKpc: number;
    spiralArms: number;
    spiralAmplitude: number;
    spiralK: number;
    localNormalization: number;
}

export interface SectorCoord { x: number; y: number; z: number; }
export interface SectorKey { x: number; y: number; z: number; sizePc: number; }

export interface Sector {
    key: SectorKey;
    starHeaders: StarHeader[];
    systems?: StarSystem[];
}

export interface StarHeader {
    id: number;
    systemName: string;
    positionPc: { x: number; y: number; z: number };
    components: StarComponent[];
}

export interface StarSystem {
    id: number;
    name: string;
    positionPc: { x: number; y: number; z: number };
    components: StarComponent[];
    systemPlane: { x: number; y: number; z: number };
    planets: Planet[];
    belts: Belt[];
    notables: MinorBody[];
    notes?: string[];
}

export interface StarComponent {
    spectralType: SpectralType;
    massMsun: number;
    radiusRsun: number;
    luminosityLsun: number;
    rings?: {
        innerAu: number;
        outerAu: number;
        opacity: number;
        inclinationDeg: number;
    };
}

export interface Planet {
    id: string;
    name: string;
    class: 'Terrestrial' | 'Super-Earth' | 'Dwarf' | 'Ice Giant' | 'Gas Giant' | 'Hot Jupiter' | 'Ice World' | 'Ocean World';
    orbitType: OrbitType;
    parentIndex: number;
    semimajorAxisAu: number;
    eccentricity: number;
    inclinationDeg: number;
    longitudeAscNodeDeg: number;
    argPeriapsisDeg: number;
    orbitalPeriodYears: number;
    rotationHours: number;
    tidalLocked: boolean;
    axialTiltDeg: number;
    diameterKm: number;
    massEarth: number;
    gravityGee: number;
    atmosphere: 'None' | 'Thin' | 'Breathable' | 'Thick' | 'Toxic' | 'Hydrogen-Helium';
    surfacePressureBar: number;
    albedo: number;
    equilibriumTempK: number;
    landable: boolean;
    hazards: string[];
    inHabitableZone: boolean;
    terrainSeed?: number;
    biomeHint?: string;
}

export interface Belt {
    id: string;
    name: string;
    type: 'Asteroid' | 'Debris' | 'Kuiper' | 'FallbackDisk' | 'AccretionDisk';
    parentIndex: number;
    innerAu: number;
    outerAu: number;
    massEarth: number;
    inclinationDeg: number;
    eccentricity: number;
}

export interface MinorBody {
    id: string;
    name: string;
    class: 'Asteroid' | 'Comet' | 'DwarfPlanet';
    composition: ('Rock' | 'Metal' | 'Carbonaceous' | 'Icy' | 'Volatile')[];
    orbitType: OrbitType;
    parentIndex: number;
    semimajorAxisAu: number;
    eccentricity: number;
    inclinationDeg: number;
    longitudeAscNodeDeg: number;
    argPeriapsisDeg: number;
    orbitalPeriodYears: number;
    rotationHours: number;
    diameterKm: number;
    massEarth: number;
    gravityGee: number;
    landable: boolean;
}