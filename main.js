import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TGALoader } from "three/addons/loaders/TGALoader.js";
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
const tgaLoader = new TGALoader();
const bodyAlbedo = tgaLoader.load(
	"./GLBandFBX/body_albedo.tga",
	() => console.log("Loaded body_albedo.tga"),
	undefined,
	(error) => console.error("Error loading body_albedo.tga", error)
);
bodyAlbedo.colorSpace = THREE.SRGBColorSpace;
const bodyNormal = tgaLoader.load(
	"./GLBandFBX/body_normal.tga",
	() => console.log("Loaded body_normal.tga"),
	undefined,
	(error) => console.error("Error loading body_normal.tga", error)
);
const accessoriesAlbedo = tgaLoader.load(
	"./GLBandFBX/accessories_albedo.tga",
	() => console.log("Loaded accessories_albedo.tga"),
	undefined,
	(error) => console.error("Error loading accessories_albedo.tga", error)
);
accessoriesAlbedo.colorSpace = THREE.SRGBColorSpace;
const accessoriesNormal = tgaLoader.load(
	"./GLBandFBX/accessories_normal.tga",
	() => console.log("Loaded accessories_normal.tga"),
	undefined,
	(error) => console.error("Error loading accessories_normal.tga", error)
);

// Model
console.log("Starting to load model...");
const loader = new FBXLoader();
loader.load(
	"./GLBandFBX/Walking.fbx",
	function (object) {
		console.log("Model loaded successfully.");

		mixer = new THREE.AnimationMixer(object);
		const action = mixer.clipAction(object.animations[0]);
		action.play();

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
				const materialName = material.name.toLowerCase();

				if (materialName === "char01") {
					console.log(`Applying body textures to material ${material.name}`);
					material.map = bodyAlbedo;
					material.normalMap = bodyNormal;
					material.needsUpdate = true;
				} else if (
					materialName.includes("accessories") ||
					materialName.includes("headset")
				) {
					console.log(
						`Applying accessories textures to material ${material.name}`
					);
					material.map = accessoriesAlbedo;
					material.normalMap = accessoriesNormal;
					material.needsUpdate = true;
				}
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
		groundTexture.offset.y -= 0.01;
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
