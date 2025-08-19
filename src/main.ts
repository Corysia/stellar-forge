// src/main.ts
import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    // HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    Color3,
    TransformNode
} from "@babylonjs/core";
import { generateSectorHeaders, expandStarHeaderToSystem } from "./forge/sectorForge";
import type { GalaxyParams, GenerationParams } from "./forge/models";
import { GalaxyMinimap } from "./render/GalaxyMinimap";

const MAIN_LAYER = 0x1;
const MINIMAP_LAYER = 0x2;
const PC_TO_UNITS = 100;
const SCENE_SCALE = 0.5;

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

const camera = new ArcRotateCamera("MainCamera", Math.PI / 4, Math.PI / 3, 5000, Vector3.Zero(), scene);
camera.layerMask = MAIN_LAYER;
camera.attachControl(canvas, true);

// const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

const galaxyParams: GalaxyParams = {
    galaxySeed: 12345,
    sectorSizePc: 100,
    originPc: { x: 0, y: 0, z: 0 },
    diskScaleLenKpc: 3,
    diskScaleHeightKpc: 0.3,
    bulgeScaleKpc: 1,
    spiralArms: 4,
    spiralAmplitude: 0.3,
    spiralK: 5,
    localNormalization: 1
};

const genParams: GenerationParams = {
    seed: 12345,
    starCount: 50,
    planetCount: 5,
    volumeSizePc: 100,
    binaryFraction: 0.2,
    trinaryFraction: 0.1,
    crazyOrbitFraction: 0.05,
    wanderingFraction: 0.05
};

const sectorKey = { x: 0, y: 0, z: 0, sizePc: galaxyParams.sectorSizePc };

const sector = generateSectorHeaders(galaxyParams.galaxySeed, sectorKey, galaxyParams);
const systems = sector.starHeaders.map(h => expandStarHeaderToSystem(h, genParams));

const sectorSizeUnits = sectorKey.sizePc * PC_TO_UNITS;
const sectorOriginPc = new Vector3(
    sectorKey.x * sectorKey.sizePc,
    sectorKey.y * sectorKey.sizePc,
    sectorKey.z * sectorKey.sizePc
);
const sectorOriginWorld = sectorOriginPc.scale(PC_TO_UNITS);

const sectorRoot = new TransformNode("sectorRoot", scene);
sectorRoot.position.copyFrom(sectorOriginWorld);
sectorRoot.scaling.setAll(SCENE_SCALE);

const sectorCenterLocal = new Vector3(sectorSizeUnits / 2, sectorSizeUnits / 2, sectorSizeUnits / 2);
const sectorFrame = MeshBuilder.CreateBox("sectorFrame", { size: sectorSizeUnits }, scene);
const frameMat = new StandardMaterial("frameMat", scene);
frameMat.diffuseColor = new Color3(0, 1, 1);
frameMat.emissiveColor = new Color3(0, 1, 1);
frameMat.wireframe = true;
sectorFrame.material = frameMat;
sectorFrame.position.copyFrom(sectorCenterLocal);
sectorFrame.layerMask = MAIN_LAYER;
sectorFrame.parent = sectorRoot;

const starMat = new StandardMaterial("starMat", scene);
starMat.emissiveColor = new Color3(1, 0.9, 0.6).scale(0.5);

for (const sys of systems) {
    const star = MeshBuilder.CreateSphere("star", { diameter: 50 }, scene);
    star.material = starMat;

    const localPc = new Vector3(
        sys.positionPc.x - sectorOriginPc.x,
        sys.positionPc.y - sectorOriginPc.y,
        sys.positionPc.z - sectorOriginPc.z
    );

    star.position.set(
        localPc.x * PC_TO_UNITS,
        localPc.y * PC_TO_UNITS,
        localPc.z * PC_TO_UNITS
    );

    star.layerMask = MAIN_LAYER;
    star.parent = sectorRoot;
}

const minimap = new GalaxyMinimap(scene, camera, galaxyParams.sectorSizePc * 2.5);
scene.getMeshByName("galaxyDisk") && (scene.getMeshByName("galaxyDisk")!.layerMask = MINIMAP_LAYER);
scene.getMeshByName("sectorMarker") && (scene.getMeshByName("sectorMarker")!.layerMask = MINIMAP_LAYER);
minimap.camera.layerMask = MINIMAP_LAYER;
minimap.update(sector);

// --- Camera fit logic ---
function fitCameraToSector() {
    const scaledSize = sectorSizeUnits * SCENE_SCALE;

    // Full diagonal length of cube
    const fullDiagonal = Math.sqrt(3) * scaledSize;

    // Add margin so we aren't on the surface
    const desiredDistance = (fullDiagonal / 2) / Math.sin(camera.fov / 2) * 1.1;

    camera.radius = desiredDistance;

    // Target the cube center
    const sectorCenterWorld = sectorRoot.position.add(sectorCenterLocal.scale(SCENE_SCALE));
    camera.setTarget(sectorCenterWorld);

    // Slightly pitch/yaw so we see all edges
    camera.alpha = Math.PI / 4;
    camera.beta = Math.PI / 3;

    camera.minZ = Math.max(0.1, desiredDistance * 0.01);
    camera.maxZ = desiredDistance + fullDiagonal;
}

// Belt‑and‑braces: run once after the first real render, forcing a resize first
const fitOnce = scene.onAfterRenderObservable.add(() => {
    engine.resize();
    fitCameraToSector();
    scene.onAfterRenderObservable.remove(fitOnce);
});

window.addEventListener("resize", () => {
    engine.resize();
    fitCameraToSector();
});

// After scene setup, before render loop
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        engine.resize();      // sync engine with final CSS layout
        fitCameraToSector();  // now calculate camera fit
    });
});

engine.runRenderLoop(() => {
    scene.render();
});