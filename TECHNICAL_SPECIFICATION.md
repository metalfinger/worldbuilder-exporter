# WorldBuilder Technical Specification

## System Architecture

### Overview
WorldBuilder is a client-side web application built with Three.js that enables real-time 3D character customization. The application follows a modular architecture with clear separation of concerns between rendering, business logic, and UI components.

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (HTML/CSS)                │
├─────────────────────────────────────────────────────────────┤
│                     Application Core (main.js)              │
├─────────────────────────────────────────────────────────────┤
│  Rendering  │  Model Mgmt  │  Materials  │  Animation  │  UI │
│ (sceneSetup)│ (modelManager)│(materialMgr)│(animManager)│(uiMgr)│
├─────────────────────────────────────────────────────────────┤
│                 Three.js 3D Rendering Engine                │
├─────────────────────────────────────────────────────────────┤
│                    WebGL / GPU Hardware                     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Scene Management (`sceneSetup.js`)

#### Responsibilities
- Initialize Three.js scene, camera, and renderer
- Configure lighting (hemisphere, directional, fill lights)
- Setup environment maps and backgrounds
- Implement orbit controls for 3D navigation
- Handle window resize events

#### Key Features
- **Physically Based Rendering**: ACES Filmic tone mapping
- **Shadow Mapping**: PCF Soft shadows with 2048x2048 resolution
- **Environment Mapping**: HDR environment textures with intensity controls
- **Responsive Design**: Automatic resize handling

#### Lighting Configurations
- **Studio**: Balanced lighting with rim lights for definition
- **Outdoor**: Natural lighting with sky bounce
- **Sunset**: Warm, directional lighting with ambient glow

### 2. Model Management (`modelManager.js`)

#### Responsibilities
- Load 3D models (FBX format) and textures (WebP format)
- Setup dynamic painting canvas system
- Manage material assignments to 3D meshes
- Handle mask overlay creation and removal

#### Dynamic Painting System
```javascript
// Canvas setup for real-time painting
const canvasSize = 1024;
const paintCanvas = document.createElement("canvas");
const paintCtx = paintCanvas.getContext("2d");
const paintTexture = new THREE.CanvasTexture(paintCanvas);

// Texture mapping
paintTexture.colorSpace = THREE.SRGBColorSpace;
paintTexture.needsUpdate = true; // Critical for real-time updates
```

#### Texture Pipeline
1. Load base textures (albedo, normal, metalness, roughness)
2. Load mask textures (head, jacket)
3. Initialize paint canvas with base albedo
4. Create CanvasTexture for Three.js material

### 3. Material System (`materialManager.js`)

#### Custom Materials
```javascript
new THREE.MeshStandardMaterial({
    map: paintTexture,           // Dynamic paint canvas
    normalMap: normalMap,        // Surface detail
    metalnessMap: metalnessMap,  // Metallic properties
    roughnessMap: roughnessMap,  // Surface roughness
    metalness: 0.8,              // Tuned for realism
    roughness: 0.9,              // Tuned for lighting response
    skinning: true,              // Support for animated models
    envMapIntensity: 0.3         // Subtle environment reflections
});
```

#### Mask Overlay Materials
- Additive blending for glow effect
- Transparency controls for visibility
- Color coding (green for head, blue for jacket)

### 4. UI Management (`uiManager.js`)

#### Mode System
The application operates in four distinct modes:
- **Rotate**: OrbitControls enabled, default navigation
- **Paint**: Brush painting with cursor visualization
- **Eraser**: Remove paint to reveal original texture
- **Sticker**: Place pre-defined stickers on model

#### Performance Optimizations
```javascript
// Hardware-accelerated cursor tracking
function updateCursorsOptimized() {
    brushIndicatorElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

// Throttled mouse events
const animationFrameId = requestAnimationFrame(updateCursorsOptimized);

// Efficient canvas operations
paintCtx.globalCompositeOperation = "source-over"; // Batch operations
```

#### State Management
```javascript
let brushColor = "#ff0000";
let brushSize = 20;
let brushOpacity = 1.0;
let eraserSize = 30;
let activeMask = "none"; // 'none', 'head', 'jacket'
let mode = "rotate"; // 'paint', 'rotate', 'sticker', 'eraser'
```

### 5. Animation System (`animationManager.js`)

#### Features
- Animation mixer for smooth playback
- Frame-based positioning for poses
- Multiple animation clip support
- Playback controls (play, pause, resume)

#### Frame Positioning
```javascript
// Set animation to specific frame
const fps = 30;
const timePerFrame = 1 / fps;
const targetTime = (frameNumber - 1) * timePerFrame;
currentAction.time = Math.min(targetTime, clip.duration);
currentAction.paused = true;
```

### 6. Screen Management (`screenManager.js`)

#### Workflow
1. **Base Color Selection**: Environment setup and color choosing
2. **Paint & Style**: Full painting and customization tools
3. **Pose & Finish**: Character posing, environment selection, and export

#### Environment System
- **Studio**: Bright, even lighting for detailed work
- **Outdoor**: Natural lighting with blue background
- **Sunset**: Warm, directional lighting

## Data Flow

### Painting Process
```
1. User Input (Mouse/Touch)
        ↓
2. Event Handler (uiManager.js)
        ↓
3. UV Coordinate Calculation
        ↓
4. Canvas Pixel Mapping
        ↓
5. Brush Application with Masking
        ↓
6. Canvas Texture Update
        ↓
7. Three.js Render Update
```

### State Persistence
```javascript
// Auto-save system
setInterval(saveWorkToStorage, 30000);

function saveWorkToStorage() {
    const imageData = paintCanvas.toDataURL();
    localStorage.setItem("worldbuilder-current-work", imageData);
}
```

## Performance Considerations

### Rendering Optimizations
- **Hardware Acceleration**: CSS transforms with `translate3d`
- **Canvas Resolution**: 1024x1024 balance of quality and performance
- **Texture Compression**: WebP format for smaller file sizes
- **Shadow Optimization**: Limited shadow map resolution

### Memory Management
- **Undo Stack**: Limited to 20 states to prevent memory bloat
- **Texture Disposal**: Proper cleanup of unused textures
- **Event Cleanup**: Removal of event listeners to prevent leaks

### UI Performance
- **Throttled Updates**: 60fps cursor tracking
- **Batched Operations**: Grouped DOM updates
- **CSS Optimizations**: `will-change` and `backdrop-filter` usage

## Asset Pipeline

### Texture Conversion
The project includes a shell script (`convert_textures.sh`) for converting TGA textures to WebP:
1. TGA → PNG conversion using ImageMagick
2. PNG → WebP conversion with quality setting
3. Temporary file cleanup

### Model Format Support
- **FBX**: Primary format with animations
- **GLB**: Alternative optimized format

### Texture Types
- **Albedo/Diffuse**: Base color information
- **Normal**: Surface detail and lighting effects
- **Metalness**: Metallic properties of surfaces
- **Roughness**: Surface smoothness properties
- **Masks**: Painting restriction areas

## Integration Points

### Three.js Modules
The application uses CDN-hosted Three.js modules:
```html
<script type="importmap">
{
    "imports": {
        "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/"
    }
}
</script>
```

### Browser APIs
- **WebGL**: 3D rendering through Three.js
- **Canvas API**: Dynamic texture painting
- **localStorage**: State persistence
- **File API**: Image export functionality

## Error Handling

### Graceful Degradation
- Fallback to default materials when textures fail to load
- Alternative lighting when environment maps fail
- Default colors when custom selections fail

### User Feedback
- Notification system for success/error states
- Visual indicators for tool states
- Status messages for mode changes

## Security Considerations

### Client-Side Only
- No server-side processing of user data
- All painting occurs in browser memory
- Exported images are downloaded directly

### Content Security
- No external content injection points
- Static asset loading only
- No user input processing beyond color values

## Browser Compatibility

### Supported Browsers
- Chrome 60+
- Firefox 54+
- Safari 12+
- Edge 79+

### Required Features
- WebGL 2.0 support
- ES6 module support
- Canvas API support
- localStorage API

## Development Workflow

### Local Development
1. Start development server (`node server.js`)
2. Access via `http://localhost:5500`
3. Edit files and refresh browser
4. Check console for errors

### Testing Process
1. Verify all tool modes function correctly
2. Test keyboard shortcuts
3. Check undo/redo functionality
4. Validate mask restrictions
5. Test responsive design
6. Verify performance on target devices

### Deployment Considerations
- Optimize texture sizes for web delivery
- Minify CSS and JavaScript
- Configure server for proper MIME types
- Enable HTTPS for production deployment