import * as THREE from "three";

let mixer;

export function setupAnimation(model) {
	if (model.animations && model.animations.length > 0) {
		mixer = new THREE.AnimationMixer(model);
		// Play the first animation by default (e.g., idle)
		const action = mixer.clipAction(model.animations[0]);
		action.play();
	}
	return mixer;
}

export function playAnimation(animationClip) {
	if (!mixer) return;
	// You might want to fade out the previous action
	// For now, just stop all and play the new one
	mixer.stopAllAction();
	const action = mixer.clipAction(animationClip);
	action.play();
	return action;
}

export function getMixer() {
	return mixer;
}
