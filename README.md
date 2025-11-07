# 3D Icons Extension for APS Viewer

Enhance the APS Viewer SDK scene with GPU-accelerated “pushpin” icons that occlude behind models and support millions of instances at 60 FPS, with optional interactive card popups.

## Demo

**[Try Live Demo →](https://wallabyway.github.io/markupExt/)**

![Image](https://github.com/user-attachments/assets/5051e835-65bb-4e58-8e63-1e20b8964da4)

## Features

- **High Performance**: Render 1,000,000+ icons at 60 FPS
- **Multi-Icon Support**: 4 (or more) different icon types via a single 'sprite sheet'
- **GPU Accelerated**: It uses PointCloud shader under the hood
- **Two Usage Modes**: "Icons only", or "Icons with info card"

## Installation

### Option 1: Icons Only

Use this for simple markup visualization without interactive info cards.  
> **NOTE:** You can remove the `icon3d.infoCard.js` file

```javascript
import { Icon3dToolExtension } from './ext/icon3d.js';

// Register extension
Autodesk.Viewing.theExtensionManager.registerExtension('icon3d', Icon3dToolExtension);

// Load in viewer config
const config = {
    extensions: ['icon3d'],
    extensionOptions: {
        'icon3d': { dataSource: 'ext/icon3d.data.json' }
    }
};

const viewer = new Autodesk.Viewing.GuiViewer3D(div, config);
```


### Option 2: Icons with Info Cards

Use this for interactive icons with clickable info cards and 3D line connectors.

```javascript
import { Icon3dExtension } from './ext/icon3d.infoCard.js';

// Register extension
Autodesk.Viewing.theExtensionManager.registerExtension('icon3d.infoCard', Icon3dExtension);

// Load in viewer config
const config = {
    extensions: ['icon3d.infoCard'],
    extensionOptions: {
        'icon3d.infoCard': { dataSource: 'ext/icon3d.data.json' }
    }
};

const viewer = new Autodesk.Viewing.GuiViewer3D(div, config);
```

## Data Format

Create a JSON file with your markup data:

```json
[
    {
        "id": 1,
        "x": 10.5,
        "y": 20.3,
        "z": 5.8,
        "icon": 0,
        "title": "Issue #1",
        "description": "Foundation crack detected",
        "priority": "Critical",
        "assignee": "John Doe",
        "date": "2024-01-15"
    }
]
```

**Icon Types:**
- `0` = Issue
- `1` = Warning  
- `2` = RFI
- `3` = Hazard

## Customization

### Change Icon Sprite Sheet

Replace `ext/icons.png` with your own 4-icon sprite sheet (each icon 256x256px).

### Adjust Icon Size

Edit `ext/icon3d.js`:

```javascript
this.config = {
    size: 150.0,      // Icon size
    threshold: 5      // Click hit radius
};
```

### Customize Info Card

Edit `ext/icon3d.infoCard.js`:

```javascript
const LABEL_Z_OFFSET = 75;         // 3D line height (Z-axis)
const LABEL_X_OFFSET = -90;        // 2D label X offset in pixels
const LABEL_Y_OFFSET = -200;       // 2D label Y offset in pixels
const LINE_COLOR = 0xffffff;       // White line color
```

The info card UI uses Tailwind CSS and can be customized in the `createCardHTML()` method.

## Technical Details

### GPU Shader Optimization

**Multi-Icon Rendering** (Fragment Shader):
```glsl
gl_FragColor = gl_FragColor * texture2D(tex, 
    vec2((gl_PointCoord.x + vColor.y * 1.0) / 4.0, 1.0 - gl_PointCoord.y)
);
```

**Distance-Based Scaling** (Vertex Shader):
```glsl
gl_PointSize = size * (size / (length(mvPosition.xyz) + 1.0));
```


## License

MIT License
Copyright (c) 2025

## References
- [APS Viewer Documentation](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)
- [Original Blog Post by Philippe Leefsma](https://forge.autodesk.com/blog/high-performance-3d-markups-pointcloud-forge-viewer)
- [THREE.js PointCloud Raycasting](https://stackoverflow.com/questions/28209645/raycasting-involving-individual-points-in-a-three-js-pointcloud)
