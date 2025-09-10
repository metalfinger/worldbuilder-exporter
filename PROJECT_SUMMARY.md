# WorldBuilder Project Summary

## Overview
WorldBuilder is a web-based 3D character customization tool built with Three.js that allows users to:
- Select base colors for 3D characters
- Paint directly on 3D models with brush controls
- Apply stickers to the model
- Use layer-based masking (head/jacket restrictions)
- Pose characters and select environments
- Save creations as high-quality PNG images

## Core Technologies
- **Three.js** - 3D rendering engine
- **HTML5 Canvas** - Dynamic texture painting
- **FBX Models** - 3D character assets
- **WebGL** - Hardware-accelerated rendering
- **ES6 Modules** - Organized code structure

## Project Structure

### Main Application Files
- `index.html` - Entry point with UI layout
- `style.css` - Glassmorphism UI styling
- `main.js` - Application bootstrap
- `server.js` - Development server

### Modules
- `sceneSetup.js` - Three.js scene configuration
- `modelManager.js` - 3D model and texture management
- `materialManager.js` - Material creation and shaders
- `uiManager.js` - UI interactions and painting logic
- `animationManager.js` - Character animations
- `screenManager.js` - Multi-screen workflow management

### Assets
- **3D Models**: `GLBandFBX_010725/Char01_FBX.fbx`
- **Textures**: Albedo, normal, metalness, roughness maps (WebP format)
- **Masks**: Head and jacket restriction masks
- **Stickers**: 9 PNG files in `stickers/` directory

## Key Features

### Multi-Screen Workflow
1. **Base Color Selection** - Choose from presets or custom color
2. **Paint & Style** - Paint with brush controls and apply stickers
3. **Pose & Environment** - Select pose/environment and save creation

### Painting System
- Real-time painting on 3D model surface
- Brush controls (size, opacity, color)
- Layer masking (head/jacket restrictions)
- 20-level undo/redo system
- Auto-save every 30 seconds

### Tools
- **Paint Mode (B)** - Brush painting with full controls
- **Rotate Mode (Space)** - 3D orbit controls for viewing
- **Eraser Mode (E)** - Remove paint to reveal original texture
- **Sticker Mode (S)** - Sticker placement and positioning

### Performance Optimizations
- Hardware-accelerated UI with CSS transforms
- Throttled mouse events for smooth cursor tracking
- Efficient canvas operations
- Memory management with limited undo history

## Development

### Setup
1. Run `node server.js` or `python -m http.server 8000`
2. Open browser to `http://localhost:5500` or `http://localhost:8000`

### Key Components

#### Painting System (`uiManager.js`)
- Converts 3D UV coordinates to 2D canvas pixels
- Handles mask restrictions for painting areas
- Implements undo/redo with state snapshots
- Manages brush properties (size, color, opacity)

#### 3D Rendering (`sceneSetup.js`)
- Configures Three.js scene with lighting
- Sets up camera and renderer with shadows
- Implements environment mapping (studio, outdoor, sunset)
- Handles window resizing

#### Model Management (`modelManager.js`)
- Loads FBX models and WebP textures
- Sets up dynamic painting canvas
- Creates custom PBR materials
- Manages mask overlays for restricted areas

## Customization Points

### Adding New Stickers
1. Add PNG files to `stickers/` directory
2. Update sticker array in `uiManager.js`

### Adding New Masks
1. Create mask texture (white=paintable, black=restricted)
2. Load in `modelManager.js`
3. Add layer button in `index.html`
4. Update mask logic in `uiManager.js`

### UI Customization
- Modify colors in `style.css` variables
- Adjust performance settings in `uiManager.js`
- Change canvas resolution in `modelManager.js`

This project demonstrates a complete 3D character customization workflow with a modern, responsive UI and real-time painting capabilities.