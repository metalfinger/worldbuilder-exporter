import * as THREE from "three";
import { getModel } from "./modelManager.js";
import { getPaintCanvas } from "./modelManager.js";

let brushColor = "#ff0000";
let brushSize = 20;
let brushOpacity = 1.0;
let lastPoint = null;
let lastMouseX = 0,
	lastMouseY = 0;
let isPainting = false;
let mode = "rotate"; // 'paint', 'rotate', or 'sticker'
let selectedSticker = null;
let stickerSize = 100;

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

function hexToRgba(hex, alpha) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function paintAtUV(uv) {
	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
	if (!paintCtx) return;

	const x = uv.x * paintCanvas.width;
	const y = (1 - uv.y) * paintCanvas.height;

	paintCtx.fillStyle = hexToRgba(brushColor, brushOpacity);
	paintCtx.beginPath();
	paintCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
	paintCtx.fill();

	paintTexture.needsUpdate = true;
}

function placeSticker(uv) {
	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
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

export function setupUI(camera, renderer, controls) {
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

	const brushColorInput = document.getElementById("brushColor");
	const brushSizeInput = document.getElementById("brushSize");
	const brushSizeValue = document.getElementById("brushSizeValue");
	const brushOpacityInput = document.getElementById("brushOpacity");
	const brushOpacityValue = document.getElementById("brushOpacityValue");
	const paintBtn = document.getElementById("paintBtn");
	const rotateBtn = document.getElementById("rotateBtn");
	const stickerBtn = document.getElementById("stickerBtn");
	const recordBtn = document.getElementById("recordBtn");
	const startRecordBtn = document.getElementById("startRecordBtn");
	const cancelRecordBtn = document.getElementById("cancelRecordBtn");
	const recordConfirmControls = document.getElementById(
		"record-confirm-controls"
	);
	const modeStatus = document.getElementById("mode-status");
	const stickerList = document.getElementById("sticker-list");
	const stickerTray = document.getElementById("sticker-tray");
	const stickerPreview = document.getElementById("sticker-preview");
	const brush2dIndicator = document.getElementById("brush2dIndicator");

	function getIntersects(event) {
		const model = getModel();
		if (!model) return [];
		const rect = renderer.domElement.getBoundingClientRect();
		const clientX =
			event.clientX || (event.touches && event.touches[0].clientX);
		const clientY =
			event.clientY || (event.touches && event.touches[0].clientY);
		mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(mouse, camera);
		return raycaster.intersectObject(model, true);
	}

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
		brush2dIndicator.style.background = brushColor + "22";
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
		});
	}

	function setMode(newMode) {
		mode = newMode;
		paintBtn.classList.remove("active");
		rotateBtn.classList.remove("active");
		stickerBtn.classList.remove("active");
		document.getElementById("brush-controls").style.display = "none";
		stickerTray.style.display = "none";
		hide2dIndicator();
		hideStickerPreview();

		if (mode === "paint") {
			modeStatus.textContent = "Paint Mode";
			paintBtn.classList.add("active");
			controls.enabled = false;
			document.getElementById("brush-controls").style.display = "flex";
			renderer.domElement.style.cursor = "none";
		} else if (mode === "rotate") {
			modeStatus.textContent = "Rotate Mode";
			rotateBtn.classList.add("active");
			controls.enabled = true;
			renderer.domElement.style.cursor = "grab";
		} else if (mode === "sticker") {
			modeStatus.textContent = "Sticker Mode";
			stickerBtn.classList.add("active");
			controls.enabled = false;
			stickerTray.style.display = "flex"; // Show mobile tray
			renderer.domElement.style.cursor = "none";
		} else if (mode === "record") {
			modeStatus.textContent = "Ready to Record";
			recordBtn.classList.add("active");
			controls.enabled = true; // Allow final camera adjustments
			renderer.domElement.style.cursor = "default";
			// Show confirm/cancel buttons and hide other mode buttons
			document.getElementById("mode-selector").style.display = "none";
			recordConfirmControls.style.display = "flex";
		}
	}

	function resetToPaintMode() {
		setMode("paint");
		document.getElementById("mode-selector").style.display = "flex";
		recordConfirmControls.style.display = "none";
	}

	if (paintBtn && rotateBtn && stickerBtn && recordBtn) {
		paintBtn.addEventListener("click", () => setMode("paint"));
		rotateBtn.addEventListener("click", () => setMode("rotate"));
		stickerBtn.addEventListener("click", () => setMode("sticker"));
		recordBtn.addEventListener("click", () => {
			// Enter the 'Ready to Record' state
			setMode("record");
		});
		// Set initial state
		setMode("rotate");
	}

	// Add event listener for the new cancel button
	if (cancelRecordBtn) {
		cancelRecordBtn.addEventListener("click", resetToPaintMode);
	}

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
					stickerEl.dataset.file = file;

					stickerEl.addEventListener("click", () => {
						document
							.querySelectorAll(".sticker-item.selected")
							.forEach((el) => el.classList.remove("selected"));
						stickerEl.classList.add("selected");
						selectedSticker = loadedStickers[file];
					});

					stickerList.appendChild(stickerEl);

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

	renderer.domElement.addEventListener("mousemove", (event) => {
		const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
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
			if (
				isPainting &&
				lastPoint &&
				intersects.length > 0 &&
				intersects[0].uv
			) {
				const currentUv = intersects[0].uv;
				const currentPoint = {
					x: currentUv.x * paintCanvas.width,
					y: (1 - currentUv.y) * paintCanvas.height,
				};

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
		const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
		if (mode === "paint") {
			isPainting = true;
			const intersects = getIntersects(event);
			if (intersects.length > 0 && intersects[0].uv) {
				const uv = intersects[0].uv;
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

	// Add touch event listeners after mouse ones
	renderer.domElement.addEventListener(
		"touchstart",
		(event) => {
			const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
			if (mode === "paint") {
				isPainting = true;
				const touch = event.touches[0];
				const intersects = getIntersects(touch);
				if (intersects.length > 0 && intersects[0].uv) {
					const uv = intersects[0].uv;
					paintAtUV(uv);
					lastPoint = {
						x: uv.x * paintCanvas.width,
						y: (1 - uv.y) * paintCanvas.height,
					};
				}
			} else if (mode === "sticker") {
				const touch = event.touches[0];
				const intersects = getIntersects(touch);
				if (intersects.length > 0 && intersects[0].uv) {
					placeSticker(intersects[0].uv);
				}
			}
		},
		{ passive: true }
	);

	renderer.domElement.addEventListener(
		"touchmove",
		(event) => {
			const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
			const touch = event.touches[0];
			lastMouseX = touch.clientX;
			lastMouseY = touch.clientY;
			if (mode === "paint" && isPainting) {
				update2dIndicator(touch.clientX, touch.clientY);
				const intersects = getIntersects(touch);
				if (intersects.length > 0 && intersects[0].uv) {
					const currentUv = intersects[0].uv;
					const currentPoint = {
						x: currentUv.x * paintCanvas.width,
						y: (1 - currentUv.y) * paintCanvas.height,
					};
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
			} else if (mode === "sticker") {
				showStickerPreview(touch.clientX, touch.clientY);
			}
		},
		{ passive: true }
	);

	renderer.domElement.addEventListener(
		"touchend",
		(event) => {
			isPainting = false;
			lastPoint = null;
			hideStickerPreview();
		},
		{ passive: true }
	);

	loadStickers();
	const closeStickerBtn = document.getElementById("close-sticker-drawer");
	if (closeStickerBtn) {
		closeStickerBtn.addEventListener("click", () => {
			stickerTray.style.display = "none";
		});
		closeStickerBtn.addEventListener("touchend", (e) => {
			e.preventDefault();
			stickerTray.style.display = "none";
		});
	}
	return { setMode };
}
