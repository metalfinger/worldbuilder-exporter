import * as THREE from "three";
import {
	getModel,
	getCharacterTextures,
	createMaskOverlay,
	hideMaskOverlay,
} from "./modelManager.js";
import { getPaintCanvas } from "./modelManager.js";

let brushColor = "#ff0000";
let brushSize = 20;
let brushOpacity = 1.0;
let eraserSize = 30;
let lastPoint = null;
let lastMouseX = 0,
	lastMouseY = 0;
let isPainting = false;
let mode = "rotate"; // 'paint', 'rotate', 'sticker', 'eraser'
let selectedSticker = null;
let stickerSize = 100;
let activeMask = "none"; // 'none', 'head', or 'jacket'
let headMaskCanvas, headMaskCtx, jacketMaskCanvas, jacketMaskCtx;

// Enhanced features
let undoStack = [];
let redoStack = [];
let colorHistory = [];
let paintSound = null;
let isShiftPressed = false;
let isCtrlPressed = false;

// Mobile auto-hide timers
let topBarHideTimer = null;
let panelHideTimer = null;
let lastUserInteraction = Date.now();

// Panel states - closed by default on mobile
let brushPanelClosed = true;
let stickerPanelClosed = true;

// Performance optimization variables
let animationFrameId = null;
let pendingUpdate = false;
let brushIndicatorElement = null;
let eraserIndicatorElement = null;
let stickerPreviewElement = null;
let lastBrushSize = 0;
let lastEraserSize = 0;
let lastStickerSize = 0;

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

// Performance-optimized cursor updates
function updateCursorsOptimized() {
	if (!pendingUpdate) return;

	if (mode === "paint" && brushIndicatorElement) {
		updateBrushIndicatorOptimized();
	} else if (mode === "eraser" && eraserIndicatorElement) {
		updateEraserIndicatorOptimized();
	} else if (mode === "sticker" && stickerPreviewElement) {
		updateStickerPreviewOptimized();
	}

	pendingUpdate = false;
}

function updateBrushIndicatorOptimized() {
	if (!brushIndicatorElement) return;

	const size = brushSize * 2;
	const x = lastMouseX - brushSize;
	const y = lastMouseY - brushSize;

	// Use CSS custom properties for smoother animations
	brushIndicatorElement.style.setProperty("--brush-x", `${x}px`);
	brushIndicatorElement.style.setProperty("--brush-y", `${y}px`);

	// Use transform for position (hardware accelerated)
	brushIndicatorElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;

	// Only update size and color if they changed
	if (lastBrushSize !== size) {
		brushIndicatorElement.style.width = size + "px";
		brushIndicatorElement.style.height = size + "px";
		// Add size change animation class briefly
		brushIndicatorElement.classList.add("size-changing");
		setTimeout(
			() => brushIndicatorElement.classList.remove("size-changing"),
			200
		);
		lastBrushSize = size;
	}

	// Batch color and border updates
	const colorStyle = brushColor;
	const backgroundStyle = brushColor + "22";

	if (brushIndicatorElement.style.borderColor !== colorStyle) {
		brushIndicatorElement.style.borderColor = colorStyle;
		brushIndicatorElement.style.backgroundColor = backgroundStyle;
	}

	// Update opacity indicator efficiently
	const opacityIndicator = brushIndicatorElement.querySelector(
		".brush-opacity-indicator"
	);
	if (opacityIndicator) {
		const opacityValue = Math.round(brushOpacity * 100);
		if (opacityIndicator.textContent !== opacityValue.toString()) {
			opacityIndicator.textContent = opacityValue;
			opacityIndicator.style.backgroundColor = `rgba(255, 255, 255, ${brushOpacity})`;
		}
	}

	brushIndicatorElement.style.display = "block";
}

function updateEraserIndicatorOptimized() {
	if (!eraserIndicatorElement) return;

	const size = eraserSize * 2;
	const x = lastMouseX - eraserSize;
	const y = lastMouseY - eraserSize;

	// Use transform for position (hardware accelerated)
	eraserIndicatorElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;

	// Only update size if it changed
	if (lastEraserSize !== size) {
		eraserIndicatorElement.style.width = size + "px";
		eraserIndicatorElement.style.height = size + "px";
		lastEraserSize = size;
	}

	// Update size indicator efficiently
	const sizeIndicator = eraserIndicatorElement.querySelector(
		".eraser-size-indicator"
	);
	if (sizeIndicator) {
		const sizeValue = eraserSize;
		if (sizeIndicator.textContent !== sizeValue.toString()) {
			sizeIndicator.textContent = sizeValue;
		}
	}

	eraserIndicatorElement.style.display = "block";
}

function updateStickerPreviewImage() {
	if (!stickerPreviewElement || !selectedSticker) return;

	// Get the image source - selectedSticker is an Image object from texture.image
	let imageSrc = "";
	if (selectedSticker.src) {
		imageSrc = selectedSticker.src;
	} else if (selectedSticker.currentSrc) {
		imageSrc = selectedSticker.currentSrc;
	} else {
		// Fallback: find the sticker file path from loadedStickers
		for (const [filePath, imageObj] of Object.entries(loadedStickers)) {
			if (imageObj === selectedSticker) {
				imageSrc = filePath;
				break;
			}
		}
	}

	if (imageSrc) {
		const newBgImage = `url(${imageSrc})`;
		if (stickerPreviewElement.style.backgroundImage !== newBgImage) {
			stickerPreviewElement.style.backgroundImage = newBgImage;
		}
	}
}

function updateStickerPreviewOptimized() {
	if (!stickerPreviewElement || !selectedSticker) return;

	const x = lastMouseX - stickerSize / 2;
	const y = lastMouseY - stickerSize / 2;

	// Use CSS custom properties for smoother animations
	stickerPreviewElement.style.setProperty("--sticker-x", `${x}px`);
	stickerPreviewElement.style.setProperty("--sticker-y", `${y}px`);

	// Use transform for position (hardware accelerated)
	stickerPreviewElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;

	// Only update size if it changed
	if (lastStickerSize !== stickerSize) {
		stickerPreviewElement.style.width = stickerSize + "px";
		stickerPreviewElement.style.height = stickerSize + "px";
		lastStickerSize = stickerSize;
	}

	// Update background image with selected sticker
	updateStickerPreviewImage();

	stickerPreviewElement.style.display = "block";
}

function requestCursorUpdate() {
	if (!pendingUpdate) {
		pendingUpdate = true;
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		animationFrameId = requestAnimationFrame(updateCursorsOptimized);
	}
}

function hideCursorsOptimized() {
	if (brushIndicatorElement) {
		brushIndicatorElement.style.display = "none";
	}
	if (eraserIndicatorElement) {
		eraserIndicatorElement.style.display = "none";
	}
	if (stickerPreviewElement) {
		stickerPreviewElement.style.display = "none";
	}

	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}
	pendingUpdate = false;
}

// Throttled mouse movement handler
let mouseThrottleTimeout = null;
function handleMouseMoveThrottled(clientX, clientY) {
	lastMouseX = clientX;
	lastMouseY = clientY;

	// Cancel previous timeout
	if (mouseThrottleTimeout) {
		clearTimeout(mouseThrottleTimeout);
	}

	// Update immediately for responsiveness
	requestCursorUpdate();

	// Set timeout for cleanup if no more movements
	mouseThrottleTimeout = setTimeout(() => {
		mouseThrottleTimeout = null;
	}, 16); // ~60fps
}

// Undo/Redo System
function saveState() {
	const { paintCanvas } = getPaintCanvas();
	if (!paintCanvas) return;

	const imageData = paintCanvas.toDataURL();
	undoStack.push(imageData);

	// Limit undo stack to 20 states for memory management
	if (undoStack.length > 20) {
		undoStack.shift();
	}

	// Clear redo stack when new action is performed
	redoStack = [];
	updateUndoRedoButtons();
}

function undo() {
	if (undoStack.length === 0) return;

	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
	if (!paintCanvas || !paintCtx) return;

	// Save current state to redo stack
	redoStack.push(paintCanvas.toDataURL());

	// Restore previous state
	const previousState = undoStack.pop();
	const img = new Image();
	img.onload = () => {
		paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
		paintCtx.drawImage(img, 0, 0);
		paintTexture.needsUpdate = true;
		updateMinimap();
		showNotification("Undo successful", "success");
	};
	img.src = previousState;

	updateUndoRedoButtons();
}

function redo() {
	if (redoStack.length === 0) return;

	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
	if (!paintCanvas || !paintCtx) return;

	// Save current state to undo stack
	undoStack.push(paintCanvas.toDataURL());

	// Restore next state
	const nextState = redoStack.pop();
	const img = new Image();
	img.onload = () => {
		paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
		paintCtx.drawImage(img, 0, 0);
		paintTexture.needsUpdate = true;
		updateMinimap();
		showNotification("Redo successful", "success");
	};
	img.src = nextState;

	updateUndoRedoButtons();
}

// Clear Canvas Function
function clearCanvas() {
	// Get original albedo texture from model manager
	const { albedoMap } = getCharacterTextures();
	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();

	if (!paintCanvas || !paintCtx || !albedoMap) {
		showNotification("Unable to clear canvas", "error");
		return;
	}

	// Save current state for undo before clearing
	saveState();

	// Clear the canvas and redraw original texture
	paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);

	// Wait for the albedo texture to be ready
	if (albedoMap.image && albedoMap.image.complete) {
		paintCtx.drawImage(
			albedoMap.image,
			0,
			0,
			paintCanvas.width,
			paintCanvas.height
		);
	} else {
		// If image isn't loaded, fill with white as fallback
		paintCtx.fillStyle = "#ffffff";
		paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
	}

	// Update texture
	paintTexture.needsUpdate = true;

	// Clear localStorage saved work
	localStorage.removeItem("worldbuilder-current-work");
	localStorage.removeItem("worldbuilder-work-timestamp");

	// Update minimap
	updateMinimap();

	// Show success notification
	showNotification("Canvas cleared - Fresh start!", "success");

	// Update undo/redo buttons
	updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
	// Update floating panel buttons (for mobile)
	const undoBtn = document.getElementById("undo-btn");
	const redoBtn = document.getElementById("redo-btn");

	// Update top bar buttons (for desktop)
	const undoBtnTopBar = document.getElementById("undo-btn-topbar");
	const redoBtnTopBar = document.getElementById("redo-btn-topbar");

	const undoDisabled = undoStack.length === 0;
	const redoDisabled = redoStack.length === 0;

	if (undoBtn) undoBtn.disabled = undoDisabled;
	if (redoBtn) redoBtn.disabled = redoDisabled;
	if (undoBtnTopBar) undoBtnTopBar.disabled = undoDisabled;
	if (redoBtnTopBar) redoBtnTopBar.disabled = redoDisabled;
}

// Color History System
function addToColorHistory(color) {
	if (colorHistory.includes(color)) {
		// Move to front if already exists
		colorHistory = colorHistory.filter((c) => c !== color);
	}

	colorHistory.unshift(color);

	// Keep only last 12 colors
	if (colorHistory.length > 12) {
		colorHistory = colorHistory.slice(0, 12);
	}

	updateColorHistoryDisplay();
	saveColorHistoryToStorage();
}

function updateColorHistoryDisplay() {
	const grid = document.getElementById("color-history-grid");
	if (!grid) return;

	grid.innerHTML = "";

	colorHistory.forEach((color, index) => {
		const colorItem = document.createElement("div");
		colorItem.className = "color-history-item";
		colorItem.style.backgroundColor = color;
		colorItem.title = color;

		if (color === brushColor) {
			colorItem.classList.add("active");
		}

		colorItem.addEventListener("click", () => {
			setBrushColor(color);
			showNotification(`Color selected: ${color}`, "success");
		});

		grid.appendChild(colorItem);
	});
}

function loadColorHistoryFromStorage() {
	const saved = localStorage.getItem("worldbuilder-color-history");
	if (saved) {
		try {
			colorHistory = JSON.parse(saved);
			updateColorHistoryDisplay();
		} catch (e) {
			console.warn("Failed to load color history:", e);
		}
	}
}

function saveColorHistoryToStorage() {
	localStorage.setItem(
		"worldbuilder-color-history",
		JSON.stringify(colorHistory)
	);
}

// Minimap System
function updateMinimap() {
	const minimapCanvas = document.getElementById("minimap-canvas");
	const { paintCanvas } = getPaintCanvas();

	if (!minimapCanvas || !paintCanvas) return;

	const ctx = minimapCanvas.getContext("2d");
	ctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);

	// Draw scaled version of paint canvas
	ctx.drawImage(paintCanvas, 0, 0, minimapCanvas.width, minimapCanvas.height);

	// Add border for current mask
	if (activeMask !== "none") {
		ctx.strokeStyle = activeMask === "head" ? "#00ff88" : "#0088ff";
		ctx.lineWidth = 2;
		ctx.strokeRect(0, 0, minimapCanvas.width, minimapCanvas.height);
	}
}

// Sound Effects
function playPaintSound() {
	if (paintSound && mode === "paint") {
		paintSound.currentTime = 0;
		paintSound.volume = 0.1;
		paintSound.play().catch((e) => console.log("Sound play failed:", e));
	}
}

// Notification System
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

	// Hide and remove after 3 seconds
	setTimeout(() => {
		notification.classList.remove("show");
		setTimeout(() => notification.remove(), 300);
	}, 3000);
}

// Tool Status Display
function showToolStatus(status) {
	const statusElement = document.getElementById("tool-status-viewport");
	const textElement = document.getElementById("tool-status-text");

	if (statusElement && textElement) {
		textElement.textContent = status;
		statusElement.classList.add("show");

		setTimeout(() => {
			statusElement.classList.remove("show");
		}, 2000);
	}
}

// Enhanced Brush Color Setting
function setBrushColor(color) {
	brushColor = color;
	const colorInput = document.getElementById("brushColor");
	if (colorInput) {
		colorInput.value = color;
	}

	// Update brush indicator - will be handled by next mouse move
	updateColorHistoryDisplay();

	// Update mode status with shimmer effect
	const modeStatus = document.getElementById("mode-status");
	if (modeStatus) {
		modeStatus.classList.add("updating");
		setTimeout(() => modeStatus.classList.remove("updating"), 500);
	}
}

// Save/Load Work
function saveWorkToStorage() {
	const { paintCanvas } = getPaintCanvas();
	if (!paintCanvas) return;

	const imageData = paintCanvas.toDataURL();
	localStorage.setItem("worldbuilder-current-work", imageData);
	localStorage.setItem("worldbuilder-work-timestamp", Date.now().toString());

	showNotification("Work auto-saved", "success");
}

function loadWorkFromStorage() {
	const saved = localStorage.getItem("worldbuilder-current-work");
	const timestamp = localStorage.getItem("worldbuilder-work-timestamp");

	if (saved && timestamp) {
		const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
		if (!paintCanvas || !paintCtx) return;

		const img = new Image();
		img.onload = () => {
			paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
			paintCtx.drawImage(img, 0, 0);
			paintTexture.needsUpdate = true;
			updateMinimap();

			const date = new Date(parseInt(timestamp));
			showNotification(
				`Previous work loaded from ${date.toLocaleString()}`,
				"success"
			);
		};
		img.src = saved;
	}
}

// Auto-save every 30 seconds
setInterval(saveWorkToStorage, 30000);

export function initializeMasks() {
	// --- Mask Setup ---
	const { headMaskMap, jacketMaskMap } = getCharacterTextures();
	const { paintCanvas } = getPaintCanvas();

	if (headMaskMap && headMaskMap.image && paintCanvas) {
		headMaskCanvas = document.createElement("canvas");
		headMaskCanvas.width = paintCanvas.width; // Match paint canvas size
		headMaskCanvas.height = paintCanvas.height; // Match paint canvas size
		headMaskCtx = headMaskCanvas.getContext("2d");

		// Draw the mask image scaled to match paint canvas
		headMaskCtx.drawImage(
			headMaskMap.image,
			0,
			0,
			paintCanvas.width,
			paintCanvas.height
		);

		// Convert RGB mask to alpha mask
		const imageData = headMaskCtx.getImageData(
			0,
			0,
			headMaskCanvas.width,
			headMaskCanvas.height
		);
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			// Use red channel as mask intensity (white = 255, black = 0)
			const maskValue = data[i]; // red channel
			data[i] = 255; // set red to white
			data[i + 1] = 255; // set green to white
			data[i + 2] = 255; // set blue to white
			data[i + 3] = maskValue; // set alpha to mask value
		}

		headMaskCtx.putImageData(imageData, 0, 0);
		console.log(
			"Head mask initialized:",
			headMaskCanvas.width,
			"x",
			headMaskCanvas.height
		);
	}

	if (jacketMaskMap && jacketMaskMap.image && paintCanvas) {
		jacketMaskCanvas = document.createElement("canvas");
		jacketMaskCanvas.width = paintCanvas.width; // Match paint canvas size
		jacketMaskCanvas.height = paintCanvas.height; // Match paint canvas size
		jacketMaskCtx = jacketMaskCanvas.getContext("2d");

		// Draw the mask image scaled to match paint canvas
		jacketMaskCtx.drawImage(
			jacketMaskMap.image,
			0,
			0,
			paintCanvas.width,
			paintCanvas.height
		);

		// Convert RGB mask to alpha mask
		const imageData = jacketMaskCtx.getImageData(
			0,
			0,
			jacketMaskCanvas.width,
			jacketMaskCanvas.height
		);
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			// Use red channel as mask intensity (white = 255, black = 0)
			const maskValue = data[i]; // red channel
			data[i] = 255; // set red to white
			data[i + 1] = 255; // set green to white
			data[i + 2] = 255; // set blue to white
			data[i + 3] = maskValue; // set alpha to mask value
		}

		jacketMaskCtx.putImageData(imageData, 0, 0);
		console.log(
			"Jacket mask initialized:",
			jacketMaskCanvas.width,
			"x",
			jacketMaskCanvas.height
		);
	}

	// Load saved work and color history
	loadWorkFromStorage();
	loadColorHistoryFromStorage();

	// Initialize first auto-save
	setTimeout(saveWorkToStorage, 5000);
	// --- End Mask Setup ---
}

function paintAtUV(currentPoint, lastPoint) {
	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
	if (!paintCtx) return;

	// Save state before painting for undo
	if (!lastPoint) {
		// Only save on new stroke
		saveState();
	}

	// Determine which mask canvas to use
	let activeMaskCanvas = null;
	if (activeMask === "head" && headMaskCanvas) {
		activeMaskCanvas = headMaskCanvas;
		console.log("Using head mask for painting");
	} else if (activeMask === "jacket" && jacketMaskCanvas) {
		activeMaskCanvas = jacketMaskCanvas;
		console.log("Using jacket mask for painting");
	} else {
		console.log("No mask active, painting freely");
	}

	if (activeMaskCanvas) {
		// Create a temporary canvas for the brush stroke
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = paintCanvas.width;
		tempCanvas.height = paintCanvas.height;
		const tempCtx = tempCanvas.getContext("2d");

		// Draw brush stroke on temp canvas
		tempCtx.strokeStyle = hexToRgba(brushColor, brushOpacity);
		tempCtx.fillStyle = hexToRgba(brushColor, brushOpacity);
		tempCtx.lineWidth = brushSize;
		tempCtx.lineCap = "round";
		tempCtx.lineJoin = "round";

		tempCtx.beginPath();
		const x = currentPoint.x * paintCanvas.width;
		const y = (1 - currentPoint.y) * paintCanvas.height;

		if (lastPoint) {
			const lastX = lastPoint.x * paintCanvas.width;
			const lastY = (1 - lastPoint.y) * paintCanvas.height;
			tempCtx.moveTo(lastX, lastY);
			tempCtx.lineTo(x, y);
			tempCtx.stroke();
		} else {
			tempCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
			tempCtx.fill();
		}

		console.log("Before masking - temp canvas has content");

		// Apply mask to the stroke using destination-in
		tempCtx.globalCompositeOperation = "destination-in";
		tempCtx.drawImage(activeMaskCanvas, 0, 0);

		console.log("After masking - applied mask to temp canvas");

		// Draw the masked stroke onto the main paint canvas
		paintCtx.drawImage(tempCanvas, 0, 0);

		console.log("Painted masked stroke to main canvas");
	} else {
		// No mask - paint normally
		paintCtx.strokeStyle = hexToRgba(brushColor, brushOpacity);
		paintCtx.fillStyle = hexToRgba(brushColor, brushOpacity);
		paintCtx.lineWidth = brushSize;
		paintCtx.lineCap = "round";
		paintCtx.lineJoin = "round";

		paintCtx.beginPath();
		const x = currentPoint.x * paintCanvas.width;
		const y = (1 - currentPoint.y) * paintCanvas.height;

		if (lastPoint) {
			const lastX = lastPoint.x * paintCanvas.width;
			const lastY = (1 - lastPoint.y) * paintCanvas.height;
			paintCtx.moveTo(lastX, lastY);
			paintCtx.lineTo(x, y);
			paintCtx.stroke();
		} else {
			paintCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
			paintCtx.fill();
		}
	}

	paintTexture.needsUpdate = true;
	updateMinimap();
	playPaintSound();
}

// Improved Eraser Function - Using Clear Canvas Approach with Layer Support
function eraseAtUV(currentPoint, lastPoint) {
	const { albedoMap } = getCharacterTextures();
	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();

	if (!paintCanvas || !paintCtx || !albedoMap || !albedoMap.image) {
		return;
	}

	// Save state before erasing for undo
	if (!lastPoint) {
		// Only save on new stroke
		saveState();
	}

	// Convert UV coordinates to canvas pixel coordinates
	const x = currentPoint.x * paintCanvas.width;
	const y = (1 - currentPoint.y) * paintCanvas.height;

	// Check mask restrictions if active
	if (activeMask !== "none") {
		const maskCanvas =
			activeMask === "head" ? headMaskCanvas : jacketMaskCanvas;
		if (!maskCanvas) return;

		// Check if the point is within the mask area
		const maskCtx = maskCanvas.getContext("2d");
		const imageData = maskCtx.getImageData(x, y, 1, 1);
		const alpha = imageData.data[3];

		// If alpha is 0 (transparent), we're outside the mask area
		if (alpha === 0) {
			return; // Don't erase outside mask
		}
	}

	// Create a temporary canvas to copy original texture data
	const tempCanvas = document.createElement("canvas");
	tempCanvas.width = paintCanvas.width;
	tempCanvas.height = paintCanvas.height;
	const tempCtx = tempCanvas.getContext("2d");

	// Draw the original texture to temp canvas
	tempCtx.drawImage(albedoMap.image, 0, 0, tempCanvas.width, tempCanvas.height);

	// Create eraser shape on a temporary canvas
	const eraserCanvas = document.createElement("canvas");
	eraserCanvas.width = paintCanvas.width;
	eraserCanvas.height = paintCanvas.height;
	const eraserCtx = eraserCanvas.getContext("2d");

	// Draw the eraser shape
	eraserCtx.fillStyle = "white";
	eraserCtx.strokeStyle = "white";
	eraserCtx.lineWidth = eraserSize;
	eraserCtx.lineCap = "round";
	eraserCtx.lineJoin = "round";

	if (lastPoint) {
		// Draw line from last point to current point
		const lastX = lastPoint.x * paintCanvas.width;
		const lastY = (1 - lastPoint.y) * paintCanvas.height;

		eraserCtx.beginPath();
		eraserCtx.moveTo(lastX, lastY);
		eraserCtx.lineTo(x, y);
		eraserCtx.stroke();
	} else {
		// Draw circle for single click
		eraserCtx.beginPath();
		eraserCtx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
		eraserCtx.fill();
	}

	// Apply mask restriction if active
	if (activeMask !== "none") {
		const maskCanvas =
			activeMask === "head" ? headMaskCanvas : jacketMaskCanvas;
		if (maskCanvas) {
			eraserCtx.globalCompositeOperation = "destination-in";
			eraserCtx.drawImage(maskCanvas, 0, 0);
		}
	}

	// Apply the eraser to the paint canvas
	paintCtx.save();

	// Remove painted pixels where eraser shape is
	paintCtx.globalCompositeOperation = "destination-out";
	paintCtx.drawImage(eraserCanvas, 0, 0);

	// Restore original texture in the erased areas
	paintCtx.globalCompositeOperation = "destination-over";
	paintCtx.drawImage(tempCanvas, 0, 0);

	// Restore context
	paintCtx.restore();

	// Update texture and minimap
	paintTexture.needsUpdate = true;
	updateMinimap();
	playPaintSound();
}

function placeSticker(uv) {
	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
	if (!paintCtx || !selectedSticker) return;

	// Save state for undo
	saveState();

	const x = uv.x * paintCanvas.width - stickerSize / 2;
	const y = (1 - uv.y) * paintCanvas.height - stickerSize / 2;

	// Determine which mask canvas to use
	let activeMaskCanvas = null;
	if (activeMask === "head" && headMaskCanvas) {
		activeMaskCanvas = headMaskCanvas;
	} else if (activeMask === "jacket" && jacketMaskCanvas) {
		activeMaskCanvas = jacketMaskCanvas;
	}

	if (activeMaskCanvas) {
		// Create a temporary canvas for the sticker
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = paintCanvas.width;
		tempCanvas.height = paintCanvas.height;
		const tempCtx = tempCanvas.getContext("2d");

		// Draw sticker on temp canvas
		tempCtx.drawImage(selectedSticker, x, y, stickerSize, stickerSize);

		// Apply mask to the sticker using destination-in
		tempCtx.globalCompositeOperation = "destination-in";
		tempCtx.drawImage(activeMaskCanvas, 0, 0);

		// Draw the masked sticker onto the main paint canvas
		paintCtx.drawImage(tempCanvas, 0, 0);
	} else {
		// No mask - place sticker normally
		paintCtx.drawImage(selectedSticker, x, y, stickerSize, stickerSize);
	}

	paintTexture.needsUpdate = true;
	updateMinimap();
	showNotification("Sticker placed!", "success");
}

export function setupUI(camera, renderer, controls) {
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

	// Get UI elements
	const brushColorInput = document.getElementById("brushColor");
	const brushSizeInput = document.getElementById("brushSize");
	const brushSizeValue = document.getElementById("brushSizeValue");
	const brushOpacityInput = document.getElementById("brushOpacity");
	const brushOpacityValue = document.getElementById("brushOpacityValue");
	const paintBtn = document.getElementById("paintBtn");
	const eraserBtn = document.getElementById("eraserBtn");
	const rotateBtn = document.getElementById("rotateBtn");
	const stickerBtn = document.getElementById("stickerBtn");
	const recordBtn = document.getElementById("recordBtn");
	const clearCanvasBtn = document.getElementById("clearCanvasBtn");
	const startRecordBtn = document.getElementById("startRecordBtn");
	const cancelRecordBtn = document.getElementById("cancelRecordBtn");
	const recordConfirmControls = document.getElementById(
		"record-confirm-controls"
	);
	const modeStatus = document.getElementById("mode-status");
	const stickerList = document.getElementById("sticker-list");
	const stickerSizeInput = document.getElementById("stickerSize");
	const stickerSizeValue = document.getElementById("stickerSizeValue");

	// Cache cursor elements for performance
	brushIndicatorElement = document.getElementById("brush2dIndicator");
	eraserIndicatorElement = document.getElementById("eraser2dIndicator");
	stickerPreviewElement = document.getElementById("sticker-preview");

	// Layer panel elements
	const layerNone = document.getElementById("layer-none");
	const layerHead = document.getElementById("layer-head");
	const layerJacket = document.getElementById("layer-jacket");

	// Initialize sound
	paintSound = document.getElementById("paint-sound");

	// Create undo/redo panel
	createUndoRedoPanel();

	function createUndoRedoPanel() {
		const panel = document.createElement("div");
		panel.className = "undo-redo-panel";
		panel.innerHTML = `
			<button id="undo-btn" class="undo-btn" title="Undo (Ctrl+Z)" disabled>↶</button>
			<button id="redo-btn" class="redo-btn" title="Redo (Ctrl+Y)" disabled>↷</button>
		`;
		document.body.appendChild(panel);

		// Add event listeners for both floating panel and top bar buttons
		document.getElementById("undo-btn").addEventListener("click", undo);
		document.getElementById("redo-btn").addEventListener("click", redo);

		// Add event listeners for top bar buttons (if they exist)
		const undoTopBar = document.getElementById("undo-btn-topbar");
		const redoTopBar = document.getElementById("redo-btn-topbar");
		if (undoTopBar) undoTopBar.addEventListener("click", undo);
		if (redoTopBar) redoTopBar.addEventListener("click", redo);
	}

	function updateLayerUI() {
		// Remove active class from all layers
		layerNone.classList.remove("active");
		layerHead.classList.remove("active");
		layerJacket.classList.remove("active");

		// Add active class to current layer
		if (activeMask === "none") {
			layerNone.classList.add("active");
		} else if (activeMask === "head") {
			layerHead.classList.add("active");
		} else if (activeMask === "jacket") {
			layerJacket.classList.add("active");
		}
	}

	function updatePanelVisibility() {
		const brushPanel = document.querySelector(".floating-brush-panel");
		const stickerPanel = document.querySelector(".floating-sticker-panel");
		const layersPanel = document.querySelector(".floating-layers-panel");

		// Hide all panels by default
		if (brushPanel) brushPanel.style.display = "none";
		if (stickerPanel) stickerPanel.style.display = "none";
		if (layersPanel) layersPanel.style.display = "none";

		// Show relevant panels for each mode
		if (mode === "paint") {
			if (brushPanel) brushPanel.style.display = "block";
			if (layersPanel) layersPanel.style.display = "block";
		} else if (mode === "eraser") {
			if (brushPanel) brushPanel.style.display = "block";
			if (layersPanel) layersPanel.style.display = "block";
		} else if (mode === "sticker") {
			if (stickerPanel) stickerPanel.style.display = "block";
			if (layersPanel) layersPanel.style.display = "block";
		}

		// Update body data attribute for CSS styling
		document.body.setAttribute("data-mode", mode);
	}

	function updateBrushPanelForMode() {
		const brushPanel = document.querySelector(".floating-brush-panel");
		const brushHeader = document.querySelector(
			".floating-brush-panel .panel-header span"
		);

		if (mode === "paint" && brushHeader) {
			brushHeader.textContent = "Brush Settings";
			brushPanel.style.borderColor = "rgba(255, 255, 255, 0.1)";
		} else if (mode === "eraser" && brushHeader) {
			let headerText = "Eraser Settings";
			if (activeMask === "head") {
				headerText = "Eraser Settings (Head Only)";
			} else if (activeMask === "jacket") {
				headerText = "Eraser Settings (Jacket Only)";
			}
			brushHeader.textContent = headerText;
			brushPanel.style.borderColor = "rgba(255, 107, 107, 0.3)";
		}
	}

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

	// Enhanced brush controls - work for both brush and eraser
	if (brushColorInput) {
		brushColorInput.addEventListener("input", (e) => {
			setBrushColor(e.target.value);
			addToColorHistory(e.target.value);
		});
	}
	if (brushSizeInput && brushSizeValue) {
		brushSizeInput.addEventListener("input", (e) => {
			const newSize = parseInt(e.target.value, 10);
			if (mode === "eraser") {
				eraserSize = newSize;
				brushSizeValue.textContent = eraserSize + " (Eraser)";
			} else {
				brushSize = newSize;
				brushSizeValue.textContent = brushSize;
			}
		});
	}
	if (brushOpacityInput && brushOpacityValue) {
		brushOpacityInput.addEventListener("input", (e) => {
			const newOpacity = parseFloat(e.target.value);
			if (mode !== "eraser") {
				// Eraser doesn't use opacity
				brushOpacity = newOpacity;
				brushOpacityValue.textContent = brushOpacity.toFixed(2);
			}
		});
	}

	// Sticker size control
	if (stickerSizeInput && stickerSizeValue) {
		stickerSizeInput.addEventListener("input", (e) => {
			const newSize = parseInt(e.target.value, 10);
			stickerSize = newSize;
			stickerSizeValue.textContent = newSize;

			// Update sticker preview immediately if in sticker mode
			if (mode === "sticker" && stickerPreviewElement) {
				// Force update the preview size
				lastStickerSize = 0; // Reset to force size update
				updateStickerPreviewOptimized();
			}
		});
	}

	function setMode(newMode) {
		mode = newMode;

		// Hide all cursors when switching modes
		hideCursorsOptimized();

		// Update tool buttons
		document
			.querySelectorAll(".tool-btn")
			.forEach((btn) => btn.classList.remove("active"));

		// Update mode status
		if (mode === "paint") {
			modeStatus.textContent = "Paint Mode";
			paintBtn.classList.add("active");
			controls.enabled = false;
			renderer.domElement.style.cursor = "none";
			showToolStatus("🎨 Paint Mode - Click and drag to paint");
			// Update brush controls for paint mode
			if (brushSizeInput) brushSizeInput.value = brushSize;
			if (brushSizeValue) brushSizeValue.textContent = brushSize;
			if (brushOpacityInput) brushOpacityInput.value = brushOpacity;
			if (brushOpacityValue)
				brushOpacityValue.textContent = brushOpacity.toFixed(2);
		} else if (mode === "eraser") {
			modeStatus.textContent = "Eraser Mode";
			eraserBtn.classList.add("active");
			controls.enabled = false;
			renderer.domElement.style.cursor = "none";
			showToolStatus("🧽 Eraser Mode - Click and drag to erase to original");
			// Update brush controls for eraser mode
			if (brushSizeInput) brushSizeInput.value = eraserSize;
			if (brushSizeValue) brushSizeValue.textContent = eraserSize + " (Eraser)";
			if (brushOpacityInput) brushOpacityInput.value = 1.0; // Eraser is always full opacity
			if (brushOpacityValue) brushOpacityValue.textContent = "1.00 (Eraser)";
		} else if (mode === "sticker") {
			modeStatus.textContent = "Sticker Mode";
			stickerBtn.classList.add("active");
			controls.enabled = false;
			renderer.domElement.style.cursor = "none";
			showToolStatus(
				"🏷️ Sticker Mode - Click to place stickers, [ ] to resize"
			);
		} else if (mode === "rotate") {
			modeStatus.textContent = "Rotate Mode";
			rotateBtn.classList.add("active");
			controls.enabled = true;
			renderer.domElement.style.cursor = "grab";
			showToolStatus("🔄 Rotate Mode - Drag to rotate view");
		} else if (mode === "record") {
			modeStatus.textContent = "Ready to Record";
			recordBtn.classList.add("active");
			controls.enabled = true;
			renderer.domElement.style.cursor = "default";
			recordConfirmControls.style.display = "flex";
			showToolStatus("🎬 Record Mode - Ready to capture animation");
		}

		updatePanelVisibility();
		updateBrushPanelForMode();
	}

	function setActiveMask(maskName) {
		activeMask = maskName;

		const model = getModel();
		const scene = model ? model.parent : null;
		const textures = getCharacterTextures();

		if (maskName === "none") {
			if (scene) hideMaskOverlay(scene);
			if (mode === "eraser") {
				showToolStatus("🧽 Eraser Mode - Erase anywhere on full body");
			} else {
				showToolStatus("🌐 Full Body - Paint anywhere on model");
			}
		} else if (maskName === "head") {
			if (scene) createMaskOverlay(scene, textures.headMaskMap, 0x00ff88);
			if (mode === "eraser") {
				showToolStatus("🧽 Head Only - Erase restricted to head area");
			} else {
				showToolStatus("👤 Head Only - Paint restricted to head area");
			}
		} else if (maskName === "jacket") {
			if (scene) createMaskOverlay(scene, textures.jacketMaskMap, 0x0088ff);
			if (mode === "eraser") {
				showToolStatus("🧽 Jacket Only - Erase restricted to jacket area");
			} else {
				showToolStatus("👔 Jacket Only - Paint restricted to jacket area");
			}
		}

		// Update layer button states
		updateLayerUI();

		// Update panel header for current mode
		updateBrushPanelForMode();
	}

	function resetToPaintMode() {
		setMode("paint");
		recordConfirmControls.style.display = "none";
	}

	// Keep only essential modifier key tracking (no shortcuts)
	document.addEventListener("keydown", (e) => {
		if (e.key === "Shift") isShiftPressed = true;
		if (e.ctrlKey) isCtrlPressed = true;
	});

	document.addEventListener("keyup", (e) => {
		isShiftPressed = e.shiftKey;
		isCtrlPressed = e.ctrlKey || e.metaKey;
	});

	// Tool buttons
	if (paintBtn) {
		paintBtn.addEventListener("click", () => setMode("paint"));
	}

	if (eraserBtn) {
		eraserBtn.addEventListener("click", () => setMode("eraser"));
	}

	if (stickerBtn) {
		stickerBtn.addEventListener("click", () => setMode("sticker"));
	}

	if (rotateBtn) {
		rotateBtn.addEventListener("click", () => setMode("rotate"));
	}

	if (recordBtn) {
		recordBtn.addEventListener("click", () => setMode("record"));
	}

	if (clearCanvasBtn) {
		clearCanvasBtn.addEventListener("click", clearCanvas);
	}

	// Set initial mode
	setMode("rotate");

	// Enhanced layer panel event listeners
	layerNone.addEventListener("click", () => {
		setActiveMask("none");
		showNotification("Full Body selected - paint anywhere on model", "success");
	});
	layerHead.addEventListener("click", () => {
		setActiveMask("head");
		showNotification(
			"Head Only selected - painting restricted to head area",
			"success"
		);
	});
	layerJacket.addEventListener("click", () => {
		setActiveMask("jacket");
		showNotification(
			"Jacket Only selected - painting restricted to jacket area",
			"success"
		);
	});

	// Record controls
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

						// Update sticker preview immediately when a new sticker is selected
						if (stickerPreviewElement && mode === "sticker") {
							updateStickerPreviewImage();
						}

						showNotification(
							`Sticker selected: ${file.split("/").pop()}`,
							"success"
						);
					});

					stickerList.appendChild(stickerEl);

					if (index === 0) {
						stickerEl.classList.add("selected");
						selectedSticker = loadedStickers[file];
					}
				},
				undefined,
				() => {
					console.error(`Failed to load sticker: ${file}`);
					showNotification(`Failed to load sticker: ${file}`, "error");
				}
			);
		});
	}

	// Performance-optimized mouse and touch event listeners
	renderer.domElement.addEventListener("mousemove", (event) => {
		const clientX =
			event.clientX || (event.touches && event.touches[0].clientX);
		const clientY =
			event.clientY || (event.touches && event.touches[0].clientY);

		// Use optimized throttled handler
		handleMouseMoveThrottled(clientX, clientY);

		if (!isPainting) return;

		const intersects = getIntersects(event);
		if (intersects.length > 0 && intersects[0].uv) {
			if (mode === "paint") {
				paintAtUV(intersects[0].uv, lastPoint);
				lastPoint = intersects[0].uv;
			} else if (mode === "eraser") {
				eraseAtUV(intersects[0].uv, lastPoint);
				lastPoint = intersects[0].uv;
			} else if (mode === "sticker") {
				placeSticker(intersects[0].uv);
			}
		}
	});

	renderer.domElement.addEventListener("mousedown", (event) => {
		if (mode === "rotate") return;
		isPainting = true;

		const intersects = getIntersects(event);
		if (intersects.length > 0 && intersects[0].uv) {
			if (mode === "paint") {
				paintAtUV(intersects[0].uv, null);
				lastPoint = intersects[0].uv;
			} else if (mode === "eraser") {
				eraseAtUV(intersects[0].uv, null);
				lastPoint = intersects[0].uv;
			} else if (mode === "sticker") {
				placeSticker(intersects[0].uv);
			}
		}
	});

	renderer.domElement.addEventListener("mouseup", () => {
		isPainting = false;
		lastPoint = null;
	});

	renderer.domElement.addEventListener("mouseleave", () => {
		isPainting = false;
		lastPoint = null;
		hideCursorsOptimized();
	});

	// Enhanced touch events
	renderer.domElement.addEventListener(
		"touchstart",
		(event) => {
			if (mode === "rotate") return;
			isPainting = true;
			const intersects = getIntersects(event);
			if (intersects.length > 0 && intersects[0].uv) {
				if (mode === "paint") {
					paintAtUV(intersects[0].uv, null);
					lastPoint = intersects[0].uv;
				} else if (mode === "eraser") {
					eraseAtUV(intersects[0].uv, null);
					lastPoint = intersects[0].uv;
				} else if (mode === "sticker") {
					placeSticker(intersects[0].uv);
				}
			}
		},
		{ passive: false }
	);

	renderer.domElement.addEventListener(
		"touchmove",
		(event) => {
			if (mode === "rotate" || !isPainting) return;
			const intersects = getIntersects(event);
			if (intersects.length > 0 && intersects[0].uv) {
				if (mode === "paint") {
					paintAtUV(intersects[0].uv, lastPoint);
					lastPoint = intersects[0].uv;
				} else if (mode === "eraser") {
					eraseAtUV(intersects[0].uv, lastPoint);
					lastPoint = intersects[0].uv;
				}
			}
		},
		{ passive: false }
	);

	renderer.domElement.addEventListener("touchend", () => {
		isPainting = false;
		lastPoint = null;
	});

	// Initialize everything
	loadStickers();
	updateLayerUI();
	updatePanelVisibility();

	// Setup panel toggle functionality
	setupPanelToggles();

	// Set initial layer state to ensure proper initialization
	setActiveMask("none");

	// Show welcome message
	setTimeout(() => {
		showNotification(
			"🌎 Welcome to WorldBuilder! Click the toolbar buttons to switch between tools",
			"success"
		);
	}, 1000);

	// Initialize mobile auto-hide system after everything is set up
	setTimeout(() => {
		initializeMobileAutoHide(setMode);
	}, 100);

	return { setMode };
}

// Mobile auto-hide functionality
function initializeMobileAutoHide(setModeFunction) {
	// Only enable on mobile devices
	if (window.innerWidth > 768) return;

	const brushPanel = document.querySelector(".floating-brush-panel");
	const stickerPanel = document.querySelector(".floating-sticker-panel");
	const undoRedoPanel = document.querySelector(".undo-redo-panel");

	// Start auto-hide timers for panels only (removed top bar auto-hide)
	function startPanelHideTimer() {
		clearTimeout(panelHideTimer);
		panelHideTimer = setTimeout(() => {
			if (brushPanel) brushPanel.classList.add("auto-hidden");
			if (stickerPanel) stickerPanel.classList.add("auto-hidden");
		}, 5000);
	}

	// Reset timers on user interaction
	function resetAutoHideTimers() {
		lastUserInteraction = Date.now();

		// Show panels (removed top bar handling)
		if (brushPanel) brushPanel.classList.remove("auto-hidden");
		if (stickerPanel) stickerPanel.classList.remove("auto-hidden");
		startPanelHideTimer();

		// Update undo/redo visibility based on stack
		updateUndoRedoVisibility();
	}

	// Update undo/redo panel visibility
	function updateUndoRedoVisibility() {
		if (undoRedoPanel) {
			if (undoStack.length > 0 || redoStack.length > 0) {
				undoRedoPanel.classList.add("has-actions");
			} else {
				undoRedoPanel.classList.remove("has-actions");
			}
		}
	}

	// Add touch event listeners for user interaction detection
	const interactionEvents = ["touchstart", "touchmove", "touchend", "click"];

	interactionEvents.forEach((eventType) => {
		document.addEventListener(eventType, resetAutoHideTimers, {
			passive: true,
		});
	});

	// Monitor tool changes to show relevant panels
	if (setModeFunction) {
		const originalSetMode = setModeFunction;
		window.setMode = function (newMode) {
			originalSetMode(newMode);

			// Reset panel timers when mode changes
			resetAutoHideTimers();

			// Add visual feedback for mode change
			const modeDisplay = document.getElementById("mode-status");
			if (modeDisplay) {
				modeDisplay.style.transform = "scale(1.1)";
				setTimeout(() => {
					modeDisplay.style.transform = "scale(1)";
				}, 200);
			}
		};
	}

	// Start initial timers
	startPanelHideTimer();

	// Update undo/redo visibility initially
	updateUndoRedoVisibility();
}

// Panel toggle functionality
function setupPanelToggles() {
	const brushPanel = document.getElementById("brush-controls");
	const stickerPanel = document.getElementById("sticker-panel");
	const brushToggleBtn = document.getElementById("brush-panel-toggle");
	const stickerToggleBtn = document.getElementById("sticker-panel-toggle");
	const paintFloatingToggle = document.getElementById("paint-toggle");
	const stickerFloatingToggle = document.getElementById("sticker-toggle");

	// Initialize panels as closed on mobile
	if (window.innerWidth <= 768) {
		if (brushPanel) brushPanel.classList.add("panel-closed");
		if (stickerPanel) stickerPanel.classList.add("panel-closed");
		brushPanelClosed = true;
		stickerPanelClosed = true;
	}

	// Close brush panel
	function closeBrushPanel() {
		brushPanelClosed = true;
		if (brushPanel) {
			brushPanel.classList.add("panel-closed");
		}
	}

	// Open brush panel
	function openBrushPanel() {
		brushPanelClosed = false;
		if (brushPanel) {
			brushPanel.classList.remove("panel-closed");
		}
	}

	// Close sticker panel
	function closeStickerPanel() {
		stickerPanelClosed = true;
		if (stickerPanel) {
			stickerPanel.classList.add("panel-closed");
		}
	}

	// Open sticker panel
	function openStickerPanel() {
		stickerPanelClosed = false;
		if (stickerPanel) {
			stickerPanel.classList.remove("panel-closed");
		}
	}

	// Event listeners for panel close buttons (X button)
	if (brushToggleBtn) {
		brushToggleBtn.addEventListener("click", closeBrushPanel);
		brushToggleBtn.addEventListener("touchend", (e) => {
			e.preventDefault();
			closeBrushPanel();
		});
	}

	if (stickerToggleBtn) {
		stickerToggleBtn.addEventListener("click", closeStickerPanel);
		stickerToggleBtn.addEventListener("touchend", (e) => {
			e.preventDefault();
			closeStickerPanel();
		});
	}

	// Event listeners for floating toggle buttons (to open panels)
	if (paintFloatingToggle) {
		paintFloatingToggle.addEventListener("click", openBrushPanel);
		paintFloatingToggle.addEventListener("touchend", (e) => {
			e.preventDefault();
			openBrushPanel();
		});
	}

	if (stickerFloatingToggle) {
		stickerFloatingToggle.addEventListener("click", openStickerPanel);
		stickerFloatingToggle.addEventListener("touchend", (e) => {
			e.preventDefault();
			openStickerPanel();
		});
	}
}
