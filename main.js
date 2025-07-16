import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let mixer;
const clock = new THREE.Clock();
let groundTexture;
let model;

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
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// Lighting
const hemisphereLight = new THREE.HemisphereLight(0x444444, 0xbbbbbb, 2);
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

const canvasSize = 1024; // You can adjust this for higher/lower resolution
const paintCanvas = document.createElement("canvas");
paintCanvas.width = canvasSize;
paintCanvas.height = canvasSize;
const paintCtx = paintCanvas.getContext("2d");

// 2. Create a THREE.CanvasTexture from the canvas
const paintTexture = new THREE.CanvasTexture(paintCanvas);
paintTexture.colorSpace = THREE.SRGBColorSpace;

const albedoMap = characterTextureLoader.load(
	"./GLBandFBX_010725/char01_albedo.webp",
	(texture) => {
		console.log("Loaded char01_albedo.webp");
		// Draw the loaded image to the canvas
		paintCtx.drawImage(texture.image, 0, 0, canvasSize, canvasSize);
		paintTexture.needsUpdate = true;
	},
	undefined,
	(error) => console.error("Error loading char01_albedo.webp", error)
);
albedoMap.colorSpace = THREE.SRGBColorSpace;

// --- Dynamic Texture Painting Setup ---
// 1. Create a canvas and draw the albedo texture onto it
// const canvasSize = 1024; // You can adjust this for higher/lower resolution
// const paintCanvas = document.createElement("canvas");
// paintCanvas.width = canvasSize;
// paintCanvas.height = canvasSize;
// const paintCtx = paintCanvas.getContext("2d");

// albedoMap.image.onload = () => {
// 	paintCtx.drawImage(albedoMap.image, 0, 0, canvasSize, canvasSize);
// };
// if (albedoMap.image.complete) {
// 	paintCtx.drawImage(albedoMap.image, 0, 0, canvasSize, canvasSize);
// }

// 2. Create a THREE.CanvasTexture from the canvas
// const paintTexture = new THREE.CanvasTexture(paintCanvas);
// paintTexture.colorSpace = THREE.SRGBColorSpace;

// --- End Dynamic Texture Painting Setup ---

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

		model = object;
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
				// Use the dynamic paint texture instead of the static albedoMap
				material.map = paintTexture;
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

// --- Painting Interaction ---
// Raycaster and mouse setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isPainting = false;

// Helper to get raycast intersections on the model
function getIntersects(event) {
	const rect = renderer.domElement.getBoundingClientRect();
	mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
	mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	// 'model' may not be defined yet if called before model loads
	if (model) {
		return raycaster.intersectObject(model, true);
	} else {
		return [];
	}
}

// Helper to convert hex color and alpha to rgba string
function hexToRgba(hex, alpha) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper to paint on the texture at a given UV coordinate
function paintAtUV(uv) {
	if (!paintCtx) return;

	// Convert UV to canvas coordinates
	const x = uv.x * paintCanvas.width;
	const y = (1 - uv.y) * paintCanvas.height; // UV origin is bottom-left, canvas is top-left

	// Draw a circle
	paintCtx.fillStyle = hexToRgba(brushColor, brushOpacity);
	paintCtx.beginPath();
	paintCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2); // Use brushSize/2 for radius
	paintCtx.fill();

	// Tell THREE.js to update the texture
	paintTexture.needsUpdate = true;
}

let brushColor = "#ff0000";
let brushSize = 20;
let brushOpacity = 1.0;
let lastPoint = null;
let lastMouseX = 0,
	lastMouseY = 0;

const stickerFiles = [
	"stickers/sticker1.png",
	"stickers/sticker2.png",
	"stickers/sticker3.png",
	"stickers/sticker4.png",
	"stickers/sticker5.png",
	"stickers/sticker6.png",
	"stickers/sticker7.png",
	"stickers/sticker8.png",
	"stickers/sticker9.png",
];
const loadedStickers = {};
let selectedSticker = null;
let stickerSize = 100;

// --- New Toolbar Event Listeners ---
const brushColorInput = document.getElementById("brushColor");
const brushSizeInput = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");
const brushOpacityInput = document.getElementById("brushOpacity");
const brushOpacityValue = document.getElementById("brushOpacityValue");

const paintBtn = document.getElementById("paintBtn");
const rotateBtn = document.getElementById("rotateBtn");
const stickerBtn = document.getElementById("stickerBtn");
const modeStatus = document.getElementById("mode-status");
const stickerDrawer = document.getElementById("sticker-drawer");
const stickerList = document.getElementById("sticker-list");
const stickerPreview = document.getElementById("sticker-preview");
const brush2dIndicator = document.getElementById("brush2dIndicator");

function hide2dIndicator() {
	if (brush2dIndicator) brush2dIndicator.style.display = "none";
}

function showStickerPreview(x, y) {
	if (!selectedSticker || mode !== "sticker") return;
	stickerPreview.style.display = "block";
	stickerPreview.style.backgroundImage = `url(${selectedSticker.src})`;
	stickerPreview.style.width = `${stickerSize}px`;
	stickerPreview.style.height = `${stickerSize}px`;
	stickerPreview.style.left = `${x - stickerSize / 2}px`;
	stickerPreview.style.top = `${y - stickerSize / 2}px`;
}

function hideStickerPreview() {
	stickerPreview.style.display = "none";
}

function update2dIndicator(x, y) {
	if (!brush2dIndicator) return;
	brush2dIndicator.style.left = x - brushSize + "px";
	brush2dIndicator.style.top = y - brushSize + "px";
	brush2dIndicator.style.width = brushSize * 2 + "px";
	brush2dIndicator.style.height = brushSize * 2 + "px";
	brush2dIndicator.style.borderRadius = "50%";
	brush2dIndicator.style.border = "2px solid " + brushColor;
	brush2dIndicator.style.background = brushColor + "22"; // semi-transparent fill
	brush2dIndicator.style.display = mode === "paint" ? "block" : "none";
}

if (brushColorInput) {
	brushColorInput.addEventListener("input", (e) => {
		brushColor = e.target.value;
		update2dIndicator(lastMouseX, lastMouseY);
	});
}
if (brushSizeInput && brushSizeValue) {
	brushSizeInput.addEventListener("input", (e) => {
		brushSize = parseInt(e.target.value, 10);
		brushSizeValue.textContent = brushSize;
		update2dIndicator(lastMouseX, lastMouseY);
	});
}
if (brushOpacityInput && brushOpacityValue) {
	brushOpacityInput.addEventListener("input", (e) => {
		brushOpacity = parseFloat(e.target.value);
		brushOpacityValue.textContent = brushOpacity.toFixed(2);
		// Opacity is now handled directly in paintAtUV, so no need to set globalAlpha
	});
}

let mode = "paint"; // 'paint' or 'rotate' or 'sticker'

function setMode(newMode) {
	mode = newMode;
	paintBtn.classList.remove("active");
	rotateBtn.classList.remove("active");
	stickerBtn.classList.remove("active");
	stickerDrawer.classList.remove("open");
	document.getElementById("brush-controls").style.display = "none";
	hide2dIndicator();
	hideStickerPreview();

	if (mode === "paint") {
		modeStatus.textContent = "Paint Mode";
		paintBtn.classList.add("active");
		controls.enabled = false;
		document.getElementById("brush-controls").style.display = "flex";
		renderer.domElement.style.cursor = "none"; // Hide cursor for painting
	} else if (mode === "rotate") {
		modeStatus.textContent = "Rotate Mode";
		rotateBtn.classList.add("active");
		controls.enabled = true;
		renderer.domElement.style.cursor = "grab"; // Show grab cursor for rotating
	} else if (mode === "sticker") {
		modeStatus.textContent = "Sticker Mode";
		stickerBtn.classList.add("active");
		controls.enabled = false;
		stickerDrawer.classList.add("open");
		renderer.domElement.style.cursor = "none";
	}
}

if (paintBtn && rotateBtn && stickerBtn) {
	paintBtn.addEventListener("click", () => setMode("paint"));
	rotateBtn.addEventListener("click", () => setMode("rotate"));
	stickerBtn.addEventListener("click", () => setMode("sticker"));
	// Set initial state
	setMode("paint");
}

// Sticker Logic
function loadStickers() {
	const textureLoader = new THREE.TextureLoader();
	stickerFiles.forEach((file, index) => {
		textureLoader.load(
			file,
			(texture) => {
				loadedStickers[file] = texture.image;
				const stickerEl = document.createElement("div");
				stickerEl.className = "sticker-item";
				stickerEl.style.backgroundImage = `url(${file})`;
				stickerEl.addEventListener("click", () => {
					// Deselect others
					document
						.querySelectorAll(".sticker-item.selected")
						.forEach((el) => el.classList.remove("selected"));
					// Select this one
					stickerEl.classList.add("selected");
					selectedSticker = loadedStickers[file];
				});
				stickerList.appendChild(stickerEl);

				// If it's the first sticker, select it by default
				if (index === 0) {
					stickerEl.classList.add("selected");
					selectedSticker = loadedStickers[file];
				}
			},
			undefined,
			() => console.error(`Failed to load sticker: ${file}`)
		);
	});
}

function placeSticker(uv) {
	if (!selectedSticker) return;

	const x = uv.x * paintCanvas.width;
	const y = (1 - uv.y) * paintCanvas.height;

	paintCtx.drawImage(
		selectedSticker,
		x - stickerSize / 2,
		y - stickerSize / 2,
		stickerSize,
		stickerSize
	);
	paintTexture.needsUpdate = true;
}

// 2D Brush Indicator
// --- End Painting Interaction ---
renderer.domElement.addEventListener("mousemove", (event) => {
	const rect = renderer.domElement.getBoundingClientRect();
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
	if (mode === "paint") {
		update2dIndicator(event.clientX, event.clientY);
	} else {
		hide2dIndicator();
	}

	if (mode === "sticker") {
		showStickerPreview(event.clientX, event.clientY);
	}

	const intersects = getIntersects(event);
	if (mode === "paint") {
		if (isPainting && lastPoint && intersects.length > 0 && intersects[0].uv) {
			const currentUv = intersects[0].uv;
			const currentPoint = {
				x: currentUv.x * paintCanvas.width,
				y: (1 - currentUv.y) * paintCanvas.height,
			};

			// Draw a line from the last point to the current one
			paintCtx.beginPath();
			paintCtx.moveTo(lastPoint.x, lastPoint.y);
			paintCtx.lineTo(currentPoint.x, currentPoint.y);
			paintCtx.strokeStyle = hexToRgba(brushColor, brushOpacity);
			paintCtx.lineWidth = brushSize;
			paintCtx.lineCap = "round";
			paintCtx.lineJoin = "round";
			paintCtx.stroke();

			lastPoint = currentPoint;
			paintTexture.needsUpdate = true;
		}
	}
});
renderer.domElement.addEventListener("mousedown", (event) => {
	if (mode === "paint") {
		isPainting = true;
		const intersects = getIntersects(event);
		if (intersects.length > 0 && intersects[0].uv) {
			const uv = intersects[0].uv;
			// Start a new stroke with a dot
			paintCtx.fillStyle = hexToRgba(brushColor, brushOpacity);
			paintCtx.beginPath();
			const x = uv.x * paintCanvas.width;
			const y = (1 - uv.y) * paintCanvas.height;
			paintCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
			paintCtx.fill();

			lastPoint = { x, y };
			paintTexture.needsUpdate = true;
		}
	} else if (mode === "sticker") {
		const intersects = getIntersects(event);
		if (intersects.length > 0 && intersects[0].uv) {
			placeSticker(intersects[0].uv);
		}
	}
});

renderer.domElement.addEventListener("mouseup", () => {
	isPainting = false;
	lastPoint = null;
});

renderer.domElement.addEventListener("mouseout", () => {
	isPainting = false;
	lastPoint = null;
	hideStickerPreview();
});
renderer.domElement.addEventListener("mouseleave", () => {
	hide2dIndicator();
});
renderer.domElement.addEventListener("mouseenter", (event) => {
	if (mode === "paint") update2dIndicator(event.clientX, event.clientY);
});

loadStickers();

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
