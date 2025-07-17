import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { createPbrMaterial } from "./materialManager.js";

let model;
let normalMap, metalnessMap, roughnessMap;

// --- Dynamic Texture Painting Setup ---
const canvasSize = 1024;
const paintCanvas = document.createElement("canvas");
paintCanvas.width = canvasSize;
paintCanvas.height = canvasSize;
const paintCtx = paintCanvas.getContext("2d");
const paintTexture = new THREE.CanvasTexture(paintCanvas);
paintTexture.colorSpace = THREE.SRGBColorSpace;
// --- End Dynamic Texture Painting Setup ---

export function loadModel(scene, onModelLoaded) {
	const characterTextureLoader = new THREE.TextureLoader();

	const albedoMap = characterTextureLoader.load(
		"./GLBandFBX_010725/char01_albedo.webp",
		(texture) => {
			paintCtx.drawImage(texture.image, 0, 0, canvasSize, canvasSize);
			paintTexture.needsUpdate = true;
		}
	);
	albedoMap.colorSpace = THREE.SRGBColorSpace;

	normalMap = characterTextureLoader.load(
		"./GLBandFBX_010725/char01_normal.webp"
	);
	metalnessMap = characterTextureLoader.load(
		"./GLBandFBX_010725/char01_metalness.webp"
	);
	roughnessMap = characterTextureLoader.load(
		"./GLBandFBX_010725/char01_roughness.webp"
	);

	const loader = new FBXLoader();
	loader.load("./GLBandFBX_010725/Char01_FBX.fbx", (object) => {
		model = object;
		model.scale.setScalar(0.01);
		model.position.set(0, 0, 0);

		model.traverse((node) => {
			if (!node.isMesh) return;
			node.castShadow = true;
			node.receiveShadow = true;
			node.material = createPbrMaterial(getCharacterTextures(), node.material);
		});

		scene.add(model);

		if (onModelLoaded) {
			onModelLoaded(model);
		}
	});
}

export function getCharacterTextures() {
	const { paintTexture } = getPaintCanvas();
	return { paintTexture, normalMap, metalnessMap, roughnessMap };
}

export function getModel() {
	return model;
}

export function showModel(visible) {
	if (model) {
		model.visible = visible;
	}
}

export function getPaintCanvas() {
	return { paintCanvas, paintCtx, paintTexture };
}
