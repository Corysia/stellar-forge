// src/render/starmapPreview.ts
import { Scene, Camera, FreeCamera, Vector3, Viewport } from "@babylonjs/core";

export class StarmapPreview {
    private readonly previewCam: Camera;
    private readonly center: Vector3;

    constructor(
        private readonly scene: Scene,
        private readonly mainCamera: Camera,
        center: Vector3 = Vector3.Zero(),
        private readonly altitude = 5000,
        private orthoSize = 5000
    ) {
        this.center = center.clone();
        this.previewCam = this.createPreviewCamera();
    }

    private createPreviewCamera(): Camera {
        const cam = new FreeCamera(
            "starmapPreviewCam",
            new Vector3(this.center.x, this.altitude, this.center.z),
            this.scene
        );

        cam.mode = Camera.ORTHOGRAPHIC_CAMERA;
        cam.orthoLeft = -this.orthoSize;
        cam.orthoRight = this.orthoSize;
        cam.orthoTop = this.orthoSize;
        cam.orthoBottom = -this.orthoSize;
        cam.rotation.x = Math.PI / 2; // look straight down
        cam.minZ = 0.1;
        cam.maxZ = 1e12;

        // Place in lower‑right by default (adjust to taste)
        cam.viewport = new Viewport(0.7, 0.05, 0.28, 0.28);
        // No clearColor on FreeCamera — background is whatever scene draws first

        // Render both main and preview each frame
        this.scene.activeCameras = [this.mainCamera, cam];

        return cam;
    }

    public setCenter(pos: Vector3): void {
        this.center.copyFrom(pos);
        this.previewCam.position.x = pos.x;
        this.previewCam.position.z = pos.z;
    }

    public setOrthoSize(size: number): void {
        this.orthoSize = size;
        this.previewCam.orthoLeft = -size;
        this.previewCam.orthoRight = size;
        this.previewCam.orthoTop = size;
        this.previewCam.orthoBottom = -size;
    }

    public setViewport(x: number, y: number, w: number, h: number): void {
        this.previewCam.viewport = new Viewport(x, y, w, h);
    }
}