# 🌎 WorldBuilder 3D Character Customization Tool - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Core Features](#core-features)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Module Deep Dive](#module-deep-dive)
6. [How to Modify Features](#how-to-modify-features)
7. [Technical Architecture](#technical-architecture)
8. [Asset Management](#asset-management)
9. [Performance Optimizations](#performance-optimizations)
10. [Troubleshooting](#troubleshooting)
11. [Development Guide](#development-guide)

---

## 🎯 Project Overview

**WorldBuilder** is a web-based 3D character customization and animation tool built with Three.js. Users can select base colors, paint directly on 3D models, apply stickers, use layer-based masking, and save their creations with different poses and environments. The application features a modern multi-screen UI design with real-time performance optimizations.

### Key Capabilities
- 🎨 **Base Color Selection**: Choose from preset colors or custom color picker
- ✨ **3D Model Painting**: Direct texture painting on 3D models with brush controls
- 🏷️ **Sticker System**: Place and position stickers on the model
- 🌍 **Environment Selection**: Choose between studio, outdoor, sunset, night, forest, or beach environments
- 📸 **Save Character**: Export finished character as high-quality PNG image without environment
- 💾 **Session Persistence**: Auto-save and restore work
- ⚡ **Performance Optimized**: Hardware-accelerated UI with smooth interactions

---

## 📁 Project Structure

```
Worldbuilder-website-25/
├── .DS_Store
├── convert_textures.sh          # Texture conversion script
├── index.html                   # Main HTML entry point
├── main.js                      # Application bootstrap
├── server.js                    # Development server
├── style.css                    # Complete UI styling
├── WORLD_BUILDER_PROJECT_OVERVIEW.md  # Project overview documentation
├── PROJECT_DOCUMENTATION.md     # Detailed project documentation
├── README.md                    # Basic project information
├── .git/                        # Git repository
├── .vscode/                     # VS Code configuration
│   ├── settings.json
│   └── tasks.json
├── assets/                      # Audio and animation assets
│   ├── audio.mp3               # Background audio
│   └── Record_Animation1.fbx   # Animation files
├── GLBandFBX/                   # 3D Model and texture assets (older version)
│   ├── accessories_albedo.tga
│   ├── accessories_normal.tga
│   ├── body_albedo.tga
│   ├── body_normal.tga
│   ├── Char01_FBX.fbx          # Character 3D model
│   ├── Char01_GLB.glb          # Alternative GLB format
│   ├── texture_08.png
│   └── Walking.fbx
├── GLBandFBX_010725/            # 3D Model and texture assets (current version)
│   ├── char01_albedo.tga       # Base color texture (TGA format)
│   ├── char01_albedo.webp      # Base color texture (WEBP format)
│   ├── Char01_FBX.fbx          # Character 3D model
│   ├── Char01_GLB.glb          # Alternative GLB format
│   ├── char01_mask_head.webp   # Head mask for restricted painting
│   ├── char01_mask_jacket.webp # Jacket mask for restricted painting
│   ├── char01_metalness.tga    # Metalness map (TGA format)
│   ├── char01_metalness.webp   # Metalness map (WEBP format)
│   ├── char01_normal.tga       # Normal map (TGA format)
│   ├── char01_normal.webp      # Normal map (WEBP format)
│   ├── char01_roughness.tga    # Roughness map (TGA format)
│   └── char01_roughness.webp   # Roughness map (WEBP format)
├── modules/                     # Core JavaScript modules
│   ├── animationManager.js     # Character animations
│   ├── materialManager.js      # Material creation and shaders
│   ├── modelManager.js         # 3D model and texture management
│   ├── sceneSetup.js           # Three.js scene configuration
│   ├── screenManager.js        # Multi-screen workflow management
│   └── uiManager.js            # UI interactions and painting logic
├── stickers/                    # Sticker image assets
│   ├── sticker1.png            # Individual sticker files
│   └── ... (sticker2-9.png)
└── Worldbuilder-website-25.code-workspace  # VS Code workspace file
```

---

## 🚀 Core Features

### 1. Multi-Screen Workflow
- **Screen 1: Base Color Selection** - Choose a base color for your character
- **Screen 2: Paint & Style** - Paint details, add stickers, and customize your character
- **Screen 3: Pose & Environment** - Select a pose, environment, and save your creation

### 2. 3D Model Painting System
- **Real-time painting** directly on 3D model surface
- **Brush controls**: Size (1-100px), opacity (0-1), color picker
- **Layer masking**: Restrict painting to head or jacket areas
- **Undo/Redo**: 20-level history system
- **Auto-save**: Session persistence every 30 seconds

### 3. Sticker Application
- **9 pre-loaded stickers** with visual preview
- **Real-time positioning** with mouse/touch tracking
- **Size control** and **mask-aware placement**
- **Visual feedback** with preview overlay

### 4. Interactive Tools
- **Paint Mode (B)**: Brush painting with full controls
- **Rotate Mode (Space)**: 3D orbit controls for viewing
- **Eraser Mode (E)**: Remove paint to reveal original texture
- **Sticker Mode (S)**: Sticker placement and positioning

### 5. Advanced UI Features
- **Glassmorphism panels** with backdrop blur and transparency
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
- Multi-screen interface with progress indicators
- Floating toolbar with tool buttons (rotate, paint, sticker)
- Brush control panels (color, size, opacity, history)
- Sticker gallery with preview thumbnails
- Mini-map display canvas
- Viewport container for Three.js canvas
- Tool status displays and notification areas

**UI Components**:
```html
<!-- Screen Progress Indicator -->
<div class="screen-progress">
  <div class="progress-step active" data-step="1">
    <span class="step-number">1</span>
    <span class="step-label">Base Color</span>
  </div>
  <div class="progress-step" data-step="2">
    <span class="step-number">2</span>
    <span class="step-label">Paint & Style</span>
  </div>
  <div class="progress-step" data-step="3">
    <span class="step-number">3</span>
    <span class="step-label">Pose & Finish</span>
  </div>
</div>

<!-- Tool Status in Viewport -->
<div id="tool-status-viewport" class="tool-status-viewport">
  <span id="tool-status-text">Rotate Mode</span>
</div>

<!-- 3D Viewport (Full Screen) -->
<div class="viewport-container">
  <div id="brush2dIndicator">
    <div class="brush-inner-ring"></div>
    <div class="brush-opacity-indicator"></div>
  </div>
  <div id="eraser2dIndicator">
    <div class="eraser-inner-cross"></div>
    <div class="eraser-size-indicator"></div>
  </div>
  <div id="sticker-preview"></div>
  <!-- Canvas will be inserted here by Three.js -->
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
  --glass-bg: rgba(15, 15, 15, 0.85);
  --glass-border: rgba(255, 255, 255, 0.18);
}

/* Hardware Acceleration */
.floating-panel {
  transform: translate3d(0, 0, 0);
  will-change: transform;
  backdrop-filter: blur(16px);
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
import * as THREE from "three";
import { setupScene } from "./modules/sceneSetup.js";
import { loadModel, getCharacterTextures } from "./modules/modelManager.js";
import { setupAnimation, getMixer } from "./modules/animationManager.js";
import { setupUI, initializeMasks } from "./modules/uiManager.js";
import { initializeScreenManager } from "./modules/screenManager.js";

const clock = new THREE.Clock();

// 1. Scene Setup
const { scene, camera, renderer, controls } = setupScene();

// 2. UI Setup
const { setMode } = setupUI(camera, renderer, controls);

// 3. Model Loading
loadModel(scene, (model) => {
    // 4. Animation Setup
    const mixer = setupAnimation(model);

    // 5. Initialize masks after model and textures are loaded
    initializeMasks();

    // 6. Initialize Screen Manager
    initializeScreenManager(scene, camera, renderer, controls, setMode);

    // Start the animation loop once the model is loaded
    animate(mixer);
});

// Animation loop
function animate(mixer) {
    requestAnimationFrame(() => animate(mixer));

    const delta = clock.getDelta();

    // Update the main mixer for the model
    if (mixer) {
        mixer.update(delta);
    }

    controls.update();
    renderer.render(scene, camera);
}
```

---

### `server.js` - Development Server
**Purpose**: Simple HTTP server for local development with proper MIME types
**Features**:
- Serves static files with correct content types
- Handles 404 and 500 errors
- Configured with Cross-Origin policies required for Three.js modules

```javascript
const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 5500;
const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".tga": "image/x-tga",
    ".fbx": "application/octet-stream",
    ".mp3": "audio/mpeg",
};

http
    .createServer((req, res) => {
        const filePath = path.join(
            __dirname,
            req.url === "/" ? "index.html" : req.url
        );
        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = mimeTypes[extname] || "application/octet-stream";

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code == "ENOENT") {
                    res.writeHead(404);
                    res.end("File not found");
                } else {
                    res.writeHead(500);
                    res.end("Internal server error");
                }
            } else {
                res.writeHead(200, {
                    "Content-Type": contentType,
                    "Cross-Origin-Opener-Policy": "same-origin",
                    "Cross-Origin-Embedder-Policy": "require-corp",
                });
                res.end(content);
            }
        });
    })
    .listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
```

---

### `convert_textures.sh` - Texture Conversion Script
**Purpose**: Converts TGA texture files to WebP format for better web performance
**Features**:
- Uses ImageMagick to convert TGA → PNG → WebP
- Maintains quality at 50% for optimal file size
- Automatically cleans up temporary PNG files after conversion

```bash
#!/bin/bash
# This script converts all .tga files in a specified directory to .webp format
# by first converting them to temporary PNG files.

# The directory containing the original .tga textures.
SOURCE_DIR="GLBandFBX_010725"

# The quality setting for the WebP conversion (1-100). 75 is a good balance.
QUALITY=50

# Ensure the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source directory '$SOURCE_DIR' not found."
  exit 1
fi

# Find all .tga files and convert them
for tga_file in "$SOURCE_DIR"/*.tga; do
  if [ -f "$tga_file" ]; then
    # Get the filename without the extension
    base_name=$(basename "$tga_file" .tga)
    # Define the temporary .png file path
    png_file="$SOURCE_DIR/$base_name.png"
    # Define the final .webp file path
    webp_file="$SOURCE_DIR/$base_name.webp"
    
    echo "Converting '$tga_file' to temporary PNG..."
    # Use ImageMagick to convert TGA to PNG
    magick convert "$tga_file" "$png_file"
    
    if [ -f "$png_file" ]; then
      echo "Converting temporary PNG to '$webp_file'..."
      # Run the cwebp converter on the PNG
      cwebp -q $QUALITY "$png_file" -o "$webp_file"
      
      # Remove the temporary PNG file
      rm "$png_file"
    else
      echo "Error: Failed to create temporary PNG for '$tga_file'."
    fi
  fi
done

echo "Texture conversion complete."
```

---

## 🧩 Module Deep Dive

### `modules/sceneSetup.js` - Three.js Scene Configuration
**Purpose**: Creates and configures the 3D rendering environment
**Responsibilities**:
- **Scene creation** with proper lighting setup
- **Camera configuration** (PerspectiveCamera with optimal FOV)
- **Renderer setup** with shadows, tone mapping, and anti-aliasing
- **OrbitControls** for 3D navigation
- **Environment mapping** with HDR background
- **Window resize handling** for responsive design

**Key Configuration**:
```javascript
// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 2);

// Renderer Configuration
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Lighting Setup
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xf0f0f0, 1.0);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.castShadow = true;
```

**Environment Management**:
```javascript
export function applyEnvironment(environmentType, forceApply = false) {
    switch (environmentType) {
        case "studio":
            scene.background = new THREE.Color(0xf8f8f8);
            loadStudioHDRI(function (texture) {
                if (texture) {
                    scene.environment = texture;
                } else {
                    scene.environment = null;
                }
            });
            setupStudioLighting();
            renderer.toneMappingExposure = 0.9;
            break;
            
        case "outdoor":
            scene.background = new THREE.Color(0x87ceeb);
            scene.environment = null;
            setupOutdoorLighting();
            renderer.toneMappingExposure = 0.7;
            break;
            
        case "sunset":
            scene.background = new THREE.Color(0xff8a50);
            scene.environment = null;
            setupSunsetLighting();
            renderer.toneMappingExposure = 0.9;
            break;
    }
}
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
paintTexture.colorSpace = THREE.SRGBColorSpace;
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
  const loadingManager = new THREE.LoadingManager();
  const characterTextureLoader = new THREE.TextureLoader(loadingManager);
  const fbxLoader = new FBXLoader(loadingManager);

  albedoMap = characterTextureLoader.load("./GLBandFBX_010725/char01_albedo.webp");
  albedoMap.colorSpace = THREE.SRGBColorSpace;

  normalMap = characterTextureLoader.load("./GLBandFBX_010725/char01_normal.webp");
  metalnessMap = characterTextureLoader.load("./GLBandFBX_010725/char01_metalness.webp");
  roughnessMap = characterTextureLoader.load("./GLBandFBX_010725/char01_roughness.webp");
  headMaskMap = characterTextureLoader.load("./GLBandFBX_010725/char01_mask_head.webp");
  jacketMaskMap = characterTextureLoader.load("./GLBandFBX_010725/char01_mask_jacket.webp");

  fbxLoader.load("./GLBandFBX_010725/Char01_FBX.fbx", (object) => {
      model = object;
  });

  loadingManager.onLoad = () => {
      // This fires only when all assets managed by the manager are loaded
      // 1. Setup the paint canvas with the base texture
      paintCtx.drawImage(albedoMap.image, 0, 0, canvasSize, canvasSize);
      paintTexture.needsUpdate = true;

      // 2. Configure and add the model to the scene
      model.scale.setScalar(0.01);
      model.position.set(0, 0, 0);

      model.traverse((node) => {
          if (!node.isMesh) return;
          node.castShadow = true;
          node.receiveShadow = true;
          node.material = createCustomMaterial(getCharacterTextures(), node.material);
      });

      scene.add(model);

      // 3. Fire the final callback to setup animations, UI, etc.
      if (onModelLoaded) {
          onModelLoaded(model);
      }
  };
}

export function getPaintCanvas() {
  return { paintCanvas, paintCtx, paintTexture };
}

export function getCharacterTextures() {
  const { paintTexture } = getPaintCanvas();
  return {
      paintTexture,
      normalMap,
      metalnessMap,
      roughnessMap,
      headMaskMap,
      jacketMaskMap,
      albedoMap,
  };
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
        map: paintTexture,
        normalMap: normalMap,
        metalnessMap: metalnessMap,
        roughnessMap: roughnessMap,
        metalness: 0.8, // Reduced from 1.0 for more realistic appearance
        roughness: 0.9, // Reduced from 1.0 for better light interaction
        skinning: originalMaterial && originalMaterial.skinning,
        envMapIntensity: 0.3, // Subtle environment reflection
    });
}

export function createMaskOverlayMaterial(maskTexture, color = 0x00ff00) {
    return new THREE.MeshBasicMaterial({
        map: maskTexture,
        color: color,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
    });
}
```

---

### `modules/uiManager.js` - UI Interactions and Painting Logic
**Purpose**: The largest and most complex module handling all user interactions
**Major Systems**:

#### 1. Mode Management
```javascript
let mode = "rotate"; // 'paint', 'rotate', 'sticker', 'eraser'

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
- **E**: Eraser mode
- **S**: Sticker mode
- **Space**: Rotate mode
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
- **Frame-based animation positioning**
- **Bone-based animations** compatible with painted textures

```javascript
export function setupAnimation(model) {
    if (model.animations && model.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        // Play the first animation by default (e.g., idle)
        currentAction = mixer.clipAction(model.animations[0]);
        currentAction.play();
    }
    return mixer;
}

export function setAnimationFrame(frameNumber) {
    if (!mixer || !currentAction) {
        console.log("Animation system not ready for frame setting");
        return;
    }

    // Get the animation clip
    const clip = currentAction.getClip();
    if (!clip) return;

    // Calculate the time for the specific frame
    // Assuming 30 FPS for the animation
    const fps = 30;
    const timePerFrame = 1 / fps;
    const targetTime = (frameNumber - 1) * timePerFrame;

    // Clamp the target time to the clip duration
    const clampedTime = Math.min(targetTime, clip.duration);

    // Set the animation to the specific time
    currentAction.time = clampedTime;
    currentAction.paused = true; // Pause the animation at this frame

    // Update the mixer to apply the change
    mixer.update(0);

    console.log(`Set animation to frame ${frameNumber} (time: ${clampedTime}s)`);
}
```

---

### `modules/screenManager.js` - Multi-Screen Workflow Management
**Purpose**: Manages the multi-screen user interface workflow
**Features**:
- **Three-screen workflow** (Base Color → Paint & Style → Pose & Finish)
- **Base color selection** with preset and custom color options
- **Environment selection** (studio, outdoor, sunset, night, forest, beach)
- **Character saving functionality** with high-quality PNG export without environment
- **Progress indicators** and step completion tracking

```javascript
export function initializeScreenManager(
    scene,
    camera,
    renderer,
    controls,
    setMode
) {
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
}
```

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

### 3D Model Assets (`GLBandFBX/`)
- **Char01_FBX.fbx**: Main character model (animations, rigging)
- **Char01_GLB.glb**: Alternative format (smaller size, web-optimized)
- **Walking.fbx**: Additional character animation
- **accessories_albedo.tga**: Texture for character accessories
- **accessories_normal.tga**: Normal map for character accessories
- **body_albedo.tga**: Alternative body texture
- **body_normal.tga**: Alternative body normal map
- **texture_08.png**: Additional texture asset

### Texture Assets
- **char01_albedo.tga/webp**: Base color/diffuse map (1024x1024)
- **char01_normal.tga/webp**: Normal map for surface details
- **char01_metalness.tga/webp**: Metallic properties map
- **char01_roughness.tga/webp**: Surface roughness map
- **char01_mask_head.webp**: Head painting restriction mask
- **char01_mask_jacket.webp**: Jacket painting restriction mask

### Sticker Assets (`stickers/`)
- **9 PNG files** (sticker1.png through sticker9.png)
- **Recommended size**: 256x256 pixels
- **Format**: PNG with transparency

### Animation Assets (`assets/`)
- **Record_Animation1.fbx**: Character animation sequences
- **audio.mp3**: Background audio for recording (if used)

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
4. **Test all modes** (paint, rotate, sticker, eraser)
5. **Verify performance** on different devices

### Code Style Guidelines
- **ES6 modules** for organization
- **Consistent naming**: camelCase for variables/functions
- **Error handling**: Try-catch blocks for async operations
- **Comments**: Document complex logic
- **Performance**: Use hardware acceleration where possible

### Testing Checklist
- ✅ All tools work (paint, rotate, sticker, eraser)
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

**Last Updated**: September 2025
**Version**: 1.0
**Compatible Three.js Version**: 0.160.1

---

*This documentation is comprehensive and should cover all aspects of modifying, extending, or troubleshooting the WorldBuilder project. Each section provides practical examples and specific file locations for making changes.*