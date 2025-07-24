import * as THREE from "three";
import { setupScene } from "./modules/sceneSetup.js";
import { loadModel, getCharacterTextures } from "./modules/modelManager.js";
import { setupAnimation, getMixer } from "./modules/animationManager.js";
import { setupUI, initializeMasks } from "./modules/uiManager.js";
import { initializeScreenManager } from "./modules/screenManager.js";

const clock = new THREE.Clock();

// 1. Scene Setup
const { scene, camera, renderer, controls } = setupScene();

// 2. UI Setup
const { setMode } = setupUI(camera, renderer, controls);

// 3. Model Loading
loadModel(scene, (model) => {
	// 4. Animation Setup
	const mixer = setupAnimation(model);

	// 5. Initialize masks after model and textures are loaded
	initializeMasks();

	// 6. Initialize Screen Manager
	initializeScreenManager(scene, camera, renderer, controls, setMode);

	// Start the animation loop once the model is loaded
	animate(mixer);
});

// Animation loop
function animate(mixer) {
	requestAnimationFrame(() => animate(mixer));

	const delta = clock.getDelta();

	// Update the main mixer for the model
	if (mixer) {
		mixer.update(delta);
	}

	controls.update();
	renderer.render(scene, camera);
}
