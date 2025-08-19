import {
    Scene,
    FreeCamera,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Viewport,
    Camera,
    Mesh,
    ArcRotateCamera
} from "@babylonjs/core";
import type { Sector } from "../forge/models";

const MINIMAP_LAYER = 0x2; // only minimap sees these

export class GalaxyMinimap {
    private minimapCam: ArcRotateCamera;
    private markerMesh: Mesh;

    constructor(
        private scene: Scene,
        private mainCamera: Camera,
        private galaxyRadius = 25000
    ) {
        this.minimapCam = new ArcRotateCamera(
            "MinimapCamera",
            Math.PI / 2,
            Math.PI / 3,
            500,
            new Vector3(0, 0, 0),
            scene
        );
        this.minimapCam.mode = FreeCamera.ORTHOGRAPHIC_CAMERA;
        this.minimapCam.setTarget(Vector3.Zero());
        this.minimapCam.orthoLeft = -galaxyRadius;
        this.minimapCam.orthoRight = galaxyRadius;
        this.minimapCam.orthoTop = galaxyRadius;
        this.minimapCam.orthoBottom = -galaxyRadius;
        this.minimapCam.minZ = 0.1;
        this.minimapCam.maxZ = 1e9;
        this.minimapCam.layerMask = MINIMAP_LAYER;          // <- key
        this.minimapCam.viewport = new Viewport(0.74, 0.74, 0.25, 0.25);

        this.scene.activeCameras = [this.mainCamera, this.minimapCam];

        // Galaxy disk
        const disk = MeshBuilder.CreateDisc("galaxyDisk", { radius: this.galaxyRadius, tessellation: 64 }, scene);
        disk.rotation.x = Math.PI / 2;
        disk.layerMask = MINIMAP_LAYER;                     // <- key
        const diskMat = new StandardMaterial("diskMat", scene);
        diskMat.diffuseColor = new Color3(0.2, 0.2, 0.35);
        diskMat.alpha = 0.4;
        disk.material = diskMat;

        // Sector marker (flat disc reads better in ortho top‑down)
        this.markerMesh = MeshBuilder.CreateDisc("sectorMarker", { radius: this.galaxyRadius * 0.02, tessellation: 48 }, scene);
        this.markerMesh.rotation.x = Math.PI / 2;
        this.markerMesh.position.y = 0.05;
        this.markerMesh.layerMask = MINIMAP_LAYER;          // <- key
        const markerMat = new StandardMaterial("markerMat", scene);
        markerMat.emissiveColor = new Color3(1, 0.6, 0.1);
        markerMat.disableLighting = true;
        markerMat.alpha = 0.9;
        this.markerMesh.material = markerMat;
    }

    public get camera(): ArcRotateCamera {
        return this.minimapCam;
    }

    update(sector: Sector): void {
        const { x, y, sizePc } = sector.key;
        const cx = (x + 0.5) * sizePc;
        const cz = (y + 0.5) * sizePc;

        this.markerMesh.position.set(cx, 0.05, cz);

        // Keep the inset centered on the current sector
        this.minimapCam.position.x = cx;
        this.minimapCam.position.z = cz;
        this.minimapCam.setTarget(new Vector3(cx, 0, cz));
    }
}