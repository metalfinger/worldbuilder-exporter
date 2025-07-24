import * as THREE from "three";

let mixer;
let currentAction;

export function setupAnimation(model) {
	if (model.animations && model.animations.length > 0) {
		mixer = new THREE.AnimationMixer(model);
		// Play the first animation by default (e.g., idle)
		currentAction = mixer.clipAction(model.animations[0]);
		currentAction.play();
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
	currentAction = action;
	return action;
}

export function setAnimationFrame(frameNumber) {
	if (!mixer || !currentAction) {
		console.log("Animation system not ready for frame setting");
		return;
	}

	// Get the animation clip
	const clip = currentAction.getClip();
	if (!clip) return;

	// Calculate the time for the specific frame
	// Assuming 30 FPS for the animation
	const fps = 30;
	const timePerFrame = 1 / fps;
	const targetTime = (frameNumber - 1) * timePerFrame;

	// Clamp the target time to the clip duration
	const clampedTime = Math.min(targetTime, clip.duration);

	// Set the animation to the specific time
	currentAction.time = clampedTime;
	currentAction.paused = true; // Pause the animation at this frame

	// Update the mixer to apply the change
	mixer.update(0);

	console.log(`Set animation to frame ${frameNumber} (time: ${clampedTime}s)`);
}

export function resumeAnimation() {
	if (currentAction) {
		currentAction.paused = false;
	}
}

export function pauseAnimation() {
	if (currentAction) {
		currentAction.paused = true;
	}
}

export function getMixer() {
	return mixer;
}
