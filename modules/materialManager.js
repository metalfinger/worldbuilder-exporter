import * as THREE from "three";

export function createCustomMaterial(textures, originalMaterial) {
	const { paintTexture, normalMap, metalnessMap, roughnessMap } = textures;

	return new THREE.MeshStandardMaterial({
		map: paintTexture,
		normalMap: normalMap,
		metalnessMap: metalnessMap,
		roughnessMap: roughnessMap,
		metalness: 1.0,
		roughness: 1.0,
		skinning: originalMaterial && originalMaterial.skinning,
	});
}

export function createMaskOverlayMaterial(maskTexture, color = 0x00ff00) {
	return new THREE.MeshBasicMaterial({
		map: maskTexture,
		color: color,
		transparent: true,
		opacity: 0.3,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		depthTest: true,
	});
}
