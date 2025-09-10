# Transparency Fix - Test Plan

## Issue
When saving a creation, the exported PNG had a black background instead of a transparent background.

## Root Cause
1. Setting `sceneRef.background = null` resulted in a black background
2. Renderer was not configured with alpha support
3. Clear color was not set to transparent

## Fix Applied

### 1. Enabled Alpha Support in Renderer (sceneSetup.js)
```javascript
renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: true, // Enable alpha for transparent backgrounds
});
```

### 2. Updated Save Creation Function (screenManager.js)
```javascript
// Store original clear color and alpha
const originalClearColor = rendererRef.getClearColor(new THREE.Color());
const originalClearAlpha = rendererRef.getClearAlpha();

// Set transparent background for export
sceneRef.background = null;
sceneRef.environment = null;
rendererRef.toneMappingExposure = 1.0;

// Set clear color to transparent
rendererRef.setClearColor(0x000000, 0); // Transparent background

// ... capture screenshot ...

// Restore original settings
rendererRef.setClearColor(originalClearColor, originalClearAlpha);
```

## Testing Steps

1. Open the WorldBuilder application
2. Complete a character customization
3. Navigate to screen 3 (Environment)
4. Select any environment
5. Click "Save Creation"
6. Check the downloaded PNG file:
   - Character should be visible
   - Background should be transparent (checkers pattern in image viewers)
   - No black background should be present

## Expected Results
- ✅ PNG exports with transparent background
- ✅ Character is clearly visible
- ✅ No visual artifacts
- ✅ Original environment is restored after export
- ✅ No console errors

## Files Modified
1. `modules/sceneSetup.js` - Added alpha support to renderer
2. `modules/screenManager.js` - Updated save creation function for proper transparency handling