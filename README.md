# WorldBuilder 3D Character Customization Tool

![WorldBuilder Screenshot](screenshot.png)

WorldBuilder is a web-based 3D character customization and animation tool built with Three.js. Users can select base colors, paint directly on 3D models, apply stickers, and save their creations with transparent backgrounds.

## Features

- 🎨 **Base Color Selection** - Choose from preset colors or custom color picker
- ✨ **3D Model Painting** - Direct texture painting on 3D models with brush controls
- 🏷️ **Sticker System** - Place and position stickers on the model
- 🌍 **Environment Selection** - Choose between 9 environments (studio, outdoor, sunset, night, forest, beach, dawn, cloudy, indoor)
- 📸 **Save Character** - Export finished character as high-quality PNG image with transparent background
- 💾 **Session Persistence** - Auto-save and restore work
- ⚡ **Performance Optimized** - Hardware-accelerated UI with smooth interactions

## Project Structure

```
Worldbuilder-website-25/
├── index.html                  # Main HTML entry point
├── style.css                   # Complete UI styling
├── main.js                     # Application bootstrap
├── server.js                   # Development server
├── convert_textures.sh         # Texture conversion script
├── modules/                    # Core JavaScript modules
│   ├── sceneSetup.js          # Three.js scene configuration
│   ├── modelManager.js        # 3D model and texture management
│   ├── materialManager.js     # Material creation and shaders
│   ├── uiManager.js           # UI interactions and painting logic
│   ├── animationManager.js    # Character animations
│   └── screenManager.js       # Multi-screen workflow management
├── assets/                     # Audio and animation assets
├── GLBandFBX_010725/          # 3D Model and texture assets
├── stickers/                   # Sticker image assets
└── README.md                   # This file
```

## Getting Started

### Prerequisites
- Node.js (for development server)
- Modern web browser with WebGL support

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/metalfinger/worldbuilder-exporter.git
   cd worldbuilder-exporter
   ```

2. Start the development server:
   ```bash
   node server.js
   ```

3. Open your browser and navigate to `http://localhost:5500`

### Alternative Setup
You can also use Python's built-in HTTP server:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`

## Usage

### Multi-Screen Workflow
1. **Base Color Selection** - Choose a base color for your character and rotate to explore all angles
2. **Paint & Style** - Paint details, add stickers, and customize your character
3. **Environment** - Select an environment and save your creation

### Tools
- **Paint Tool (B)** - Paint directly on the 3D model with adjustable brush size and opacity
- **Rotate Tool (Space)** - Rotate the 3D model to view from different angles
- **Eraser Tool (E)** - Remove paint to reveal the original texture
- **Sticker Tool (S)** - Place pre-designed stickers on the model

### Environments
- **Studio** - Bright, even lighting for detailed work
- **Outdoor** - Natural lighting with blue background
- **Sunset** - Warm, directional lighting
- **Night** - Dark blue ambient with moonlight effect
- **Forest** - Green-tinted ambient with sunlight filtering
- **Beach** - Warm ambient with bright sunlight
- **Dawn** - Soft purple/pink ambient with rising sun
- **Cloudy** - Neutral ambient with diffused sunlight
- **Indoor** - Neutral ambient with overhead lighting

## Documentation

For detailed information about the project, see:
- [Project Overview](WORLD_BUILDER_PROJECT_OVERVIEW.md)
- [Complete Documentation](COMPLETE_PROJECT_DOCUMENTATION.md)
- [Technical Specification](TECHNICAL_SPECIFICATION.md)
- [Project Summary](PROJECT_SUMMARY.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Change Log](CHANGES.md)
- [Test Plan](TEST_PLAN.md)
- [Bug Fixes](BUG_FIX.md)
- [Transparency Fix](TRANSPARENCY_FIX.md)

## Assets

### 3D Models
- Character model in FBX format with animations
- Alternative GLB format for web optimization

### Textures
- Albedo (base color), normal, metalness, and roughness maps
- Head and jacket mask textures for layer restrictions

### Stickers
- 9 pre-designed stickers in PNG format with transparency

## Development

### Code Structure
The application follows a modular architecture:
- `main.js` - Application entry point
- `modules/` - Individual functionality modules
- `index.html` - UI layout and structure
- `style.css` - Modern glassmorphism UI design

### Key Technologies
- Three.js for 3D rendering
- HTML5 Canvas for dynamic texture painting
- ES6 modules for code organization
- Hardware-accelerated CSS for smooth UI

### Customization
To add new stickers:
1. Add PNG files to the `stickers/` directory
2. Update the sticker array in `modules/uiManager.js`

To add new environments:
1. Add environment setup function in `modules/sceneSetup.js`
2. Update `applyEnvironment` function to handle new environment type
3. Add environment option in `index.html`
4. Add CSS preview style in `style.css`

## Performance

The application implements several optimizations:
- Hardware-accelerated CSS transforms
- Throttled mouse event handling
- Efficient canvas operations
- Limited undo history (20 states)
- WebP texture compression

## Browser Support

- Chrome 60+
- Firefox 54+
- Safari 12+
- Edge 79+

Requires WebGL support and ES6 module support.

## License

This project is proprietary and confidential. All rights reserved.

## Contact

For questions or support, please contact the development team.