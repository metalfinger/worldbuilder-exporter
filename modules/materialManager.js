import * as THREE from "three";

export function createCustomMaterial(textures, originalMaterial) {
	const { paintTexture, normalMap, metalnessMap, roughnessMap } = textures;

	return new THREE.MeshStandardMaterial({
		map: paintTexture,
		normalMap: normalMap,
		metalnessMap: metalnessMap,
		roughnessMap: roughnessMap,
		metalness: 0.8, // Reduced from 1.0 for more realistic appearance
		roughness: 0.9, // Reduced from 1.0 for better light interaction
		skinning: originalMaterial && originalMaterial.skinning,
		// Add environment map reflection for better material response
		envMapIntensity: 0.3, // Subtle environment reflection
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
