# WorldBuilder 3D Character Customization Tool - Project Overview

## Project Summary

WorldBuilder is a web-based 3D character customization and animation tool built with Three.js. Users can select base colors, paint directly on 3D models, apply stickers, use layer-based masking, and save their creations with different poses and environments. The application features a modern multi-screen UI design with real-time performance optimizations.

## Core Features

- 🎨 **Base Color Selection**: Choose from preset colors or custom color picker
- ✨ **3D Model Painting**: Direct texture painting on 3D models with brush controls
- 🏷️ **Sticker System**: Place and position stickers on the model
- 🌍 **Environment Selection**: Choose between 9 environments (studio, outdoor, sunset, night, forest, beach, dawn, cloudy, indoor)
- 📸 **Save Character**: Export finished character as high-quality PNG image with transparent background
- 💾 **Session Persistence**: Auto-save and restore work
- ⚡ **Performance Optimized**: Hardware-accelerated UI with smooth interactions

## Project Structure

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
│   ├── screenManager.js       # Multi-screen workflow management
│   └── assetLoader.js         # Asset loading utilities
├── assets/                     # Audio and animation assets
│   ├── audio.mp3              # Background audio
│   └── Record_Animation1.fbx  # Animation files
├── GLBandFBX_010725/          # 3D Model and texture assets
│   ├── Char01_FBX.fbx         # Character 3D model
│   ├── Char01_GLB.glb         # Alternative GLB format
│   ├── char01_albedo.tga      # Base color texture (TGA format)
│   ├── char01_albedo.webp     # Base color texture (WEBP format)
│   ├── char01_normal.tga      # Normal map (TGA format)
│   ├── char01_normal.webp     # Normal map (WEBP format)
│   ├── char01_metalness.tga   # Metalness map (TGA format)
│   ├── char01_metalness.webp  # Metalness map (WEBP format)
│   ├── char01_roughness.tga   # Roughness map (TGA format)
│   └── char01_roughness.webp  # Roughness map (WEBP format)
├── stickers/                   # Sticker image assets
│   ├── sticker1.png           # Individual sticker files
│   └── ... (sticker2-9.png)
└── README.md                   # Basic project information
```

## Module Breakdown

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

### `style.css` - Complete UI Styling

**Purpose**: Modern floating UI design with glassmorphism effects

**Key Features**:
- Glassmorphism panels with backdrop blur and transparency
- Hardware-accelerated animations using `transform3d` and `will-change`
- Responsive design that adapts to different screen sizes
- Dark theme with blue accent colors (#0078d4)
- Smooth transitions for all interactive elements
- Performance-optimized cursors for paint and sticker modes

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
import { setupUI, initializeMasks } from "./modules/uiManager.js";
import { setupAnimation, getMixer } from "./modules/animationManager.js";

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

    // Start the animation loop once the model is loaded
    animate(mixer);
});

// Animation loop
function animate(mixer) {
    requestAnimationFrame(() => animate(mixer));

    const delta = clock.getDelta();

    // Update the main mixer for the model
    if (m mixer) {
        mixer.update(delta);
    }

    controls.update();
    renderer.render(scene, camera);
}
```

### `modules/sceneSetup.js` - Three.js Scene Configuration

**Purpose**: Creates and configures the 3D rendering environment

**Responsibilities**:
- Scene creation with proper lighting setup
- Camera configuration (PerspectiveCamera with optimal FOV)
- Renderer setup with shadows, tone mapping, and anti-aliasing
- OrbitControls for 3D navigation
- Environment mapping with HDR background
- Window resize handling for responsive design

### `modules/modelManager.js` - 3D Model and Texture Management

**Purpose**: Handles all 3D model loading, texture management, and paint canvas setup

**Core Components**:
- Dynamic texture painting setup using HTML5 Canvas
- Model loading pipeline for FBX models
- Texture management for PBR materials (albedo, normal, metalness, roughness)
- Mask overlay system for visualizing painting restrictions

### `modules/materialManager.js` - Material Creation and Shaders

**Purpose**: Creates and manages Three.js materials for the character model

**Features**:
- MeshStandardMaterial with PBR (Physically Based Rendering)
- Complete texture mapping (albedo, normal, metalness, roughness)
- Proper skinning support for animated models
- Mask overlay materials with transparency and additive blending

### `modules/uiManager.js` - UI Interactions and Painting Logic

**Purpose**: The largest and most complex module handling all user interactions

**Major Systems**:
1. Mode Management (paint, rotate, sticker, eraser)
2. Painting System with brush controls
3. Sticker System for placing images on the model
4. Performance-optimized cursor tracking
5. Undo/Redo System with 20-level history
6. Color History with localStorage persistence
7. Color History with localStorage persistence
8. Keyboard Shortcuts for all major functions
9. Auto-Save System with periodic localStorage updates

### `modules/animationManager.js` - Character Animations

**Purpose**: Handles 3D character animations and blending

**Features**:
- Animation mixer for smooth animation playback
- Multiple animation support with seamless transitions
- Animation controls (play, pause, speed adjustment)
- Frame-by-frame animation positioning
- Bone-based animations compatible with painted textures

### `modules/screenManager.js` - Multi-Screen Workflow Management

**Purpose**: Manages the multi-screen user interface workflow

**Features**:
- Three-screen workflow (Base Color → Paint & Style → Pose & Finish)
- Base color selection with preset and custom color options
- Environment selection (studio, outdoor, sunset, night, forest, beach)
- Character saving functionality with high-quality PNG export without environment
- Progress indicators and step completion tracking

### `server.js` - Development Server

**Purpose**: Simple HTTP server for local development with proper MIME types

**Features**:
- Serves static files with correct content types
- Handles 404 and 500 errors
- Configured with Cross-Origin policies required for Three.js modules

## Technical Architecture

### Rendering Pipeline
1. Three.js Scene renders 3D model with custom materials
2. Paint Canvas (HTML5 Canvas) stores all painting data
3. Canvas Texture connects paint canvas to 3D material
4. Real-time Updates sync canvas changes to 3D rendering

### Data Flow
```
User Input → Event Handler → Canvas Modification → Texture Update → 3D Render
     ↓
UI Updates ← Performance Optimization ← Cursor Tracking ← Mouse/Touch Events
```

### Multi-Screen Workflow
```
Screen 1: Base Color Selection
    ↓
Screen 2: Paint & Style
    ↓
Screen 3: Pose & Finish → Export Creation
```

## Asset Management

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

### Texture Conversion Script
The project includes a `convert_textures.sh` script that automatically converts TGA texture files to WebP format for better web performance:
- Uses ImageMagick to convert TGA → PNG → WebP
- Maintains quality at 50% for optimal file size
- Automatically cleans up temporary PNG files after conversion

### Sticker Assets (`stickers/`)
- **9 PNG files** (sticker1.png through sticker9.png)
- **Recommended size**: 256x256 pixels
- **Format**: PNG with transparency

### Animation Assets (`assets/`)
- **Record_Animation1.fbx**: Character animation sequences
- **audio.mp3**: Background audio for recording (if used)

## Performance Optimizations

1. **Hardware Acceleration**: CSS transforms with `translate3d` and `will-change`
2. **Throttled Updates**: Mouse movement throttling with requestAnimationFrame
3. **Efficient Canvas Operations**: Batch canvas operations
4. **Memory Optimization**: Limited undo history and proper texture disposal
5. **Rendering Optimization**: Shadow mapping and tone mapping configurations

## Development Workflow

1. **Setup**: Run `python3 -m http.server 8000` or `node server.js` to start development server
2. **Development**: Make changes to source files and refresh browser
3. **Testing**: Verify all modes work correctly (paint, rotate, sticker)
4. **VS Code Integration**: Project includes VS Code tasks for starting development server
5. **Deployment**: Optimize assets and configure server for production

## Multi-Screen Workflow

The application follows a guided three-screen workflow:

### Screen 1: Base Color Selection
- Users select a base color for their character
- Character can be rotated in a bright studio environment
- Both preset colors and custom color picker are available

### Screen 2: Paint & Style
- Full painting functionality with brush controls
- Sticker placement system
- Layer masking for head/jacket restrictions
- Undo/redo functionality
- Color history tracking

### Screen 3: Environment
- Environment selection (studio, outdoor, sunset, night, forest, beach, dawn, cloudy, indoor)
- Character export as high-quality PNG image with transparent background

## Development Environment

The project includes VS Code configuration files for an optimized development experience:

- **settings.json**: Configures Live Server to use port 5501
- **tasks.json**: Defines a task to start the Python development server on port 8000

Developers can use either:
1. Python's built-in HTTP server: `python3 -m http.server 8000`
2. The included Node.js server: `node server.js` (runs on port 5500)
3. VS Code's built-in task to start the development server

## Future Enhancement Ideas

- Brush pressure sensitivity for stylus input
- Zoom controls for detailed work
- Custom sticker upload
- Export painted model as image/3D file
- WebXR support for VR/AR painting
- Advanced brush types and layer system
- Cloud storage integration