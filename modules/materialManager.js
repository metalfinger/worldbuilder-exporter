import * as THREE from "three";

/**
 * Creates a standardized PBR material for the character.
 * This ensures consistency between the static and animated models.
 * @param {object} textures - The PBR textures for the material.
 * @param {THREE.Texture} textures.paintTexture - The main albedo texture (user-painted).
 * @param {THREE.Texture} textures.normalMap - The normal map.
 * @param {THREE.Texture} textures.metalnessMap - The metalness map.
 * @param {THREE.Texture} textures.roughnessMap - The roughness map.
 * @param {THREE.Material} [originalMaterial] - The original material from the FBX, used to preserve skinning.
 * @returns {THREE.MeshStandardMaterial}
 */
export function createPbrMaterial(
	{ paintTexture, normalMap, metalnessMap, roughnessMap },
	originalMaterial
) {
	return new THREE.MeshStandardMaterial({
		map: paintTexture,
		normalMap: normalMap,
		metalnessMap: metalnessMap,
		roughnessMap: roughnessMap,
		metalness: 1.0,
		roughness: 1.0,
		// Preserve the skinning property if the original material had it.
		// This is crucial for skeletal animations.
		skinning: originalMaterial && originalMaterial.skinning,
	});
}
