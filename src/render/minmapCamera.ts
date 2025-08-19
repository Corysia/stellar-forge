import {
    Scene, Camera, FreeCamera, Vector3, Viewport, Color4
} from "@babylonjs/core";

export function attachMinimapViewport(
    scene: Scene,
    mainCamera: Camera,
    opts?: {
        x?: number; y?: number; w?: number; h?: number;
        altitude?: number;
        orthoSize?: number;
        bg?: Color4;
        layerMask?: number;
    }
) {
    const x = opts?.x ?? 0.74;
    const y = opts?.y ?? 0.74;
    const w = opts?.w ?? 0.25;
    const h = opts?.h ?? 0.25;
    const altitude = opts?.altitude ?? 2000;
    const orthoSize = opts?.orthoSize ?? 2000;
    const bg = opts?.bg ?? new Color4(0, 0, 0, 0.35);
    const layerMask = opts?.layerMask;

    const mini = new FreeCamera("minimapCam", new Vector3(0, altitude, 0), scene);
    mini.mode = Camera.ORTHOGRAPHIC_CAMERA;
    mini.orthoLeft = -orthoSize;
    mini.orthoRight = orthoSize;
    mini.orthoTop = orthoSize;
    mini.orthoBottom = -orthoSize;
    mini.rotation.x = Math.PI / 2;
    mini.minZ = 0.1;
    mini.maxZ = 1e9;
    mini.viewport = new Viewport(x, y, w, h);
    // mini.clearColor = bg;
    if (layerMask !== undefined) mini.layerMask = layerMask;

    // Render both main and minimap each frame
    scene.activeCameras = [mainCamera, mini];

    return mini;
}