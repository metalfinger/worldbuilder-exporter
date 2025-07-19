import * as THREE from "three";
import { setupScene } from "./modules/sceneSetup.js";
import { loadModel, getCharacterTextures } from "./modules/modelManager.js";
import { setupAnimation, getMixer } from "./modules/animationManager.js";
import { setupUI, initializeMasks } from "./modules/uiManager.js";
import {
	setupRecording,
	getRecordingMixer,
} from "./modules/recordingManager.js";

const clock = new THREE.Clock();

// 1. Scene Setup
const { scene, camera, renderer, controls } = setupScene();

// 2. UI Setup
const { setMode } = setupUI(camera, renderer, controls);

// 3. Model Loading
loadModel(scene, (model) => {
	// 4. Animation Setup
	const mixer = setupAnimation(model);

	// 5. Recording Setup
	setupRecording(renderer, scene, getCharacterTextures());

	// Initialize masks after model and textures are loaded
	initializeMasks();

	// Start the animation loop once the model is loaded
	animate(mixer);
});

// Animation loop
function animate(mixer) {
	requestAnimationFrame(() => animate(mixer));

	const delta = clock.getDelta();

	// Update the main mixer for the static model
	if (mixer) {
		mixer.update(delta);
	}

	// If recording, update the separate recording mixer
	const recordingMixer = getRecordingMixer();
	if (recordingMixer) {
		recordingMixer.update(delta);
	}

	controls.update();
	renderer.render(scene, camera);
}
