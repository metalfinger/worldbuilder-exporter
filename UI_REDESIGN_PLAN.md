# UI Redesign Plan - Photoshop-like Interface

## Current Layout
- Toolbar: Top-left corner
- Brush/Sticker panels: Bottom-left corner
- Layers panel: Right side (removed)
- Minimap panel: Top-right corner (removed)

## New Layout
- Toolbar: Center-left, full height vertical column
- Tool panels (Brush/Sticker): Center-right, vertically centered
- Remove unnecessary panels
- Simplify the interface for better workflow

## Changes to Make

### 1. HTML Structure
- Keep the toolbar but reposition it
- Keep the brush/sticker panels but reposition them
- Remove references to layers panel and minimap panel

### 2. CSS Updates
- Update .floating-toolbar positioning to center-left, full height
- Update .floating-brush-panel and .floating-sticker-panel positioning to center-right
- Add new styles for the Photoshop-like layout

### 3. JavaScript Updates
- Ensure UI manager works with new layout
- Update any positioning calculations if needed

## Implementation Steps

1. Update CSS for toolbar positioning
2. Update CSS for panel positioning
3. Test the new layout
4. Make adjustments as needed