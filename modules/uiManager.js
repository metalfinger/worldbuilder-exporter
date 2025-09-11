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

// Mouse tracking for velocity and stroke smoothing
let mouseHistory = [];
let lastMouseTime = 0;
let maxMouseHistoryLength = 5;

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

// Custom sticker management
const customStickers = new Map(); // Store custom stickers with unique IDs
let customStickerCounter = 0;
let currentStickerCategory = "default"; // Track current category view

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
	console.log("saveState called, paintCanvas:", paintCanvas);
	if (!paintCanvas) {
		console.log("No paintCanvas available, returning");
		return;
	}

	const imageData = paintCanvas.toDataURL();
	undoStack.push(imageData);
	console.log("State saved to undo stack. Stack length:", undoStack.length);

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
	// Update floating panel buttons
	const undoBtn = document.getElementById("undo-btn");
	const redoBtn = document.getElementById("redo-btn");

	console.log("updateUndoRedoButtons called");
	console.log("undoStack.length:", undoStack.length);
	console.log("redoStack.length:", redoStack.length);
	console.log("undoBtn element:", undoBtn);
	console.log("redoBtn element:", redoBtn);

	const undoDisabled = undoStack.length === 0;
	const redoDisabled = redoStack.length === 0;

	if (undoBtn) {
		undoBtn.disabled = undoDisabled;
		console.log("Undo button disabled:", undoDisabled);
	}
	if (redoBtn) {
		redoBtn.disabled = redoDisabled;
		console.log("Redo button disabled:", redoDisabled);
	}
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

	// Update mode status with shimmer effect (if element exists)
	const modeStatusElement = document.getElementById("mode-status");
	if (modeStatusElement) {
		modeStatusElement.classList.add("updating");
		setTimeout(() => modeStatusElement.classList.remove("updating"), 500);
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

	// Save initial canvas state for undo functionality
	// This ensures the undo button works even after the first paint stroke
	setTimeout(() => {
		saveState();
		console.log("Initial canvas state saved for undo/redo");
	}, 1000); // Wait a bit for canvas to be fully loaded

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

	// Check velocity and UV distance for stroke validation
	const velocityCheck = processStrokeWithVelocity(currentPoint, lastPoint);
	const uvDistanceCheck =
		!lastPoint || validateUVStroke(lastPoint, currentPoint);

	// If either velocity is too high or UV distance is too large, use stamping
	if (!velocityCheck || !uvDistanceCheck) {
		if (!uvDistanceCheck) {
			console.log("UV distance too large, using brush stamping");
		}
		paintBrushStamp(currentPoint);
		return;
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

// Validate UV stroke to prevent unwanted lines across disconnected areas
function validateUVStroke(startUV, endUV) {
	// Calculate UV distance
	const deltaX = Math.abs(endUV.x - startUV.x);
	const deltaY = Math.abs(endUV.y - startUV.y);
	const uvDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

	// Maximum UV distance threshold - adjust this value to tune sensitivity
	// Smaller values = more restrictive, larger values = more permissive
	const maxUVDistance = 0.1; // 10% of UV space

	return uvDistance <= maxUVDistance;
}

// Brush stamp function for discrete painting when line validation fails
function paintBrushStamp(currentPoint) {
	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();
	if (!paintCtx) return;

	// Determine which mask canvas to use
	let activeMaskCanvas = null;
	if (activeMask === "head" && headMaskCanvas) {
		activeMaskCanvas = headMaskCanvas;
	} else if (activeMask === "jacket" && jacketMaskCanvas) {
		activeMaskCanvas = jacketMaskCanvas;
	}

	if (activeMaskCanvas) {
		// Create a temporary canvas for the brush stamp
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = paintCanvas.width;
		tempCanvas.height = paintCanvas.height;
		const tempCtx = tempCanvas.getContext("2d");

		// Draw brush stamp on temp canvas
		tempCtx.fillStyle = hexToRgba(brushColor, brushOpacity);
		const x = currentPoint.x * paintCanvas.width;
		const y = (1 - currentPoint.y) * paintCanvas.height;

		tempCtx.beginPath();
		tempCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
		tempCtx.fill();

		// Apply mask to the stamp
		tempCtx.globalCompositeOperation = "destination-in";
		tempCtx.drawImage(activeMaskCanvas, 0, 0);

		// Draw the masked stamp onto the main paint canvas
		paintCtx.drawImage(tempCanvas, 0, 0);
	} else {
		// No mask - stamp normally
		paintCtx.fillStyle = hexToRgba(brushColor, brushOpacity);
		const x = currentPoint.x * paintCanvas.width;
		const y = (1 - currentPoint.y) * paintCanvas.height;

		paintCtx.beginPath();
		paintCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
		paintCtx.fill();
	}

	paintTexture.needsUpdate = true;
	updateMinimap();
	playPaintSound();
}

// Track mouse movement for velocity calculation
function trackMouseMovement(clientX, clientY) {
	const currentTime = Date.now();

	// Add current position to history
	mouseHistory.push({
		x: clientX,
		y: clientY,
		time: currentTime,
	});

	// Limit history length
	if (mouseHistory.length > maxMouseHistoryLength) {
		mouseHistory.shift();
	}

	lastMouseTime = currentTime;
}

// Calculate mouse velocity for stroke smoothing
function getMouseVelocity() {
	if (mouseHistory.length < 2) return 0;

	const recent = mouseHistory[mouseHistory.length - 1];
	const previous = mouseHistory[0];

	const deltaX = recent.x - previous.x;
	const deltaY = recent.y - previous.y;
	const deltaTime = recent.time - previous.time;

	if (deltaTime === 0) return 0;

	const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	return distance / deltaTime; // pixels per millisecond
}

// Enhanced stroke processing with velocity-based adjustments
function processStrokeWithVelocity(currentPoint, lastPoint) {
	const velocity = getMouseVelocity();
	const maxVelocity = 2.0; // pixels per millisecond

	// If moving too fast, use brush stamping instead of line drawing
	if (velocity > maxVelocity && lastPoint) {
		console.log(
			`Fast movement detected (${velocity.toFixed(
				2
			)} px/ms), using brush stamping`
		);
		return false; // Indicate that we should use stamping instead of line
	}

	return true; // Proceed with normal line drawing
}

// Enhanced stroke processing for eraser with velocity-based adjustments
function processEraserStrokeWithVelocity(currentPoint, lastPoint) {
	const velocity = getMouseVelocity();
	const maxVelocity = 2.0; // pixels per millisecond

	// If moving too fast, use eraser stamping instead of line drawing
	if (velocity > maxVelocity && lastPoint) {
		console.log(
			`Fast eraser movement detected (${velocity.toFixed(
				2
			)} px/ms), using eraser stamping`
		);
		return false; // Indicate that we should use stamping instead of line
	}

	return true; // Proceed with normal line drawing
}

// Eraser stamp function for discrete erasing when line validation fails
function eraseStamp(currentPoint) {
	const { albedoMap } = getCharacterTextures();
	const { paintCanvas, paintCtx, paintTexture } = getPaintCanvas();

	if (!paintCanvas || !paintCtx || !albedoMap || !albedoMap.image) {
		return;
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

	// Draw the eraser stamp (circle)
	eraserCtx.fillStyle = "white";
	eraserCtx.beginPath();
	eraserCtx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
	eraserCtx.fill();

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

	// Check velocity and UV distance for eraser stroke validation
	const velocityCheck = processEraserStrokeWithVelocity(
		currentPoint,
		lastPoint
	);
	const uvDistanceCheck =
		!lastPoint || validateUVStroke(lastPoint, currentPoint);

	// If either velocity is too high or UV distance is too large, use eraser stamping
	if (!velocityCheck || !uvDistanceCheck) {
		if (!uvDistanceCheck) {
			console.log("UV distance too large for eraser, using eraser stamping");
		}
		eraseStamp(currentPoint);
		return;
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

	const modeStatus = document.getElementById("mode-status");
	// Updated sticker list references for new structure
	const stickerListDefault = document.getElementById("sticker-list-default");
	const stickerListCustom = document.getElementById("sticker-list-custom");
	const stickerList = stickerListDefault; // Keep for backward compatibility
	const stickerSizeInput = document.getElementById("stickerSize");
	const stickerSizeValue = document.getElementById("stickerSizeValue");

	// Custom sticker upload elements
	const customStickerInput = document.getElementById("custom-sticker-input");
	const stickerUploadZone = document.getElementById("sticker-upload-zone");
	const uploadProgress = document.getElementById("upload-progress");
	const progressFill = document.getElementById("progress-fill");
	const progressText = document.getElementById("progress-text");
	const noCustomStickers = document.getElementById("no-custom-stickers");

	// Category tab elements
	const categoryTabs = document.querySelectorAll(".category-tab");
	const stickerGrids = document.querySelectorAll(".sticker-grid");

	// Cache cursor elements for performance
	brushIndicatorElement = document.getElementById("brush2dIndicator");
	eraserIndicatorElement = document.getElementById("eraser2dIndicator");
	stickerPreviewElement = document.getElementById("sticker-preview");

	// Layer panel elements (may not exist if panels were removed)
	const layerNone = document.getElementById("layer-none");
	const layerHead = document.getElementById("layer-head");
	const layerJacket = document.getElementById("layer-jacket");

	// Initialize sound
	paintSound = document.getElementById("paint-sound");

	// Add event listeners to existing undo/redo buttons
	const undoBtn = document.getElementById("undo-btn");
	const redoBtn = document.getElementById("redo-btn");
	if (undoBtn) {
		undoBtn.addEventListener("click", undo);
		console.log("Undo button event listener added");
	}
	if (redoBtn) {
		redoBtn.addEventListener("click", redo);
		console.log("Redo button event listener added");
	}

	function updateLayerUI() {
		// Remove active class from all layers (only if elements exist)
		if (layerNone) layerNone.classList.remove("active");
		if (layerHead) layerHead.classList.remove("active");
		if (layerJacket) layerJacket.classList.remove("active");

		// Add active class to current layer (only if elements exist)
		if (activeMask === "none" && layerNone) {
			layerNone.classList.add("active");
		} else if (activeMask === "head" && layerHead) {
			layerHead.classList.add("active");
		} else if (activeMask === "jacket" && layerJacket) {
			layerJacket.classList.add("active");
		}
	}

	function updatePanelVisibility() {
		const brushPanel = document.querySelector(".floating-brush-panel");
		const stickerPanel = document.querySelector(".floating-sticker-panel");
		const layersPanel = document.querySelector(".floating-layers-panel");
		const shortcutsPanel = document.querySelector(".floating-shortcuts-panel");

		// Hide all panels by default
		if (brushPanel) brushPanel.style.display = "none";
		if (stickerPanel) stickerPanel.style.display = "none";
		if (layersPanel) layersPanel.style.display = "none";
		if (shortcutsPanel) shortcutsPanel.style.display = "none";

		// Show relevant panels for each mode
		if (mode === "paint") {
			if (brushPanel) brushPanel.style.display = "block";
			if (layersPanel) layersPanel.style.display = "block";
			if (shortcutsPanel) shortcutsPanel.style.display = "block";
		} else if (mode === "eraser") {
			if (brushPanel) brushPanel.style.display = "block";
			if (layersPanel) layersPanel.style.display = "block";
			if (shortcutsPanel) shortcutsPanel.style.display = "block";
		} else if (mode === "sticker") {
			if (stickerPanel) stickerPanel.style.display = "block";
			if (layersPanel) layersPanel.style.display = "block";
			if (shortcutsPanel) shortcutsPanel.style.display = "block";
		} else if (mode === "rotate") {
			if (shortcutsPanel) shortcutsPanel.style.display = "block";
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

	// Validate if intersection point is a valid target for painting
	function isValidPaintTarget(intersection) {
		// Check if the face is front-facing (helps prevent painting on back faces)
		if (intersection.face) {
			const face = intersection.face;
			const object = intersection.object;

			// Get the world normal of the face
			const worldNormal = face.normal.clone();
			worldNormal.transformDirection(object.matrixWorld);

			// Get camera direction
			const cameraDirection = new THREE.Vector3();
			camera.getWorldDirection(cameraDirection);

			// Check if face is roughly facing the camera (dot product > 0)
			const dotProduct = worldNormal.dot(cameraDirection.negate());

			// Only paint on surfaces facing the camera (prevents back-face painting)
			return dotProduct > 0.1; // Threshold to avoid edge cases
		}

		return true; // Default to allowing paint if no face normal available
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

		// Update mode status (if element exists)
		if (mode === "paint") {
			if (modeStatus) modeStatus.textContent = "Paint Mode";
			paintBtn.classList.add("active");
			controls.enabled = false;
			renderer.domElement.style.cursor = "none";
			showToolStatus("🎨 Paint Mode - Click and drag to paint (Press B)");
			// Update brush controls for paint mode
			if (brushSizeInput) brushSizeInput.value = brushSize;
			if (brushSizeValue) brushSizeValue.textContent = brushSize;
			if (brushOpacityInput) brushOpacityInput.value = brushOpacity;
			if (brushOpacityValue)
				brushOpacityValue.textContent = brushOpacity.toFixed(2);
		} else if (mode === "eraser") {
			if (modeStatus) modeStatus.textContent = "Eraser Mode";
			eraserBtn.classList.add("active");
			controls.enabled = false;
			renderer.domElement.style.cursor = "none";
			showToolStatus(
				"🧽 Eraser Mode - Click and drag to erase to original (Press E)"
			);
			// Update brush controls for eraser mode
			if (brushSizeInput) brushSizeInput.value = eraserSize;
			if (brushSizeValue) brushSizeValue.textContent = eraserSize + " (Eraser)";
			if (brushOpacityInput) brushOpacityInput.value = 1.0; // Eraser is always full opacity
			if (brushOpacityValue) brushOpacityValue.textContent = "1.00 (Eraser)";
		} else if (mode === "sticker") {
			if (modeStatus) modeStatus.textContent = "Sticker Mode";
			stickerBtn.classList.add("active");
			controls.enabled = false;
			renderer.domElement.style.cursor = "none";
			showToolStatus(
				"🏷️ Sticker Mode - Click to place stickers, [ ] to resize (Press S)"
			);
		} else if (mode === "rotate") {
			if (modeStatus) modeStatus.textContent = "Rotate Mode";
			rotateBtn.classList.add("active");
			controls.enabled = true;
			renderer.domElement.style.cursor = "grab";
			showToolStatus("🔄 Rotate Mode - Drag to rotate view (Press Space)");
			console.log(
				"UI Manager: Rotate mode set, controls enabled:",
				controls.enabled
			);
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
				showToolStatus(
					"🧽 Eraser Mode - Erase anywhere on full body (Press E)"
				);
			} else if (mode === "paint") {
				showToolStatus("🎨 Paint Mode - Paint anywhere on model (Press B)");
			} else if (mode === "sticker") {
				showToolStatus("�️ Sticker Mode - Place stickers anywhere (Press S)");
			} else {
				showToolStatus("�🌐 Full Body - Paint anywhere on model");
			}
		} else if (maskName === "head") {
			if (scene) createMaskOverlay(scene, textures.headMaskMap, 0x00ff88);
			if (mode === "eraser") {
				showToolStatus(
					"🧽 Eraser Mode - Erase restricted to head area (Press E)"
				);
			} else if (mode === "paint") {
				showToolStatus(
					"🎨 Paint Mode - Paint restricted to head area (Press B)"
				);
			} else if (mode === "sticker") {
				showToolStatus(
					"🏷️ Sticker Mode - Place stickers on head only (Press S)"
				);
			} else {
				showToolStatus("👤 Head Only - Paint restricted to head area");
			}
		} else if (maskName === "jacket") {
			if (scene) createMaskOverlay(scene, textures.jacketMaskMap, 0x0088ff);
			if (mode === "eraser") {
				showToolStatus(
					"🧽 Eraser Mode - Erase restricted to jacket area (Press E)"
				);
			} else if (mode === "paint") {
				showToolStatus(
					"🎨 Paint Mode - Paint restricted to jacket area (Press B)"
				);
			} else if (mode === "sticker") {
				showToolStatus(
					"🏷️ Sticker Mode - Place stickers on jacket only (Press S)"
				);
			} else {
				showToolStatus("👔 Jacket Only - Paint restricted to jacket area");
			}
		}

		// Update layer button states
		updateLayerUI();

		// Update panel header for current mode
		updateBrushPanelForMode();
	}

	// Enhanced keyboard shortcuts with tool switching
	document.addEventListener("keydown", (e) => {
		// Track modifier keys
		if (e.key === "Shift") isShiftPressed = true;
		if (e.ctrlKey) isCtrlPressed = true;

		// Global shortcuts that work on any screen
		if (e.ctrlKey || e.metaKey) {
			switch (e.key.toLowerCase()) {
				case "z": // Ctrl+Z for undo
					e.preventDefault();
					if (e.shiftKey) {
						// Ctrl+Shift+Z for redo
						redo();
					} else {
						// Ctrl+Z for undo
						undo();
					}
					break;
				case "y": // Ctrl+Y for redo
					e.preventDefault();
					redo();
					break;
			}
		}

		// Tool shortcuts - only work on paint screen (screen 2)
		const currentScreen = document.body.getAttribute("data-screen");
		if (currentScreen === "paint" && !e.repeat) {
			// Prevent shortcuts when typing in text input fields, but allow for color/range inputs
			if (e.target.tagName === "INPUT") {
				const inputType = e.target.type.toLowerCase();
				// Block shortcuts only for text-based inputs
				if (
					inputType === "text" ||
					inputType === "email" ||
					inputType === "password" ||
					inputType === "search" ||
					inputType === "url" ||
					inputType === "tel"
				) {
					return;
				}
			} else if (e.target.tagName === "TEXTAREA") {
				return;
			}

			switch (e.key.toLowerCase()) {
				case " ": // Spacebar for rotate
					e.preventDefault(); // Prevent page scroll
					setMode("rotate");
					break;
				case "b": // B for brush
					e.preventDefault();
					setMode("paint");
					break;
				case "e": // E for eraser
					e.preventDefault();
					setMode("eraser");
					break;
				case "s": // S for stickers
					e.preventDefault();
					setMode("sticker");
					break;
			}
		}
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

	// Set initial mode
	setMode("rotate");

	// Enhanced layer panel event listeners (only if elements exist)
	if (layerNone) {
		layerNone.addEventListener("click", () => {
			setActiveMask("none");
			showNotification(
				"Full Body selected - paint anywhere on model",
				"success"
			);
		});
	}
	if (layerHead) {
		layerHead.addEventListener("click", () => {
			setActiveMask("head");
			showNotification(
				"Head Only selected - painting restricted to head area",
				"success"
			);
		});
	}
	if (layerJacket) {
		layerJacket.addEventListener("click", () => {
			setActiveMask("jacket");
			showNotification(
				"Jacket Only selected - painting restricted to jacket area",
				"success"
			);
		});
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

					stickerListDefault.appendChild(stickerEl);

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

	// Custom Sticker Management Functions
	function initializeCustomStickerFeatures() {
		// Load saved custom stickers from localStorage
		loadCustomStickersFromStorage();

		// Category tab switching
		categoryTabs.forEach((tab) => {
			tab.addEventListener("click", () => {
				const category = tab.dataset.category;
				switchStickerCategory(category);
			});
		});

		// File upload zone click handler
		if (stickerUploadZone) {
			stickerUploadZone.addEventListener("click", () => {
				customStickerInput.click();
			});

			// Drag and drop handlers
			stickerUploadZone.addEventListener("dragover", handleDragOver);
			stickerUploadZone.addEventListener("dragleave", handleDragLeave);
			stickerUploadZone.addEventListener("drop", handleDrop);
		}

		// File input change handler
		if (customStickerInput) {
			customStickerInput.addEventListener("change", (e) => {
				const files = Array.from(e.target.files);
				handleCustomStickerUpload(files);
			});
		}
	}

	function switchStickerCategory(category) {
		currentStickerCategory = category;

		// Update tab states
		categoryTabs.forEach((tab) => {
			tab.classList.toggle("active", tab.dataset.category === category);
		});

		// Update grid visibility
		stickerGrids.forEach((grid) => {
			grid.classList.toggle("active", grid.id === `sticker-list-${category}`);
		});

		// Update no custom stickers message visibility
		if (category === "custom" && customStickers.size === 0) {
			noCustomStickers.style.display = "block";
		} else {
			noCustomStickers.style.display = "none";
		}
	}

	function handleDragOver(e) {
		e.preventDefault();
		stickerUploadZone.classList.add("drag-over");
	}

	function handleDragLeave(e) {
		e.preventDefault();
		stickerUploadZone.classList.remove("drag-over");
	}

	function handleDrop(e) {
		e.preventDefault();
		stickerUploadZone.classList.remove("drag-over");

		const files = Array.from(e.dataTransfer.files).filter((file) =>
			file.type.startsWith("image/")
		);

		if (files.length > 0) {
			handleCustomStickerUpload(files);
		} else {
			showNotification("Please drop image files only", "warning");
		}
	}

	function handleCustomStickerUpload(files) {
		const validImageTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
		];
		const maxFileSize = 5 * 1024 * 1024; // 5MB limit

		const validFiles = files.filter((file) => {
			if (!validImageTypes.includes(file.type)) {
				showNotification(`Invalid file type: ${file.name}`, "error");
				return false;
			}
			if (file.size > maxFileSize) {
				showNotification(`File too large: ${file.name} (max 5MB)`, "error");
				return false;
			}
			return true;
		});

		if (validFiles.length === 0) return;

		// Show progress
		uploadProgress.style.display = "block";
		progressText.textContent = `Uploading ${validFiles.length} sticker(s)...`;

		let processed = 0;
		const total = validFiles.length;

		validFiles.forEach((file) => {
			processCustomSticker(file, () => {
				processed++;
				const progress = (processed / total) * 100;
				progressFill.style.width = `${progress}%`;

				if (processed === total) {
					setTimeout(() => {
						uploadProgress.style.display = "none";
						progressFill.style.width = "0%";
					}, 1000);

					showNotification(
						`Successfully uploaded ${total} sticker(s)!`,
						"success"
					);
					saveCustomStickersToStorage();
				}
			});
		});
	}

	function processCustomSticker(file, onComplete) {
		const reader = new FileReader();

		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				// Generate unique ID for custom sticker
				const stickerId = `custom_${Date.now()}_${customStickerCounter++}`;

				// Create canvas to optimize image
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				// Resize image if too large (max 512x512 for performance)
				const maxSize = 512;
				let { width, height } = img;

				if (width > maxSize || height > maxSize) {
					const scale = Math.min(maxSize / width, maxSize / height);
					width = Math.floor(width * scale);
					height = Math.floor(height * scale);
				}

				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(img, 0, 0, width, height);

				// Convert to data URL for storage
				const dataUrl = canvas.toDataURL("image/webp", 0.8);

				// Store in memory
				customStickers.set(stickerId, {
					id: stickerId,
					name: file.name,
					dataUrl: dataUrl,
					image: img,
					timestamp: Date.now(),
				});

				// Add to UI
				addCustomStickerToUI(stickerId, dataUrl, file.name);

				onComplete();
			};
			img.src = e.target.result;
		};

		reader.readAsDataURL(file);
	}

	function addCustomStickerToUI(stickerId, dataUrl, fileName) {
		const stickerEl = document.createElement("div");
		stickerEl.className = "sticker-item custom-sticker";
		stickerEl.style.backgroundImage = `url(${dataUrl})`;
		stickerEl.dataset.stickerId = stickerId;
		stickerEl.title = fileName;

		// Add delete button
		const deleteBtn = document.createElement("button");
		deleteBtn.className = "delete-sticker";
		deleteBtn.innerHTML = "×";
		deleteBtn.title = "Delete sticker";
		deleteBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			deleteCustomSticker(stickerId);
		});
		stickerEl.appendChild(deleteBtn);

		// Click handler for selection
		stickerEl.addEventListener("click", () => {
			document
				.querySelectorAll(".sticker-item.selected")
				.forEach((el) => el.classList.remove("selected"));
			stickerEl.classList.add("selected");

			const customSticker = customStickers.get(stickerId);
			if (customSticker) {
				selectedSticker = customSticker.image;

				// Update sticker preview immediately
				if (stickerPreviewElement && mode === "sticker") {
					updateStickerPreviewImage();
				}

				showNotification(`Custom sticker selected: ${fileName}`, "success");
			}
		});

		stickerListCustom.appendChild(stickerEl);

		// Hide no custom stickers message
		if (noCustomStickers) {
			noCustomStickers.style.display = "none";
		}
	}

	function deleteCustomSticker(stickerId) {
		if (customStickers.has(stickerId)) {
			// Remove from memory
			customStickers.delete(stickerId);

			// Remove from UI
			const stickerEl = document.querySelector(
				`[data-sticker-id="${stickerId}"]`
			);
			if (stickerEl) {
				stickerEl.remove();
			}

			// Show empty message if no custom stickers left
			if (customStickers.size === 0 && currentStickerCategory === "custom") {
				noCustomStickers.style.display = "block";
			}

			// Save updated list
			saveCustomStickersToStorage();

			showNotification("Custom sticker deleted", "info");
		}
	}

	function loadCustomStickersFromStorage() {
		try {
			const stored = localStorage.getItem("worldbuilder_custom_stickers");
			if (stored) {
				const data = JSON.parse(stored);
				data.forEach((stickerData) => {
					const img = new Image();
					img.onload = () => {
						customStickers.set(stickerData.id, {
							...stickerData,
							image: img,
						});
						addCustomStickerToUI(
							stickerData.id,
							stickerData.dataUrl,
							stickerData.name
						);
					};
					img.src = stickerData.dataUrl;
				});
			}
		} catch (error) {
			console.error("Failed to load custom stickers:", error);
		}
	}

	function saveCustomStickersToStorage() {
		try {
			const dataToSave = Array.from(customStickers.values()).map((sticker) => ({
				id: sticker.id,
				name: sticker.name,
				dataUrl: sticker.dataUrl,
				timestamp: sticker.timestamp,
			}));
			localStorage.setItem(
				"worldbuilder_custom_stickers",
				JSON.stringify(dataToSave)
			);
		} catch (error) {
			console.error("Failed to save custom stickers:", error);
			showNotification("Failed to save custom stickers", "error");
		}
	}

	// Performance-optimized mouse and touch event listeners
	renderer.domElement.addEventListener("mousemove", (event) => {
		const clientX =
			event.clientX || (event.touches && event.touches[0].clientX);
		const clientY =
			event.clientY || (event.touches && event.touches[0].clientY);

		// Track mouse movement for velocity calculation
		trackMouseMovement(clientX, clientY);

		// Use optimized throttled handler
		handleMouseMoveThrottled(clientX, clientY);

		if (!isPainting) return;

		const intersects = getIntersects(event);
		if (intersects.length > 0 && intersects[0].uv) {
			// Additional validation: check if intersection is on front-facing surface
			const intersection = intersects[0];
			if (intersection.face && isValidPaintTarget(intersection)) {
				if (mode === "paint") {
					paintAtUV(intersection.uv, lastPoint);
					lastPoint = intersection.uv;
				} else if (mode === "eraser") {
					eraseAtUV(intersection.uv, lastPoint);
					lastPoint = intersection.uv;
				} else if (mode === "sticker") {
					placeSticker(intersection.uv);
				}
			}
		}
	});

	renderer.domElement.addEventListener("mousedown", (event) => {
		if (mode === "rotate") return;
		isPainting = true;

		// Clear mouse history for new stroke
		mouseHistory = [];

		const intersects = getIntersects(event);
		if (intersects.length > 0 && intersects[0].uv) {
			const intersection = intersects[0];
			if (isValidPaintTarget(intersection)) {
				if (mode === "paint") {
					paintAtUV(intersection.uv, null);
					lastPoint = intersection.uv;
				} else if (mode === "eraser") {
					eraseAtUV(intersection.uv, null);
					lastPoint = intersection.uv;
				} else if (mode === "sticker") {
					placeSticker(intersection.uv);
				}
			}
		}
	});

	renderer.domElement.addEventListener("mouseup", () => {
		isPainting = false;
		lastPoint = null;
		// Clear mouse history when ending stroke
		mouseHistory = [];
	});

	renderer.domElement.addEventListener("mouseleave", () => {
		isPainting = false;
		lastPoint = null;
		// Clear mouse history when leaving canvas
		mouseHistory = [];
		hideCursorsOptimized();
	});

	// Enhanced touch events
	renderer.domElement.addEventListener(
		"touchstart",
		(event) => {
			if (mode === "rotate") return;
			isPainting = true;
			// Clear mouse history for new stroke
			mouseHistory = [];

			const intersects = getIntersects(event);
			if (intersects.length > 0 && intersects[0].uv) {
				const intersection = intersects[0];
				if (isValidPaintTarget(intersection)) {
					if (mode === "paint") {
						paintAtUV(intersection.uv, null);
						lastPoint = intersection.uv;
					} else if (mode === "eraser") {
						eraseAtUV(intersection.uv, null);
						lastPoint = intersection.uv;
					} else if (mode === "sticker") {
						placeSticker(intersection.uv);
					}
				}
			}
		},
		{ passive: false }
	);

	renderer.domElement.addEventListener(
		"touchmove",
		(event) => {
			if (mode === "rotate" || !isPainting) return;

			const clientX = event.touches && event.touches[0].clientX;
			const clientY = event.touches && event.touches[0].clientY;
			if (clientX !== undefined && clientY !== undefined) {
				trackMouseMovement(clientX, clientY);
			}

			const intersects = getIntersects(event);
			if (intersects.length > 0 && intersects[0].uv) {
				const intersection = intersects[0];
				if (isValidPaintTarget(intersection)) {
					if (mode === "paint") {
						paintAtUV(intersection.uv, lastPoint);
						lastPoint = intersection.uv;
					} else if (mode === "eraser") {
						eraseAtUV(intersection.uv, lastPoint);
						lastPoint = intersection.uv;
					}
				}
			}
		},
		{ passive: false }
	);

	renderer.domElement.addEventListener("touchend", () => {
		isPainting = false;
		lastPoint = null;
		// Clear mouse history when ending touch
		mouseHistory = [];
	});

	// Initialize everything
	loadStickers();
	initializeCustomStickerFeatures(); // Initialize custom sticker upload functionality
	updateLayerUI();
	updatePanelVisibility();

	// Setup panel toggle functionality
	setupPanelToggles();

	// Set initial layer state to ensure proper initialization
	setActiveMask("none");

	// Initialize undo/redo button states
	updateUndoRedoButtons();

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

			// Add visual feedback for mode change (if element exists)
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

// Auto-hide top UI elements
function setupTopUIAutoHide() {
	const topUiContainer = document.getElementById("top-ui-container");
	const screenProgress = document.querySelector(".screen-progress");
	const screenHeader = document.querySelector(".screen-header");

	let hideTimeout;

	function showTopUI() {
		if (screenProgress) screenProgress.classList.remove("auto-hidden");
		if (screenHeader) screenHeader.classList.remove("auto-hidden");
		if (topUiContainer) topUiContainer.classList.add("active");
		clearTimeout(hideTimeout);
		hideTimeout = setTimeout(hideTopUI, 3000); // Hide after 3 seconds
	}

	function hideTopUI() {
		if (screenProgress) screenProgress.classList.add("auto-hidden");
		if (screenHeader) screenHeader.classList.add("auto-hidden");
		if (topUiContainer) topUiContainer.classList.remove("active");
	}

	if (topUiContainer) {
		topUiContainer.addEventListener("mouseenter", showTopUI);
		topUiContainer.addEventListener("mouseleave", hideTopUI);
		document.addEventListener("mousemove", (e) => {
			if (e.clientY < 150) {
				showTopUI();
			}
		});
	}

	// Initially hide the UI
	hideTimeout = setTimeout(hideTopUI, 1000);
}

// Call this in your initialization logic
document.addEventListener("DOMContentLoaded", () => {
	// ... your other init code
	// setupTopUIAutoHide(); // Commented out to keep top UI visible all the time

	// Ensure top UI elements are always visible
	const topUiContainer = document.getElementById("top-ui-container");
	const screenProgress = document.querySelector(".screen-progress");
	const screenHeader = document.querySelector(".screen-header");

	if (topUiContainer) topUiContainer.classList.add("active");
	if (screenProgress) screenProgress.classList.remove("auto-hidden");
	if (screenHeader) screenHeader.classList.remove("auto-hidden");
});
