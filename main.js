import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let mixer;
const clock = new THREE.Clock();
let groundTexture;

// Scene
const scene = new THREE.Scene();
// No longer setting a flat color background, will use an environment map

// Camera
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.set(0, 1.5, 4);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// Lighting
const hemisphereLight = new THREE.HemisphereLight(0x444444, 0xbbbbbb, 1);
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(3, 3, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1);
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
	groundTexture = texture;
	groundTexture.wrapS = THREE.RepeatWrapping;
	groundTexture.wrapT = THREE.RepeatWrapping;
	groundTexture.repeat.set(100, 100);
	ground.material.map = groundTexture;
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

// Texture Loader
console.log("Starting to load textures...");
const characterTextureLoader = new THREE.TextureLoader();

const albedoMap = characterTextureLoader.load(
	"./GLBandFBX_010725/char01_albedo.webp",
	() => console.log("Loaded char01_albedo.webp"),
	undefined,
	(error) => console.error("Error loading char01_albedo.webp", error)
);
albedoMap.colorSpace = THREE.SRGBColorSpace;

const normalMap = characterTextureLoader.load(
	"./GLBandFBX_010725/char01_normal.webp",
	() => console.log("Loaded char01_normal.webp"),
	undefined,
	(error) => console.error("Error loading char01_normal.webp", error)
);

const metalnessMap = characterTextureLoader.load(
	"./GLBandFBX_010725/char01_metalness.webp",
	() => console.log("Loaded char01_metalness.webp"),
	undefined,
	(error) => console.error("Error loading char01_metalness.webp", error)
);

const roughnessMap = characterTextureLoader.load(
	"./GLBandFBX_010725/char01_roughness.webp",
	() => console.log("Loaded char01_roughness.webp"),
	undefined,
	(error) => console.error("Error loading char01_roughness.webp", error)
);

// Model
console.log("Starting to load model...");
const loader = new FBXLoader();
loader.load(
	"./GLBandFBX_010725/Char01_FBX.fbx",
	function (object) {
		console.log("Model loaded successfully.");

		if (object.animations && object.animations.length > 0) {
			mixer = new THREE.AnimationMixer(object);
			const action = mixer.clipAction(object.animations[0]);
			action.play();
		}

		const model = object;
		model.scale.setScalar(0.01);
		model.position.set(0, 0, 0);

		model.traverse((node) => {
			if (!node.isMesh) return;

			node.castShadow = true;
			node.receiveShadow = true;

			const materials = Array.isArray(node.material)
				? node.material
				: [node.material];

			materials.forEach((material) => {
				console.log(`Applying PBR textures to material ${material.name}`);
				material.map = albedoMap;
				material.normalMap = normalMap;
				material.metalnessMap = metalnessMap;
				material.roughnessMap = roughnessMap;
				material.metalness = 1.0;
				material.roughness = 1.0;
				material.needsUpdate = true;
			});
		});

		scene.add(model);
	},
	undefined,
	function (error) {
		console.error("Error loading model:", error);
	}
);

// Animation loop
function animate() {
	requestAnimationFrame(animate);

	const delta = clock.getDelta();
	if (mixer) mixer.update(delta);

	if (groundTexture) {
		// groundTexture.offset.y -= 0.01;
	}

	controls.update();
	renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
