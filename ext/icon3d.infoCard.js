import { Icon3dTool } from './icon3d.js';

// Configuration
const LINE_COLOR = 0xffffff;       // White line color (change to 0x000000 for black, 0xff0000 for red, etc.)
const LINE_THICKNESS = 0.9;        // Line thickness (radius)
const LABEL_X_OFFSET = -90;        // 2D label X offset in pixels
const LABEL_Y_OFFSET = -200;       // 2D label Y offset in pixels
const LABEL_Z_OFFSET = 75;         // 3D line height (Z-axis)
const OVERLAY_NAME = 'infocard-overlay';

export class InfoCard {
    constructor(icon3dTool, viewer) {
        this.icon3dTool = icon3dTool;
        this.viewer = viewer;
        this.overlayName = OVERLAY_NAME;
        this.labelOffset = new THREE.Vector3(0, 0, LABEL_Z_OFFSET);
        this.labelElement = document.getElementById('label');
        
        this.state = {
            selectedId: null,
            label: null
        };
        
        this.meshes = {};
        
        // Setup camera change listener for repositioning
        this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, () => this.updatePosition());
        
        // Create overlay scene for 3D lines
        this.viewer.overlays.addScene(this.overlayName);
        
        // Create 3D line once and reuse
        const material = new THREE.MeshBasicMaterial({ 
            color: LINE_COLOR, 
            transparent: true,
            opacity: 0.8
        });
        this.meshes.line = new THREE.Mesh(new THREE.CylinderGeometry(LINE_THICKNESS, LINE_THICKNESS, 100, 8), material);
        this.meshes.line.visible = false;
        this.viewer.overlays.addMesh(this.meshes.line, this.overlayName);
    }

    show(itemId) {
        this.state.selectedId = itemId;
        const item = this.icon3dTool.getMarkupItem(itemId);
        
        // Position and show the 3D line
        const startPos = new THREE.Vector3(item.x, item.y, item.z + 3);
        const endPos = startPos.clone().add(this.labelOffset);
        const midpoint = startPos.clone().add(endPos).multiplyScalar(0.5);
        this.meshes.line.position.copy(midpoint);
        this.meshes.line.scale.y = this.labelOffset.length() / 100;
        this.meshes.line.rotation.set(Math.PI / 2, 0, 0);
        this.meshes.line.visible = true;
        
        // Create and position the 2D info card
        this.labelElement.innerHTML = this.createCardHTML(item);
        this.labelElement.style.display = 'block';
        this.updatePosition();
        this.viewer.impl.invalidate(true);
    }

    hide() {
        this.state.selectedId = null;
        
        // Hide 3D line
        if (this.meshes.line) {
            this.meshes.line.visible = false;
        }
        
        // Hide 2D card
        if (this.labelElement) {
            this.labelElement.style.display = 'none';
        }
        
        this.viewer.impl.invalidate(true);
    }

    updatePosition() {
        if (this.state.selectedId === null) return;
        const item = this.icon3dTool.getMarkupItem(this.state.selectedId);
        
        // Calculate 3D position of line endpoint
        const startPos = new THREE.Vector3(item.x, item.y, item.z + 3);
        const endPos = startPos.clone().add(this.labelOffset);
        
        // Project to 2D screen coordinates
        this.state.label = endPos.project(this.viewer.impl.camera);
        
        // Convert normalized device coordinates to screen coordinates
        const x = (this.state.label.x + 1) * 0.5 * innerWidth + LABEL_X_OFFSET;
        const y = (-this.state.label.y + 1) * 0.5 * innerHeight + LABEL_Y_OFFSET;
        
        this.labelElement.style.left = x + 'px';
        this.labelElement.style.top = y + 'px';
    }

    createCardHTML(item) {
        const priorities = {
            'Critical': 'bg-red-500',
            'High': 'bg-orange-500',
            'Medium': 'bg-yellow-500',
            'Low': 'bg-green-500'
        };
        
        const types = ['Issue', 'Warning', 'RFI', 'Quality'];
        
        return `
            <div class="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-full ${priorities[item.priority] || 'bg-gray-500'}"></div>
                        <span class="text-xs font-medium text-gray-600 uppercase tracking-wide">${types[item.icon]}</span>
                    </div>
                    <span class="text-xs text-gray-500">#${item.id}</span>
                </div>
                
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${item.title}</h3>
                <p class="text-sm text-gray-600 mb-3">${item.description}</p>
                
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-medium text-gray-500">Priority:</span>
                        <span class="text-xs px-2 py-1 rounded-full ${priorities[item.priority]} text-white">${item.priority}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-medium text-gray-500">Assignee:</span>
                        <span class="text-xs text-gray-700">${item.assignee}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-medium text-gray-500">Date:</span>
                        <span class="text-xs text-gray-700">${item.date}</span>
                    </div>
                </div>
            </div>
        `;
    }


    cleanup() {
        // Hide any visible cards
        this.hide();
        
        // Remove 3D objects
        Object.values(this.meshes).forEach(mesh => mesh && this.viewer.overlays.removeMesh(mesh, this.overlayName));
        this.meshes = {};
        
        // Remove camera listener
        this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, () => this.updatePosition());
    }
}

// Enhanced extension that combines Icon3dTool with InfoCard
export class Icon3dExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) { super(viewer, options); this.icon3dTool = null; this.infoCard = null; }

    async load() {
        // Create the core 3D tool
        this.icon3dTool = new Icon3dTool(this.viewer, this.options);
        this.viewer.toolController.registerTool(this.icon3dTool);
        
        // Create InfoCard and connect it to the tool
        this.infoCard = new InfoCard(this.icon3dTool, this.viewer);
        this.icon3dTool.setInfoCard(this.infoCard);
        
        // Activate the tool
        this.viewer.toolController.activateTool(this.icon3dTool.getName());
        
        return true;
    }

    unload() {
        if (this.icon3dTool) {
            this.viewer.toolController.deactivateTool(this.icon3dTool.getName());
            this.viewer.toolController.deregisterTool(this.icon3dTool);
            this.icon3dTool = null;
        }
        
        this.infoCard = null;
        return true;
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('icon3d.infoCard', Icon3dExtension);
