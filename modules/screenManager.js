import * as THREE from "three";
import { getModel, applyBaseColor } from "./modelManager.js";
import { getMixer, setAnimationFrame } from "./animationManager.js";
import { applyEnvironment } from "./sceneSetup.js";

let currentScreen = "base-color";
let selectedBaseColor = "#ff6b6b";
let selectedPose = "frame-1";
let selectedHDRI = "studio";
let selectedCamera = "portrait";

// Store renderer and scene references for screenshot functionality
let rendererRef = null;
let sceneRef = null;
let cameraRef = null;
let controlsRef = null;

// Screen transition management
const screens = {
	"base-color": {
		element: "#screen-base-color",
		step: 1,
		title: "Choose Base Color",
	},
	paint: {
		element: "#screen-paint",
		step: 2,
		title: "Paint & Style",
	},
	pose: {
		element: "#screen-pose",
		step: 3,
		title: "Pose & Finish",
	},
};

export function initializeScreenManager(
	scene,
	camera,
	renderer,
	controls,
	setMode
) {
	console.log("Initializing Screen Manager");

	// Store references for screenshot functionality
	sceneRef = scene;
	rendererRef = renderer;
	cameraRef = camera;
	controlsRef = controls;

	// Set initial screen
	updateBodyDataAttribute("base-color");
	updateProgressIndicator(1);

	// Apply studio environment for base color selection - force to ensure it loads
	applyEnvironment("studio", true);

	// Initialize base color selection
	initializeBaseColorSelection();

	// Initialize screen navigation
	initializeScreenNavigation(setMode);

	// Initialize pose screen functionality
	initializePoseScreen(camera, renderer);

	// Set initial mode to rotate for base color selection
	setMode("rotate");

	// Ensure controls are enabled for base color screen
	controlsRef.enabled = true;

	console.log("Screen Manager initialized");
}

function initializeBaseColorSelection() {
	const colorOptions = document.querySelectorAll(".color-option");
	const customColorInput = document.getElementById("custom-base-color");

	// Handle preset color selection
	colorOptions.forEach((option) => {
		option.addEventListener("click", () => {
			// Remove active class from all options
			colorOptions.forEach((opt) => opt.classList.remove("active"));

			// Add active class to selected option
			option.classList.add("active", "selecting");

			// Remove selecting animation after completion
			setTimeout(() => option.classList.remove("selecting"), 300);

			// Get and apply selected color
			selectedBaseColor = option.dataset.color;
			customColorInput.value = selectedBaseColor;

			// Apply base color to model
			applyBaseColorToModel(selectedBaseColor);

			console.log("Base color selected:", selectedBaseColor);
		});
	});

	// Handle custom color selection
	customColorInput.addEventListener("change", (e) => {
		selectedBaseColor = e.target.value;

		// Remove active class from preset options
		colorOptions.forEach((opt) => opt.classList.remove("active"));

		// Apply base color to model
		applyBaseColorToModel(selectedBaseColor);

		console.log("Custom base color selected:", selectedBaseColor);
	});

	// Apply initial base color
	applyBaseColorToModel(selectedBaseColor);

	// Show helpful message for base color selection
	setTimeout(() => {
		showNotification(
			"🔄 Drag to rotate the model in the bright white environment and choose your perfect base color!",
			"info"
		);
	}, 1000);
}

function applyBaseColorToModel(color) {
	const model = getModel();
	if (!model) {
		console.log("Model not ready, will apply color when loaded");
		return;
	}

	// Apply the base color using the model manager function
	applyBaseColor(color);
}

function initializeScreenNavigation(setMode) {
	// Screen 1 -> Screen 2
	const nextToPaintBtn = document.getElementById("next-to-paint");
	if (nextToPaintBtn) {
		nextToPaintBtn.addEventListener("click", () => {
			transitionToScreen("paint", setMode);
		});
	}

	// Screen 2 -> Screen 1 (Back)
	const backToBaseBtn = document.getElementById("back-to-base");
	if (backToBaseBtn) {
		backToBaseBtn.addEventListener("click", () => {
			transitionToScreen("base-color", setMode);
		});
	}

	// Screen 2 -> Screen 3
	const nextToPoseBtn = document.getElementById("next-to-pose");
	if (nextToPoseBtn) {
		nextToPoseBtn.addEventListener("click", () => {
			transitionToScreen("pose", setMode);
		});
	}

	// Screen 3 -> Screen 2 (Back)
	const backToPaintBtn = document.getElementById("back-to-paint");
	if (backToPaintBtn) {
		backToPaintBtn.addEventListener("click", () => {
			transitionToScreen("paint", setMode);
		});
	}

	// Save creation button
	const saveCreationBtn = document.getElementById("save-creation");
	if (saveCreationBtn) {
		saveCreationBtn.addEventListener("click", () => {
			saveCreation();
		});
	}
}

function transitionToScreen(screenName, setMode) {
	if (currentScreen === screenName) return;

	console.log(`Transitioning from ${currentScreen} to ${screenName}`);

	// Update current screen
	const previousScreen = currentScreen;
	currentScreen = screenName;

	// Update body data attribute for CSS styling
	updateBodyDataAttribute(screenName);

	// Update progress indicator
	updateProgressIndicator(screens[screenName].step);

	// Handle screen-specific setup
	switch (screenName) {
		case "base-color":
			setMode("rotate");
			// Apply studio environment for base color selection
			applyEnvironment("studio");
			// Force enable controls for base color screen
			setTimeout(() => {
				controlsRef.enabled = true;
				console.log(
					"Controls enabled for base color screen:",
					controlsRef.enabled
				);
			}, 100);
			break;
		case "paint":
			setMode("rotate"); // Start in rotate mode, user can switch to paint
			// Keep studio environment for consistent painting experience
			applyEnvironment("studio");
			// Mark base color step as completed
			markStepCompleted(1);
			break;
		case "pose":
			setMode("rotate"); // Enable rotation for pose viewing
			// Apply the selected HDRI environment for pose screen
			applyEnvironment(selectedHDRI);
			// Mark paint step as completed
			markStepCompleted(2);
			break;
	}

	// Update screen visibility
	updateScreenVisibility(screenName, previousScreen);

	console.log(`Screen transition completed: ${screenName}`);
}

function updateBodyDataAttribute(screenName) {
	document.body.setAttribute("data-screen", screenName);
}

function updateProgressIndicator(activeStep) {
	const progressSteps = document.querySelectorAll(".progress-step");

	progressSteps.forEach((step, index) => {
		const stepNumber = index + 1;
		step.classList.remove("active");

		if (stepNumber === activeStep) {
			step.classList.add("active");
		}
	});
}

function markStepCompleted(stepNumber) {
	const progressStep = document.querySelector(`[data-step="${stepNumber}"]`);
	if (progressStep) {
		progressStep.classList.add("completed", "completing");

		// Remove completing animation after completion
		setTimeout(() => {
			progressStep.classList.remove("completing");
		}, 600);
	}
}

function updateScreenVisibility(activeScreen, previousScreen) {
	// Hide all screens
	Object.keys(screens).forEach((screenName) => {
		const screenElement = document.querySelector(screens[screenName].element);
		if (screenElement) {
			screenElement.classList.remove("active");
			if (screenName === previousScreen) {
				screenElement.classList.add("hiding");

				// Remove hiding class after animation
				setTimeout(() => {
					screenElement.classList.remove("hiding");
				}, 400);
			}
		}
	});

	// Show active screen
	const activeScreenElement = document.querySelector(
		screens[activeScreen].element
	);
	if (activeScreenElement) {
		activeScreenElement.classList.add("active");
	}
}

function initializePoseScreen(camera, renderer) {
	// Initialize pose selection
	initializePoseSelection();

	// Initialize HDRI selection
	initializeHDRISelection();

	// Initialize camera frame selection
	initializeCameraSelection(camera);
}

function initializePoseSelection() {
	const poseButtons = document.querySelectorAll(".pose-btn");

	poseButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			// Remove active class from all pose buttons
			poseButtons.forEach((b) => b.classList.remove("active"));

			// Add active class to selected button
			btn.classList.add("active");

			// Get selected pose
			selectedPose = btn.dataset.pose;

			// Apply pose to character
			applyPoseToCharacter(selectedPose);

			console.log("Pose selected:", selectedPose);
		});
	});
}

function applyPoseToCharacter(pose) {
	const mixer = getMixer();
	const model = getModel();

	if (!mixer || !model || !model.animations || model.animations.length === 0) {
		console.log("Animation system not ready");
		return;
	}

	// Map pose names to animation frames
	const poseFrames = {
		"frame-1": 1, // Standing pose
		"frame-3": 3, // Action pose
		"frame-10": 10, // Walking pose
	};

	const frameNumber = poseFrames[pose] || 1;

	// Set the animation to specific frame
	setAnimationFrame(frameNumber);

	console.log(`Applied pose: ${pose} (frame ${frameNumber})`);
}

function initializeHDRISelection() {
	const hdriButtons = document.querySelectorAll(".hdri-btn");

	hdriButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			// Remove active class from all HDRI buttons
			hdriButtons.forEach((b) => b.classList.remove("active"));

			// Add active class to selected button
			btn.classList.add("active");

			// Get selected HDRI
			selectedHDRI = btn.dataset.hdri;

			// Apply HDRI environment
			applyHDRIEnvironment(selectedHDRI);

			console.log("HDRI selected:", selectedHDRI);
		});
	});
}

function applyHDRIEnvironment(hdri) {
	// Apply the selected environment instead of always using studio
	applyEnvironment(hdri);

	console.log(`Applied HDRI environment: ${hdri}`);
}

function initializeCameraSelection(camera) {
	const cameraButtons = document.querySelectorAll(".camera-btn");

	cameraButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			// Remove active class from all camera buttons
			cameraButtons.forEach((b) => b.classList.remove("active"));

			// Add active class to selected button
			btn.classList.add("active");

			// Get selected camera frame
			selectedCamera = btn.dataset.camera;

			// Apply camera framing
			applyCameraFraming(selectedCamera, camera);

			console.log("Camera frame selected:", selectedCamera);
		});
	});
}

function applyCameraFraming(cameraType, camera) {
	const model = getModel();
	if (!model) return;

	// Define camera positions for different frames
	const cameraPositions = {
		portrait: {
			distance: 3,
			height: 1.6,
			angle: 0,
		},
		landscape: {
			distance: 4,
			height: 1.2,
			angle: 0.3,
		},
		"close-up": {
			distance: 2,
			height: 1.8,
			angle: 0,
		},
	};

	const pos = cameraPositions[cameraType];
	if (!pos) return;

	// Smoothly transition camera to new position
	const targetPosition = new THREE.Vector3(
		Math.sin(pos.angle) * pos.distance,
		pos.height,
		Math.cos(pos.angle) * pos.distance
	);

	// For now, just set the position directly
	// In a full implementation, you'd animate this transition
	camera.position.copy(targetPosition);
	camera.lookAt(0, 1, 0); // Look at character center

	console.log(`Applied camera framing: ${cameraType}`, targetPosition);
}

function saveCreation() {
	console.log("Saving creation...");

	// Mark final step as completed
	markStepCompleted(3);

	// Check if renderer and scene are available
	if (!rendererRef || !cameraRef || !sceneRef) {
		console.error("Renderer, camera, or scene not available for saving");
		showNotification(
			"❌ Failed to save creation. Renderer not ready.",
			"error"
		);
		return;
	}

	try {
		// Store original background and environment for restoration
		const originalBackground = sceneRef.background;
		const originalEnvironment = sceneRef.environment;
		const originalToneMappingExposure = rendererRef.toneMappingExposure;
		const originalClearColor = rendererRef.getClearColor(new THREE.Color());
		const originalClearAlpha = rendererRef.getClearAlpha();

		// Set transparent background for export
		sceneRef.background = null;
		sceneRef.environment = null;
		rendererRef.toneMappingExposure = 1.0;
		
		// Set clear color to transparent
		rendererRef.setClearColor(0x000000, 0); // Transparent background

		// Force render with transparent background
		console.log("Rendering with transparent background...");
		rendererRef.render(sceneRef, cameraRef);

		// Give time for the render to complete
		setTimeout(() => {
			// Render again to be absolutely sure
			rendererRef.render(sceneRef, cameraRef);

			// Wait a bit more before capture
			setTimeout(() => {
				// Capture screenshot with transparent background
				captureAndDownloadScreenshot();

				// Restore original background and environment after capture
				setTimeout(() => {
					sceneRef.background = originalBackground;
					sceneRef.environment = originalEnvironment;
					rendererRef.toneMappingExposure = originalToneMappingExposure;
					rendererRef.setClearColor(originalClearColor, originalClearAlpha);
					rendererRef.render(sceneRef, cameraRef);
					console.log("Restored original environment");
				}, 100);
			}, 200);
		}, 200);
	} catch (error) {
		console.error("Error saving creation:", error);
		showNotification("❌ Failed to save creation. Please try again.", "error");
	}
}

function captureAndDownloadScreenshot() {
	try {
		// Get the renderer's canvas element
		const canvas = rendererRef.domElement;
		console.log("Canvas found:", !!canvas);
		console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
		console.log(
			"Canvas style dimensions:",
			canvas.style.width,
			"x",
			canvas.style.height
		);

		if (canvas) {
			// Ensure the canvas has content by checking dimensions
			if (canvas.width === 0 || canvas.height === 0) {
				console.error("Canvas has no dimensions");
				showNotification(
					"❌ Failed to save creation. Canvas is empty.",
					"error"
				);
				return;
			}

			// Force one final render before capture
			rendererRef.render(sceneRef, cameraRef);
			console.log("Final render completed before capture");

			// Check WebGL context state
			const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
			if (gl) {
				console.log("WebGL context state:", {
					isContextLost: gl.isContextLost(),
					drawingBufferWidth: gl.drawingBufferWidth,
					drawingBufferHeight: gl.drawingBufferHeight,
				});
			}

			// Create a high-quality screenshot
			const dataURL = canvas.toDataURL("image/png", 1.0);
			console.log("Data URL length:", dataURL.length);
			console.log("Data URL starts with:", dataURL.substring(0, 50));

			// Check if we got actual image data
			if (dataURL === "data:," || dataURL.length < 100) {
				console.error("Canvas returned empty or minimal data URL");
				showNotification("❌ Failed to save creation. No image data.", "error");
				return;
			}

			// Create a link to download the image
			const link = document.createElement("a");
			link.download = `worldbuilder-creation-${Date.now()}.png`;
			link.href = dataURL;

			// Trigger download
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Show success notification
			showNotification(
				"🎉 Creation saved successfully! Your character has been downloaded.",
				"success"
			);

			console.log("Creation saved and downloaded successfully");
		} else {
			console.error("Renderer canvas not found");
			showNotification(
				"❌ Failed to save creation. Canvas not found.",
				"error"
			);
		}
	} catch (error) {
		console.error("Error capturing screenshot:", error);
		showNotification("❌ Failed to save creation. Please try again.", "error");
	}
}

function showNotification(message, type = "success") {
	// Remove existing notifications
	const existing = document.querySelector(".notification");
	if (existing) existing.remove();

	const notification = document.createElement("div");
	notification.className = `notification ${type}`;
	notification.textContent = message;

	document.body.appendChild(notification);

	// Show notification
	setTimeout(() => notification.classList.add("show"), 10);

	// Hide and remove after 4 seconds
	setTimeout(() => {
		notification.classList.remove("show");
		setTimeout(() => notification.remove(), 300);
	}, 4000);
}

// Export current screen state and selections
export function getCurrentScreen() {
	return currentScreen;
}

export function getCurrentSelections() {
	return {
		baseColor: selectedBaseColor,
		pose: selectedPose,
		hdri: selectedHDRI,
		camera: selectedCamera,
	};
}
