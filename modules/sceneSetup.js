import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let scene, camera, renderer, controls;
let hemisphereLight, directionalLight, fillLight;
let currentEnvironment = null; // Start as null so first apply always works

let studioHDRI = null;

export function setupScene() {
	// Scene
	scene = new THREE.Scene();

	// Camera
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	camera.position.set(0, 1.5, 2);

	// Renderer
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		preserveDrawingBuffer: true, // Essential for capturing screenshots
		alpha: true, // Enable alpha for transparent backgrounds
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.6; // Reduced from 0.8 to prevent overexposure
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	// Append canvas to the viewport container instead of body
	const viewportContainer = document.querySelector(".viewport-container");
	if (viewportContainer) {
		viewportContainer.appendChild(renderer.domElement);
	} else {
		// Fallback to body if container not found
		document.body.appendChild(renderer.domElement);
	}

	// Controls
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.target.set(0, 1, 0);

	// Initialize with studio lighting
	setupStudioLighting();

	// Ground Platform (Box)
	// const groundGeo = new THREE.BoxGeometry(5, 0.5, 5); // Width, Height, Depth
	// const groundMat = new THREE.MeshStandardMaterial({
	// 	color: 0x808080,
	// 	roughness: 0.7,
	// 	metalness: 0.1,
	// });
	// const ground = new THREE.Mesh(groundGeo, groundMat);
	// ground.position.y = -0.25; // Position so top surface is at y=0
	// ground.receiveShadow = true;
	// ground.castShadow = true; // Box can also cast shadows
	// scene.add(ground);

	// const textureLoader = new THREE.TextureLoader();
	// textureLoader.load("./GLBandFBX/texture_08.png", function (texture) {
	// 	texture.wrapS = THREE.RepeatWrapping;
	// 	texture.wrapT = THREE.RepeatWrapping;
	// 	texture.repeat.set(2, 2);
	// 	ground.material.map = texture;
	// 	ground.material.needsUpdate = true;
	// });

	// Set initial studio environment - force apply to ensure it loads
	applyEnvironment("studio", true);

	// Handle window resize
	window.addEventListener("resize", () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	return { scene, camera, renderer, controls };
}

function createWhiteEnvironment() {
	// Create a simple white environment map for omnidirectional lighting
	const size = 256;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext("2d");

	// Fill with white
	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, size, size);

	// Create texture from canvas
	const texture = new THREE.CanvasTexture(canvas);
	texture.mapping = THREE.EquirectangularReflectionMapping;
	texture.colorSpace = THREE.SRGBColorSpace;

	return texture;
}

function setupMinimalLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Very minimal lighting since the white environment provides most illumination
	hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
	scene.add(hemisphereLight);

	// Soft directional light for some definition
	directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
	directionalLight.position.set(2, 4, 3);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	scene.add(directionalLight);
}

function setupStudioLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Balanced studio lighting - optimized for visibility
	hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xf0f0f0, 1.0); // Increased for better visibility
	scene.add(hemisphereLight);

	// Main directional light - better positioned and increased intensity
	directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased for better visibility
	directionalLight.position.set(3, 4, 2); // More centered position
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	// Improve shadow quality
	directionalLight.shadow.camera.near = 0.1;
	directionalLight.shadow.camera.far = 20;
	directionalLight.shadow.camera.left = -5;
	directionalLight.shadow.camera.right = 5;
	directionalLight.shadow.camera.top = 5;
	directionalLight.shadow.camera.bottom = -5;
	directionalLight.shadow.bias = -0.0001;
	scene.add(directionalLight);

	// Fill light from opposite side - more subtle
	fillLight = new THREE.DirectionalLight(0xffffff, 0.4); // Reduced from 1.0
	fillLight.position.set(-2, 2, -1); // Better positioning to avoid back-lighting
	scene.add(fillLight);

	// Rim light for better definition - reduced intensity
	const rimLight = new THREE.DirectionalLight(0xffffff, 0.3); // Reduced from 0.8
	rimLight.position.set(0, 2, -3); // Adjusted position
	scene.add(rimLight);
}

function setupOutdoorLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Outdoor lighting setup - more natural and less intense
	hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4682b4, 0.6); // Reduced from 0.8
	scene.add(hemisphereLight);

	// Sun light - more realistic positioning and intensity
	directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Reduced from 1.5
	directionalLight.position.set(4, 8, 3); // Higher sun position
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	// Better shadow bounds for outdoor scene
	directionalLight.shadow.camera.near = 1;
	directionalLight.shadow.camera.far = 30;
	directionalLight.shadow.camera.left = -10;
	directionalLight.shadow.camera.right = 10;
	directionalLight.shadow.camera.top = 10;
	directionalLight.shadow.camera.bottom = -10;
	scene.add(directionalLight);

	// Sky reflection/bounce light - more subtle
	fillLight = new THREE.DirectionalLight(0x87ceeb, 0.2); // Reduced from 0.3
	fillLight.position.set(-2, 4, -2);
	scene.add(fillLight);
}

function setupSunsetLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Sunset lighting setup - warmer but more balanced
	hemisphereLight = new THREE.HemisphereLight(0xff8a50, 0xf7931e, 0.5); // Reduced from 0.6
	scene.add(hemisphereLight);

	// Low sunset sun - more realistic angle and intensity
	directionalLight = new THREE.DirectionalLight(0xff7742, 1.2); // Reduced from 1.8
	directionalLight.position.set(-4, 2, 4); // Lower angle for sunset
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	// Sunset shadow configuration
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 25;
	directionalLight.shadow.camera.left = -8;
	directionalLight.shadow.camera.right = 8;
	directionalLight.shadow.camera.top = 8;
	directionalLight.shadow.camera.bottom = -8;
	scene.add(directionalLight);

	// Ambient sunset glow - more subtle
	fillLight = new THREE.DirectionalLight(0xff9966, 0.25); // Reduced from 0.4
	fillLight.position.set(2, 1, -2);
	scene.add(fillLight);
}

function setupNightLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Night lighting - dark with moonlight
	hemisphereLight = new THREE.HemisphereLight(0x1a237e, 0x0c1445, 0.3);
	scene.add(hemisphereLight);

	// Moonlight - soft directional light from above
	directionalLight = new THREE.DirectionalLight(0x7f9cf5, 0.8);
	directionalLight.position.set(0, 5, -2);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	scene.add(directionalLight);

	// Ambient light for visibility
	fillLight = new THREE.DirectionalLight(0x4a5cb0, 0.2);
	fillLight.position.set(2, 1, 2);
	scene.add(fillLight);
}

function setupForestLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Forest lighting - green-tinted ambient
	hemisphereLight = new THREE.HemisphereLight(0x4caf50, 0x1b5e20, 0.6);
	scene.add(hemisphereLight);

	// Sunlight filtering through trees
	directionalLight = new THREE.DirectionalLight(0x81c784, 1.0);
	directionalLight.position.set(3, 4, 2);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	scene.add(directionalLight);

	// Fill light from environment
	fillLight = new THREE.DirectionalLight(0x66bb6a, 0.3);
	fillLight.position.set(-2, 2, -1);
	scene.add(fillLight);
}

function setupBeachLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Beach lighting - warm ambient
	hemisphereLight = new THREE.HemisphereLight(0xfff176, 0xf57f17, 0.7);
	scene.add(hemisphereLight);

	// Bright sunlight
	directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
	directionalLight.position.set(4, 5, 3);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	scene.add(directionalLight);

	// Sky reflection
	fillLight = new THREE.DirectionalLight(0xfff59d, 0.4);
	fillLight.position.set(-2, 3, -2);
	scene.add(fillLight);
}

function setupDawnLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Dawn lighting - soft purple/pink ambient
	hemisphereLight = new THREE.HemisphereLight(0xff80ab, 0xe1bee7, 0.5);
	scene.add(hemisphereLight);

	// Rising sun
	directionalLight = new THREE.DirectionalLight(0xffccbc, 1.0);
	directionalLight.position.set(2, 3, 4);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	scene.add(directionalLight);

	// Soft fill light
	fillLight = new THREE.DirectionalLight(0xf8bbd0, 0.3);
	fillLight.position.set(-1, 2, -1);
	scene.add(fillLight);
}

function setupCloudyLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Cloudy lighting - neutral ambient
	hemisphereLight = new THREE.HemisphereLight(0xcfd8dc, 0x90a4ae, 0.8);
	scene.add(hemisphereLight);

	// Diffused sunlight
	directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
	directionalLight.position.set(2, 4, 3);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	scene.add(directionalLight);

	// Soft fill
	fillLight = new THREE.DirectionalLight(0xb0bec5, 0.2);
	fillLight.position.set(-2, 2, -1);
	scene.add(fillLight);
}

function setupIndoorLighting() {
	// Clear existing lights
	if (hemisphereLight) scene.remove(hemisphereLight);
	if (directionalLight) scene.remove(directionalLight);
	if (fillLight) scene.remove(fillLight);

	// Indoor lighting - neutral with slight warmth
	hemisphereLight = new THREE.HemisphereLight(0xe0e0e0, 0x9e9e9e, 0.6);
	scene.add(hemisphereLight);

	// Overhead lighting
	directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
	directionalLight.position.set(0, 5, 2);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	scene.add(directionalLight);

	// Ambient fill
	fillLight = new THREE.DirectionalLight(0xeeeeee, 0.3);
	fillLight.position.set(2, 1, -2);
	scene.add(fillLight);
}

function loadStudioHDRI(callback) {
	if (studioHDRI) {
		console.log("Using cached studio HDRI");
		callback(studioHDRI);
		return;
	}
	console.log("Loading studio HDRI from CDN...");
	const loader = new RGBELoader();
	loader.setPath(
		"https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/equirectangular/"
	);
	loader.load(
		"royal_esplanade_1k.hdr",
		function (texture) {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			studioHDRI = texture;
			console.log("✅ Studio HDRI loaded successfully");
			callback(texture);
		},
		function (progress) {
			// console.log(
			// 	"HDRI loading progress:",
			// 	(progress.loaded / progress.total) * 100 + "%"
			// );
		},
		function (error) {
			console.error("❌ Failed to load studio HDRI:", error);
			// Fallback to no environment
			callback(null);
		}
	);
}

export function applyEnvironment(environmentType, forceApply = false) {
	// Don't skip if this is the first time applying this environment or if forcing a refresh
	if (!scene) {
		console.warn("Scene not available, cannot apply environment");
		return;
	}

	// Only skip if we're trying to apply the same environment AND not forcing AND scene has environment
	if (
		currentEnvironment === environmentType &&
		!forceApply &&
		scene.environment !== null
	) {
		console.log(`Environment ${environmentType} already applied, skipping`);
		return;
	}

	currentEnvironment = environmentType;

	console.log(
		`🌍 Applying environment: ${environmentType} ${
			forceApply ? "(forced)" : ""
		}`
	);

	switch (environmentType) {
		case "studio":
			scene.background = new THREE.Color(0xf8f8f8); // Brighter background for better visibility
			loadStudioHDRI(function (texture) {
				if (texture) {
					// Apply HDRI with proper intensity
					scene.environment = texture;
					console.log("✅ Studio HDRI applied to scene");
				} else {
					console.log("⚠️ Studio HDRI failed to load, using lighting only");
					scene.environment = null;
				}
			});
			setupStudioLighting();
			renderer.toneMappingExposure = 0.9; // Increased for better visibility
			console.log(
				"📸 Studio environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		case "outdoor":
			scene.background = new THREE.Color(0x87ceeb);
			scene.environment = null; // Remove environment to rely on lighting
			setupOutdoorLighting();
			renderer.toneMappingExposure = 0.7; // Reduced from 1.0
			console.log(
				"🌤️ Outdoor environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		case "sunset":
			scene.background = new THREE.Color(0xff8a50); // Less intense sunset color
			scene.environment = null; // Remove environment to rely on lighting
			setupSunsetLighting();
			renderer.toneMappingExposure = 0.9; // Reduced from 1.2
			console.log(
				"🌅 Sunset environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		case "night":
			scene.background = new THREE.Color(0x0c1445); // Dark blue background
			scene.environment = null; // Remove environment to rely on lighting
			setupNightLighting();
			renderer.toneMappingExposure = 0.6;
			console.log(
				"🌙 Night environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		case "forest":
			scene.background = new THREE.Color(0x1b5e20); // Dark green background
			scene.environment = null; // Remove environment to rely on lighting
			setupForestLighting();
			renderer.toneMappingExposure = 0.8;
			console.log(
				"🌲 Forest environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		case "beach":
			scene.background = new THREE.Color(0xf57f17); // Sandy color background
			scene.environment = null; // Remove environment to rely on lighting
			setupBeachLighting();
			renderer.toneMappingExposure = 1.0;
			console.log(
				"🏖️ Beach environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		case "dawn":
			scene.background = new THREE.Color(0xe1bee7); // Soft purple background
			scene.environment = null; // Remove environment to rely on lighting
			setupDawnLighting();
			renderer.toneMappingExposure = 0.8;
			console.log(
				"🌅 Dawn environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		case "cloudy":
			scene.background = new THREE.Color(0x90a4ae); // Gray background
			scene.environment = null; // Remove environment to rely on lighting
			setupCloudyLighting();
			renderer.toneMappingExposure = 0.7;
			console.log(
				"☁️ Cloudy environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		case "indoor":
			scene.background = new THREE.Color(0x9e9e9e); // Neutral gray background
			scene.environment = null; // Remove environment to rely on lighting
			setupIndoorLighting();
			renderer.toneMappingExposure = 0.8;
			console.log(
				"🏠 Indoor environment applied with tone mapping:",
				renderer.toneMappingExposure
			);
			break;

		default:
			console.warn(`Unknown environment type: ${environmentType}`);
			break;
	}
}
