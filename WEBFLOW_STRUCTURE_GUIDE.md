# Guide: Rebuilding Your Project Structure in Webflow Designer

This document explains how to recreate your current website structure and styling in Webflow Designer, based on your existing project files.

---

## Visual HTML Structure Hierarchy (Preview)

```mermaid
graph TD
  A[body]
  A1[top-ui-container]
  A2[screen-progress]
  A3[tool-status-viewport]
  A4[viewport-container]
  A5[screen-base-color]
  A6[screen-paint]
  A7[screen-pose]
  A8[paint-sound (audio)]

  A --> A1
  A --> A2
  A --> A3
  A --> A4
  A --> A5
  A --> A6
  A --> A7
  A --> A8

  A2 --> B1[progress-step 1]
  A2 --> B2[progress-step 2]
  A2 --> B3[progress-step 3]

  A3 --> C1[tool-status-text]

  A4 --> D1[brush2dIndicator]
  A4 --> D2[eraser2dIndicator]
  A4 --> D3[sticker-preview]

  A5 --> E1[screen-header]
  A5 --> E2[base-color-controls]
  E2 --> E3[color-palette]
  E2 --> E4[custom-color-section]
  A5 --> E5[screen-actions]

  A6 --> F1[screen-header]
  A6 --> F2[toolbar]
  A6 --> F3[floating-shortcuts-panel]
  A6 --> F4[floating-brush-panel]
  A6 --> F5[floating-sticker-panel]
  A6 --> F6[floating-panel-toggle]
  A6 --> F7[undo-redo-panel]
  A6 --> F8[screen-actions]

  A7 --> G1[screen-header]
  A7 --> G2[pose-toolbar]
  A7 --> G3[screen-actions]
```

---

## List of Key Divs to Create in Webflow

| Div/Class Name                | Purpose/Placement                        |
|------------------------------|------------------------------------------|
| top-ui-container             | Top hover trigger area                   |
| screen-progress              | Progress indicator bar                   |
| progress-step                | Each step in progress bar                |
| tool-status-viewport         | Tool status overlay                      |
| tool-status-text             | Status text inside tool-status-viewport  |
| viewport-container           | Main 3D viewport area                    |
| brush2dIndicator             | Brush indicator overlay                  |
| eraser2dIndicator            | Eraser indicator overlay                 |
| sticker-preview              | Sticker preview overlay                  |
| screen-base-color            | Base color selection screen              |
| screen-header                | Header for each screen                   |
| base-color-controls          | Controls for base color                  |
| color-palette                | Color palette options                    |
| custom-color-section         | Custom color picker                      |
| screen-actions               | Navigation/action buttons                |
| screen-paint                 | Paint & Style screen                     |
| toolbar                      | Floating toolbar                         |
| floating-shortcuts-panel     | Keyboard shortcuts panel                 |
| floating-brush-panel         | Brush settings panel                     |
| floating-sticker-panel       | Sticker selection panel                  |
| floating-panel-toggle        | Panel toggle buttons                     |
| undo-redo-panel              | Undo/redo controls                       |
| screen-pose                  | Pose & Export screen                     |
| pose-toolbar                 | Environment selection toolbar            |
| paint-sound (audio)          | Sound effect for painting                |

---

Use this visual hierarchy and div list to recreate your page structure in Webflow Designer. Each box represents a div or key element you should add, and the indentation shows nesting/placement.

## 1. Preparation
- Review your current site: `index.html`, `style.css`, and any assets (images, audio, etc.).
- Identify main sections, navigation, and unique design elements.

## 2. Webflow Project Setup
1. **Create a New Webflow Project**
   - Log in to Webflow and start a new project.
2. **Add a New Page**
   - Name it appropriately (e.g., "Worldbuilder Page").

## 3. Building the Structure
### A. Layout
- Use Webflow's Designer to add elements:
  - **Sections**: For major page areas (header, main, footer).
  - **Containers**: For content alignment.
  - **Div Blocks**: For custom layout control.
  - **Navbar**: For navigation (if present).

### B. Content
- Add **Text Blocks**, **Headings**, **Images**, **Buttons**, etc., matching your HTML structure.
- For audio or video, use Webflow's media elements or embed custom code.

### C. Asset Management
- Upload images, audio, and other assets to Webflow's Asset Manager.
- Replace image/audio links in your design with the new Webflow asset URLs.

## 4. Styling
- Use the **Style Panel** to set:
  - Fonts, colors, backgrounds, borders, spacing, etc.
- Match your CSS by:
  - Creating classes in Webflow for each major style (e.g., `.main-header`, `.button-primary`).
  - Applying styles to elements as needed.
- For advanced CSS, use the "Custom Code" section in page settings.

## 5. Interactions & Animations
- Use Webflow's Interactions panel to add animations (e.g., fade-in, hover effects).
- For complex JS-based interactions, add scripts in the "Custom Code" section.

## 6. Embedding Custom Code (Optional)
- For HTML/JS not supported by Webflow elements, use the "Embed" element.
- Paste your code, but update asset links to Webflow URLs.

## 7. Preview & Publish
- Use Webflow's preview to test your page.
- Publish to Webflow’s subdomain or connect a custom domain.

---

### Tips
- Keep your structure modular: use sections and containers for clarity.
- Use Webflow’s class system to organize styles.
- Test responsiveness using Webflow’s device views.

---

For detailed mapping, compare your `index.html` and `style.css` with Webflow’s elements and style options. If you need a specific mapping for your current design, let me know!
