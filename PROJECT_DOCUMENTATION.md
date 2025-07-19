# 🌎 WorldBuilder Project - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Core Features](#core-features)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [How to Modify Features](#how-to-modify-features)
6. [Technical Architecture](#technical-architecture)
7. [Asset Management](#asset-management)
8. [Performance Optimizations](#performance-optimizations)
9. [Troubleshooting](#troubleshooting)
10. [Development Guide](#development-guide)

---

## 🎯 Project Overview

**WorldBuilder** is a web-based 3D character customization and animation tool built with Three.js. Users can paint directly on 3D models, apply stickers, use layer-based masking, and record their animations. The application features a modern floating UI design with real-time performance optimizations.

### Key Capabilities
- ✨ **3D Model Painting**: Direct texture painting on 3D models with brush controls
- 🏷️ **Sticker System**: Place and position stickers on the model
- 🎭 **Layer Masking**: Restrict painting to specific areas (head, jacket)
- 🎬 **Animation Recording**: Record and export screen captures with audio
- 💾 **Session Persistence**: Auto-save and restore work
- ⚡ **Performance Optimized**: Hardware-accelerated UI with smooth interactions

---

## 📁 Project Structure

```
Worldbuilder-website-25/
├── index.html                  # Main HTML entry point
├── style.css                   # Complete UI styling
├── main.js                     # Application bootstrap
├── server.js                   # Development server
├── modules/                    # Core JavaScript modules
│   ├── sceneSetup.js          # Three.js scene configuration
│   ├── modelManager.js        # 3D model and texture management
│   ├── materialManager.js     # Material creation and shaders
│   ├── uiManager.js           # UI interactions and painting logic
│   ├── animationManager.js    # Character animations
│   ├── recordingManager.js    # Screen recording functionality
│   └── assetLoader.js         # Asset loading utilities
├── assets/                     # Audio and animation assets
│   ├── audio.mp3              # Background audio
│   └── Record_Animation1.fbx  # Animation files
├── GLBandFBX_010725/          # 3D Model and texture assets
│   ├── Char01_FBX.fbx         # Character 3D model
│   ├── Char01_GLB.glb         # Alternative GLB format
│   ├── char01_albedo.webp     # Base color texture
│   ├── char01_normal.webp     # Normal map
│   ├── char01_metalness.webp  # Metalness map
│   ├── char01_roughness.webp  # Roughness map
│   └── char01_mask_head.webp  # Head mask for restricted painting
│   └── char01_mask_jacket.webp # Jacket mask for restricted painting
├── stickers/                   # Sticker image assets
│   ├── sticker1.png           # Individual sticker files
│   └── ... (sticker2-9.png)
└── README.md                   # Basic project information
```

---

## 🚀 Core Features

### 1. 3D Model Painting System
- **Real-time painting** directly on 3D model surface
- **Brush controls**: Size (1-100px), opacity (0-1), color picker
- **Layer masking**: Restrict painting to head or jacket areas
- **Undo/Redo**: 20-level history system
- **Auto-save**: Session persistence every 30 seconds

### 2. Sticker Application
- **9 pre-loaded stickers** with visual preview
- **Real-time positioning** with mouse/touch tracking
- **Size control** and **mask-aware placement**
- **Visual feedback** with preview overlay

### 3. Interactive Tools
- **Paint Mode (B)**: Brush painting with full controls
- **Rotate Mode (Space)**: 3D orbit controls for viewing
- **Sticker Mode (S)**: Sticker placement and positioning
- **Record Mode (R)**: Screen recording with audio

### 4. Advanced UI Features
- **Floating panel design** for maximum viewport visibility
- **Hardware-accelerated cursors** for smooth tracking
- **Color history panel** with recent color memory
- **Mini-map view** showing painted areas
- **Real-time notifications** for user feedback
- **Keyboard shortcuts** for all major functions

---

## 📄 File-by-File Breakdown

### `index.html` - Main Application Structure
**Purpose**: HTML foundation and UI layout
**Key Elements**:
- Floating toolbar with tool buttons (rotate, paint, sticker, record)
- Brush control panels (color, size, opacity, history)
- Layer selection panel (full model, head mask, jacket mask)
- Sticker gallery with preview thumbnails
- Mini-map display canvas
- Viewport container for Three.js canvas
- Tool status displays and notification areas

**UI Components**:
```html
<!-- Floating Toolbar -->
<div class="floating-toolbar">
  <button id="rotateBtn">Rotate</button>
  <button id="paintBtn">Paint</button>
  <button id="stickerBtn">Sticker</button>
  <button id="recordBtn">Record</button>
</div>

<!-- Brush Controls -->
<div class="floating-brush-panel">
  <input id="brushColor" type="color">
  <input id="brushSize" type="range" min="1" max="100">
  <input id="brushOpacity" type="range" min="0" max="1" step="0.01">
</div>

<!-- Layer Panel -->
<div class="floating-layers-panel">
  <button id="layer-none">Full Model</button>
  <button id="layer-head">Head Only</button>
  <button id="layer-jacket">Jacket Only</button>
</div>
```

---

### `style.css` - Complete UI Styling
**Purpose**: Modern floating UI design with glassmorphism effects
**Key Features**:
- **Glassmorphism panels** with backdrop blur and transparency
- **Hardware-accelerated animations** using `transform3d` and `will-change`
- **Responsive design** that adapts to different screen sizes
- **Dark theme** with blue accent colors (#0078d4)
- **Smooth transitions** for all interactive elements
- **Performance-optimized cursors** for paint and sticker modes

**CSS Architecture**:
```css
/* Core Variables */
:root {
  --primary-color: #0078d4;
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
}

/* Hardware Acceleration */
.floating-panel {
  transform: translate3d(0, 0, 0);
  will-change: transform;
  backdrop-filter: blur(10px);
}

/* Performance Optimized Cursors */
#brush2dIndicator {
  position: fixed;
  transform: translate3d(0, 0, 0);
  will-change: transform, width, height;
}
```

---

### `main.js` - Application Bootstrap
**Purpose**: Entry point that initializes the entire application
**Flow**:
1. Sets up Three.js scene, camera, renderer
2. Loads 3D model and all textures
3. Initializes UI controls and event handlers
4. Starts animation loop and auto-save system

```javascript
import { setupScene } from './modules/sceneSetup.js';
import { loadModel } from './modules/modelManager.js';
import { setupUI, initializeMasks } from './modules/uiManager.js';
import { setupAnimations } from './modules/animationManager.js';

// Initialize complete application
const { scene, camera, renderer, controls } = setupScene();
loadModel(scene, (model) => {
  setupUI(camera, renderer, controls);
  initializeMasks();
  setupAnimations(model);
});
```

---

### `modules/sceneSetup.js` - Three.js Scene Configuration
**Purpose**: Creates and configures the 3D rendering environment
**Responsibilities**:
- **Scene creation** with proper lighting setup
- **Camera configuration** (PerspectiveCamera with optimal FOV)
- **Renderer setup** with shadows, tone mapping, and anti-aliasing
- **OrbitControls** for 3D navigation
- **Environment mapping** with HDR background
- **Ground plane** with repeating texture
- **Window resize handling** for responsive design

**Key Configuration**:
```javascript
// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 2);

// Renderer Configuration
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Lighting Setup
const hemisphereLight = new THREE.HemisphereLight(0x444444, 0xbbbbbb, 1);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.castShadow = true;
```

---

### `modules/modelManager.js` - 3D Model and Texture Management
**Purpose**: Handles all 3D model loading, texture management, and paint canvas setup
**Core Components**:

#### Paint Canvas System
```javascript
// Dynamic texture painting setup
const canvasSize = 1024;
const paintCanvas = document.createElement("canvas");
paintCanvas.width = canvasSize;
paintCanvas.height = canvasSize;
const paintCtx = paintCanvas.getContext("2d");
const paintTexture = new THREE.CanvasTexture(paintCanvas);
```

#### Model Loading Pipeline
1. **Load all textures** (albedo, normal, metalness, roughness, masks)
2. **Load FBX model** with proper scaling and positioning
3. **Initialize paint canvas** with base texture as starting point
4. **Apply custom materials** to all mesh nodes
5. **Setup shadow casting/receiving**

#### Mask Overlay System
- **createMaskOverlay()**: Shows visual overlay of selected mask area
- **hideMaskOverlay()**: Removes mask visualization
- **Clones model geometry** for overlay rendering
- **Uses additive blending** for glow effect

**Key Functions**:
```javascript
export function loadModel(scene, onModelLoaded) {
  // Load textures and model
  // Initialize paint canvas with base texture
  // Setup materials and add to scene
}

export function getPaintCanvas() {
  return { paintCanvas, paintCtx, paintTexture };
}

export function getCharacterTextures() {
  return { paintTexture, normalMap, metalnessMap, roughnessMap, headMaskMap, jacketMaskMap, albedoMap };
}
```

---

### `modules/materialManager.js` - Material Creation and Shaders
**Purpose**: Creates and manages Three.js materials for the character model
**Features**:
- **MeshStandardMaterial** with PBR (Physically Based Rendering)
- **Complete texture mapping** (albedo, normal, metalness, roughness)
- **Proper skinning support** for animated models
- **Mask overlay materials** with transparency and additive blending

```javascript
export function createCustomMaterial(textures, originalMaterial) {
  const { paintTexture, normalMap, metalnessMap, roughnessMap } = textures;
  
  return new THREE.MeshStandardMaterial({
    map: paintTexture,           // Paint canvas as main texture
    normalMap: normalMap,        // Surface detail
    metalnessMap: metalnessMap,  // Metallic properties
    roughnessMap: roughnessMap,  // Surface roughness
    metalness: 1.0,
    roughness: 1.0,
    skinning: originalMaterial && originalMaterial.skinning,
  });
}
```

---

### `modules/uiManager.js` - UI Interactions and Painting Logic
**Purpose**: The largest and most complex module handling all user interactions
**Major Systems**:

#### 1. Mode Management
```javascript
let mode = "rotate"; // 'paint', 'rotate', 'sticker', 'record'

function setMode(newMode) {
  // Update UI state
  // Enable/disable controls
  // Show appropriate cursors
  // Update tool status
}
```

#### 2. Painting System
```javascript
function paintAtUV(currentPoint, lastPoint) {
  // Convert UV coordinates to canvas pixels
  // Handle mask restrictions
  // Apply brush stroke with proper blending
  // Update texture and minimap
}
```

#### 3. Sticker System
```javascript
function placeSticker(uv) {
  // Calculate sticker position
  // Apply mask restrictions
  // Draw sticker to canvas
  // Update texture
}
```

#### 4. Performance-Optimized Cursors
```javascript
// Hardware-accelerated cursor tracking
function updateCursorsOptimized() {
  // Use requestAnimationFrame for smooth updates
  // CSS transforms for GPU acceleration
  // Throttled mouse events for performance
}
```

#### 5. Undo/Redo System
```javascript
let undoStack = [];
let redoStack = [];

function saveState() {
  // Capture canvas state as data URL
  // Manage stack size (20 states max)
  // Update UI button states
}
```

#### 6. Color History
```javascript
function addToColorHistory(color) {
  // Add color to history array
  // Limit to 12 recent colors
  // Save to localStorage
  // Update UI display
}
```

#### 7. Mask System
```javascript
function initializeMasks() {
  // Load mask textures
  // Convert RGB to alpha masks
  // Setup mask canvases for painting restrictions
}
```

#### 8. Keyboard Shortcuts
- **B**: Paint mode
- **S**: Sticker mode  
- **R**: Record mode
- **Space**: Rotate mode
- **1,2,3**: Layer selection
- **[,]**: Brush size adjustment
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo

#### 9. Auto-Save System
```javascript
// Save work every 30 seconds
setInterval(saveWorkToStorage, 30000);

function saveWorkToStorage() {
  // Convert canvas to data URL
  // Save to localStorage with timestamp
  // Show notification
}
```

---

### `modules/animationManager.js` - Character Animations
**Purpose**: Handles 3D character animations and blending
**Features**:
- **Animation mixer** for smooth animation playback
- **Multiple animation support** with seamless transitions
- **Animation controls** (play, pause, speed adjustment)
- **Bone-based animations** compatible with painted textures

---

### `modules/recordingManager.js` - Screen Recording
**Purpose**: Captures screen recordings with audio
**Features**:
- **Canvas stream capture** at 60fps
- **Audio integration** with microphone support
- **Multiple format support** (WebM, MP4)
- **Automatic download** of recorded files
- **UI state management** during recording

```javascript
function startRecording(renderer, scene) {
  // Capture canvas stream
  // Add audio stream
  // Setup MediaRecorder
  // Handle download on stop
}
```

---

### `modules/assetLoader.js` - Asset Loading Utilities
**Purpose**: Centralized asset loading with progress tracking
**Features**:
- **Texture loading** with format optimization
- **Progress callbacks** for loading states
- **Error handling** and fallback loading
- **Cache management** for loaded assets

---

## 🔧 How to Modify Features

### Adding New Tools
1. **Add button to toolbar** in `index.html`
2. **Create tool mode** in `uiManager.js`
3. **Add keyboard shortcut** in event handlers
4. **Implement tool logic** (similar to paint/sticker functions)
5. **Update UI states** in `setMode()` function

### Modifying Brush Behavior
**File**: `modules/uiManager.js`
**Function**: `paintAtUV(currentPoint, lastPoint)`
```javascript
// Change brush blending mode
paintCtx.globalCompositeOperation = "multiply"; // or "overlay", "screen", etc.

// Add brush textures
const brushTexture = new Image();
paintCtx.fillStyle = paintCtx.createPattern(brushTexture, 'repeat');

// Modify brush shape
paintCtx.shadowBlur = brushSize; // Add soft edges
```

### Adding New Stickers
1. **Add image files** to `/stickers/` directory
2. **Update sticker array** in `uiManager.js`:
```javascript
const stickerFiles = [
  "stickers/sticker1.png",
  "stickers/your_new_sticker.png", // Add here
];
```

### Customizing UI Colors
**File**: `style.css`
```css
:root {
  --primary-color: #your-color;
  --glass-bg: rgba(your-values);
}
```

### Adding New Masks
1. **Create mask texture** (white = paintable, black = restricted)
2. **Load in modelManager.js**:
```javascript
customMaskMap = textureLoader.load("./path/to/your_mask.webp");
```
3. **Add layer button** in `index.html`
4. **Update mask logic** in `uiManager.js`

### Performance Tuning
**Brush Update Rate**:
```javascript
// Adjust throttle timeout (lower = more responsive, higher = better performance)
mouseThrottleTimeout = setTimeout(() => {}, 16); // 60fps
```

**Canvas Resolution**:
```javascript
// Change in modelManager.js
const canvasSize = 2048; // Higher = better quality, lower = better performance
```

---

## 🏗️ Technical Architecture

### Rendering Pipeline
1. **Three.js Scene** renders 3D model with custom materials
2. **Paint Canvas** (HTML5 Canvas) stores all painting data
3. **Canvas Texture** connects paint canvas to 3D material
4. **Real-time Updates** sync canvas changes to 3D rendering

### Data Flow
```
User Input → Event Handler → Canvas Modification → Texture Update → 3D Render
     ↓
UI Updates ← Performance Optimization ← Cursor Tracking ← Mouse/Touch Events
```

### Memory Management
- **Undo stack**: Limited to 20 states
- **Color history**: Limited to 12 colors
- **Texture caching**: Automatic disposal of unused textures
- **Animation cleanup**: Proper mixer disposal on model changes

### State Management
```javascript
// Global state variables in uiManager.js
let mode = "rotate";           // Current tool mode
let brushColor = "#ff0000";    // Active brush color
let brushSize = 20;            // Brush size in pixels
let activeMask = "none";       // Current layer restriction
let isPainting = false;        // Painting state flag
```

---

## 📦 Asset Management

### 3D Model Assets (`GLBandFBX_010725/`)
- **Char01_FBX.fbx**: Main character model (animations, rigging)
- **Char01_GLB.glb**: Alternative format (smaller size, web-optimized)

### Texture Assets
- **char01_albedo.webp**: Base color/diffuse map (1024x1024)
- **char01_normal.webp**: Normal map for surface details
- **char01_metalness.webp**: Metallic properties map
- **char01_roughness.webp**: Surface roughness map
- **char01_mask_head.webp**: Head painting restriction mask
- **char01_mask_jacket.webp**: Jacket painting restriction mask

### Sticker Assets (`stickers/`)
- **9 PNG files** (sticker1.png through sticker9.png)
- **Recommended size**: 256x256 pixels
- **Format**: PNG with transparency

### Audio Assets (`assets/`)
- **audio.mp3**: Background audio for recording
- **Paint sound**: Embedded base64 WAV in HTML

---

## ⚡ Performance Optimizations

### 1. Hardware Acceleration
```css
.cursor-element {
  transform: translate3d(0, 0, 0);
  will-change: transform;
}
```

### 2. Throttled Updates
```javascript
// Mouse movement throttling
requestAnimationFrame(updateCursorsOptimized);
```

### 3. Efficient Canvas Operations
```javascript
// Batch canvas operations
const originalComposite = paintCtx.globalCompositeOperation;
// ... perform operations
paintCtx.globalCompositeOperation = originalComposite;
```

### 4. Memory Optimization
- **Limited undo history** (20 states max)
- **Efficient texture updates** with `needsUpdate` flag
- **Proper event cleanup** to prevent memory leaks

### 5. Rendering Optimization
- **Shadow mapping**: 2048x2048 resolution
- **Tone mapping**: ACES Filmic for better performance
- **Anti-aliasing**: Enabled for quality without major performance impact

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Module not found" Errors
**Problem**: Import/export mismatches
**Solution**: Check import statements match exported functions
```javascript
// Correct
import { functionName } from './module.js';
export function functionName() {}
```

#### 2. Paint Not Appearing
**Problem**: Canvas texture not updating
**Solution**: Ensure `paintTexture.needsUpdate = true` after canvas changes

#### 3. 3D Model Not Visible
**Problem**: Canvas appended to wrong container
**Solution**: Verify canvas is added to `.viewport-container`

#### 4. Performance Issues
**Problem**: Slow cursor tracking
**Solutions**:
- Increase mouse throttle timeout
- Reduce canvas resolution
- Disable complex animations

#### 5. Mask Not Working
**Problem**: Painting outside mask boundaries
**Solutions**:
- Check mask texture loading
- Verify mask conversion (RGB to alpha)
- Ensure mask canvas matches paint canvas size

### Debug Tools
```javascript
// Enable console logging
console.log("Current mode:", mode);
console.log("Paint canvas size:", paintCanvas.width, paintCanvas.height);
console.log("Active mask:", activeMask);
```

---

## 👨‍💻 Development Guide

### Prerequisites
- **Web server** (for CORS compliance with modules)
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **WebGL support** (required for Three.js)

### Setup
1. **Clone/download** project files
2. **Start development server**:
   ```bash
   node server.js
   # OR
   python -m http.server 8000
   # OR any other web server
   ```
3. **Open browser** to `http://localhost:8000`

### Development Workflow
1. **Make changes** to source files
2. **Refresh browser** to see updates
3. **Check console** for errors
4. **Test all modes** (paint, rotate, sticker, record)
5. **Verify performance** on different devices

### Code Style Guidelines
- **ES6 modules** for organization
- **Consistent naming**: camelCase for variables/functions
- **Error handling**: Try-catch blocks for async operations
- **Comments**: Document complex logic
- **Performance**: Use hardware acceleration where possible

### Testing Checklist
- ✅ All tools work (paint, rotate, sticker, record)
- ✅ Keyboard shortcuts function
- ✅ Undo/redo system works
- ✅ Auto-save and restore works
- ✅ Layer masks restrict painting properly
- ✅ UI is responsive on different screen sizes
- ✅ Performance is smooth (60fps target)
- ✅ No console errors
- ✅ Memory usage is stable

### Deployment
1. **Optimize assets** (compress textures, minify code)
2. **Configure server** (HTTPS for audio/camera permissions)
3. **Test cross-browser** compatibility
4. **Monitor performance** in production

---

## 🎯 Future Enhancement Ideas

### UI/UX Improvements
- **Brush pressure sensitivity** (for stylus input)
- **Zoom controls** for detailed work
- **Custom sticker upload**
- **Export painted model** as image/3D file
- **Collaborative editing** (multiplayer)

### Technical Enhancements
- **WebXR support** (VR/AR painting)
- **Advanced brush types** (texture brushes, scatter brushes)
- **Layer system** (multiple paint layers)
- **Better compression** for saved work
- **Cloud storage** integration

### Animation Features
- **Timeline editor** for animation keyframes
- **Lip sync** capabilities
- **Physics simulation** for clothing/hair
- **Motion capture** integration

---

## 📞 Contact & Support

This documentation covers the complete WorldBuilder project. For specific questions or modifications:

1. **Check this documentation** for file locations and modification guides
2. **Review code comments** in individual files
3. **Test changes incrementally** to isolate issues
4. **Use browser developer tools** for debugging

---

**Last Updated**: January 2025
**Version**: 1.0
**Compatible Three.js Version**: Latest ES6 modules

---

*This documentation is comprehensive and should cover all aspects of modifying, extending, or troubleshooting the WorldBuilder project. Each section provides practical examples and specific file locations for making changes.* 