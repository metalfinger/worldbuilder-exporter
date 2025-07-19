import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import {
	createCustomMaterial,
	createMaskOverlayMaterial,
} from "./materialManager.js";

let model;
let albedoMap,
	normalMap,
	metalnessMap,
	roughnessMap,
	headMaskMap,
	jacketMaskMap;
let maskOverlayMesh = null;

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
	const loadingManager = new THREE.LoadingManager();
	const characterTextureLoader = new THREE.TextureLoader(loadingManager);
	const fbxLoader = new FBXLoader(loadingManager);

	albedoMap = characterTextureLoader.load(
		"./GLBandFBX_010725/char01_albedo.webp"
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
	headMaskMap = characterTextureLoader.load(
		"./GLBandFBX_010725/char01_mask_head.webp"
	);
	jacketMaskMap = characterTextureLoader.load(
		"./GLBandFBX_010725/char01_mask_jacket.webp"
	);

	fbxLoader.load("./GLBandFBX_010725/Char01_FBX.fbx", (object) => {
		model = object;
	});

	loadingManager.onLoad = () => {
		// This fires only when all assets managed by the manager are loaded
		// 1. Setup the paint canvas with the base texture
		paintCtx.drawImage(albedoMap.image, 0, 0, canvasSize, canvasSize);
		paintTexture.needsUpdate = true;

		// 2. Configure and add the model to the scene
		model.scale.setScalar(0.01);
		model.position.set(0, 0, 0);

		model.traverse((node) => {
			if (!node.isMesh) return;
			node.castShadow = true;
			node.receiveShadow = true;
			node.material = createCustomMaterial(
				getCharacterTextures(),
				node.material
			);
		});

		scene.add(model);

		// 3. Fire the final callback to setup animations, UI, etc.
		if (onModelLoaded) {
			onModelLoaded(model);
		}
	};
}

export function createMaskOverlay(scene, maskTexture, color) {
	if (maskOverlayMesh) {
		scene.remove(maskOverlayMesh);
		maskOverlayMesh = null;
	}

	if (maskTexture && model) {
		// Clone the model geometry for the overlay
		maskOverlayMesh = model.clone();
		maskOverlayMesh.scale.copy(model.scale);
		maskOverlayMesh.position.copy(model.position);

		// Apply overlay material to all meshes
		maskOverlayMesh.traverse((node) => {
			if (node.isMesh) {
				node.material = createMaskOverlayMaterial(maskTexture, color);
				node.castShadow = false;
				node.receiveShadow = false;
			}
		});

		scene.add(maskOverlayMesh);
	}
}

export function hideMaskOverlay(scene) {
	if (maskOverlayMesh) {
		scene.remove(maskOverlayMesh);
		maskOverlayMesh = null;
	}
}

export function getCharacterTextures() {
	const { paintTexture } = getPaintCanvas();
	return {
		paintTexture,
		normalMap,
		metalnessMap,
		roughnessMap,
		headMaskMap,
		jacketMaskMap,
		albedoMap,
	};
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
