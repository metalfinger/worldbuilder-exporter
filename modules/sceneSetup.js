import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export function setupScene() {
	// Scene
	const scene = new THREE.Scene();

	// Camera
	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	camera.position.set(0, 1.5, 2);

	// Renderer
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.8;
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
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.target.set(0, 1, 0);

	// Lighting
	const hemisphereLight = new THREE.HemisphereLight(0x444444, 0xbbbbbb, 1);
	scene.add(hemisphereLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
	directionalLight.position.set(3, 3, 2);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	scene.add(directionalLight);

	const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
	fillLight.position.set(-5, 2, -5);
	scene.add(fillLight);

	// Ground Plane
	const groundGeo = new THREE.PlaneGeometry(100, 100);
	const groundMat = new THREE.MeshStandardMaterial({
		color: 0x808080,
		roughness: 0.7,
		metalness: 0.1,
	});
	const ground = new THREE.Mesh(groundGeo, groundMat);
	ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;
	scene.add(ground);

	const textureLoader = new THREE.TextureLoader();
	textureLoader.load("./GLBandFBX/texture_08.png", function (texture) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(100, 100);
		ground.material.map = texture;
		ground.material.needsUpdate = true;
	});

	// Environment
	new RGBELoader()
		.setPath(
			"https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/equirectangular/"
		)
		.load("royal_esplanade_1k.hdr", function (texture) {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			scene.background = texture;
			scene.environment = texture;
			console.log("Environment map loaded.");
		});

	// Handle window resize
	window.addEventListener("resize", () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	return { scene, camera, renderer, controls };
}
