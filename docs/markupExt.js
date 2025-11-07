// Info Card Generator
class InfoCard {
    static create(item) {
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
}

class Markup3DTool extends Autodesk.Viewing.ToolInterface {
    constructor(viewer, options = {}) {
        super();
        this.viewer = viewer;
        this.options = options;
        this.names = ['markup3d-tool'];
        this.active = false;
        this.overlayName = 'markup3d-overlay';
        
        this.config = {
            size: 150.0,
            threshold: 5,
            lineColor: 0xcccccc,
            labelOffset: new THREE.Vector3(0, 0, 150),
            xDivOffset: 150,
            yDivOffset: 150,
            dataSource: options?.dataSource || 'markupData.json'
        };
        this.state = {
            markupItems: [],
            hovered: null,
            selected: null,
            label: null
        };
        this.meshes = {};
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.PointCloud.threshold = this.config.threshold;
        this.labelElement = document.getElementById('label');
        
        // Remove inherited methods to use our own
        delete this.register;
        delete this.deregister;
        delete this.activate;
        delete this.deactivate;
        delete this.getPriority;
        delete this.handleSingleClick;
        delete this.handleMouseMove;
    }

    getName() {
        return this.names[0];
    }

    getPriority() {
        return 50;
    }

    activate(name, viewer) {
        if (!this.active) {
            this.active = true;
            
            if (!this.viewer.overlays.hasScene(this.overlayName)) {
                this.viewer.overlays.addScene(this.overlayName);
            }
            
            this.loadMarkupData().then(() => {
                this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, () => this.updateInfoCardPosition());
            });
        }
        
        return true;
    }

    deactivate(name) {
        if (this.active) {
            this.cleanup();
            this.active = false;
        }
        return true;
    }

    handleSingleClick(event, button) {
        if (!this.active || button !== 0) return false;
        return this.onClick(event);
    }

    handleMouseMove(event) {
        if (!this.active) return false;
        this.onMouseMove(event);
        return false;
    }

    async loadMarkupData() {
        try {
            const response = await fetch(this.config.dataSource);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.setMarkupData(data);
        } catch (error) {
            console.error('Failed to load markup data:', error);
        }
    }

    setMarkupData(data) {
        this.state.markupItems = data;
        this.createGeometry(data);
        this.createPointCloud();
        this.createLine();
    }

    createGeometry(data) {
        this.geometry = new THREE.Geometry();
        data.forEach(item => {
            this.geometry.vertices.push(new THREE.Vector3(item.x, item.y, item.z));
            this.geometry.colors.push(new THREE.Color(1.0, item.icon, 0));
        });
    }

    createPointCloud() {
        if (this.meshes.pointCloud) {
            this.removeFromScene(this.meshes.pointCloud);
        }
        
        const material = new THREE.ShaderMaterial({
            vertexColors: THREE.VertexColors,
            fragmentShader: this.fragmentShader,
            vertexShader: this.vertexShader,
            depthWrite: true,
            depthTest: true,
            uniforms: {
                size: { type: 'f', value: this.config.size },
                tex: { type: 't', value: THREE.ImageUtils.loadTexture('img/icons.png') }
            }
        });

        this.meshes.pointCloud = new THREE.PointCloud(this.geometry, material);
        this.meshes.pointCloud.position.sub(this.getGlobalOffset());
        this.addToScene(this.meshes.pointCloud);
    }

    createLine() {
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x000000, 
            transparent: true,
            opacity: 0.8
        });
        
        this.meshes.line = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 100, 8), material);
        this.meshes.line.position.sub(this.getGlobalOffset());
        this.addToScene(this.meshes.line);
    }

    performHitTest(event) {
        if (!this.meshes.pointCloud) return null;

        const { x, y } = this.getCanvasCoordinates(event);
        const vector = new THREE.Vector3(x, y, 0.5).unproject(this.viewer.impl.camera);
        
        this.raycaster.set(
            this.viewer.impl.camera.position,
            vector.sub(this.viewer.impl.camera.position).normalize()
        );

        const intersects = this.raycaster.intersectObject(this.meshes.pointCloud);
        return intersects.length > 0 ? intersects[0].index : null;
    }

    updateHitTest(event) {
        const hitIndex = this.performHitTest(event);
        
        if (hitIndex !== null) {
            this.updateHoverState(hitIndex);
        } else {
            if (this.state.hovered !== null) {
                this.geometry.colors[this.state.hovered].r = 1.0;
                this.state.hovered = null;
                this.geometry.colorsNeedUpdate = true;
                this.viewer.impl.invalidate(true);
            }
        }
    }

    updateHoverState(index) {
        if (this.state.hovered !== null) {
            this.geometry.colors[this.state.hovered].r = 1.0;
        }
        
        this.state.hovered = index;
        this.geometry.colors[index].r = 2.0;
        this.geometry.colorsNeedUpdate = true;
        this.viewer.impl.invalidate(true);
    }

    updateLine() {
        const position = this.meshes.pointCloud.geometry.vertices[this.state.selected].clone();
        const { labelOffset } = this.config;
        
        this.meshes.line.position.set(
            position.x + labelOffset.x * Math.sign(position.x),
            position.y + labelOffset.y,
            position.z + labelOffset.z
        );
        
        this.updateLineOrientation();
    }

    updateLineOrientation() {
        if (!this.meshes.line || this.state.selected === null) return;
        
        const camera = this.viewer.impl.camera;
        this.meshes.line.lookAt(camera.position);
    }

    updateInfoCard() {
        const position = this.meshes.line.position
            .clone()
            .sub(this.getGlobalOffset());
        
        this.state.label = position.project(this.viewer.impl.camera);
        
        // Convert normalized device coordinates (-1 to 1) to screen coordinates
        const x = (this.state.label.x + 1) * 0.5 * innerWidth + this.config.xDivOffset;
        const y = (-this.state.label.y + 1) * 0.5 * innerHeight + this.config.yDivOffset;
        
        this.labelElement.style.left = x + 'px';
        this.labelElement.style.top = y + 'px';
        this.labelElement.style.display = 'block';
        
        // Generate and display info card content
        const item = this.state.markupItems[this.state.selected];
        if (item) {
            this.labelElement.innerHTML = InfoCard.create(item);
        }
    }

    updateInfoCardPosition() {
        if (this.state.selected === null || !this.labelElement) return;
        
        const position = this.meshes.line.position
            .clone()
            .sub(this.getGlobalOffset());
        
        this.state.label = position.project(this.viewer.impl.camera);
        
        // Convert normalized device coordinates (-1 to 1) to screen coordinates
        const x = (this.state.label.x + 1) * 0.5 * innerWidth + this.config.xDivOffset;
        const y = (-this.state.label.y + 1) * 0.5 * innerHeight + this.config.yDivOffset;
        
        this.labelElement.style.left = x + 'px';
        this.labelElement.style.top = y + 'px';
    }

    handleDirectClick(event) {
        if (event.button === 0) {
            this.onClick(event);
        }
    }

    onMouseMove(event) {
        if (this.state.selected !== null) {
            this.updateInfoCardPosition();
        }
        this.updateHitTest(event);
        return false;
    }

    onClick(event) {
        const hitIndex = this.performHitTest(event);
        
        if (hitIndex === null) {
            return false;
        }
        
        this.state.selected = hitIndex;
        this.updateLine();
        this.updateInfoCard();
        this.viewer.impl.invalidate(true);
        this.viewer.clearSelection();
        
        return true;
    }

    updateLine() {
        if (!this.meshes.line) return;
        
        const startPos = this.meshes.pointCloud.geometry.vertices[this.state.selected].clone();
        const endPos = startPos.clone().add(this.config.labelOffset);
        
        // Position cylinder at midpoint between start and end
        const midpoint = startPos.clone().add(endPos).multiplyScalar(0.5);
        this.meshes.line.position.copy(midpoint);
        this.meshes.line.position.sub(this.getGlobalOffset());
        
        // Scale cylinder to match the vertical distance (300 units)
        const length = this.config.labelOffset.length();
        this.meshes.line.scale.y = length / 100; // Scale to match distance
        
        // Rotate cylinder to align with Z-axis (cylinder is Y-axis by default)
        this.meshes.line.rotation.set(Math.PI / 2, 0, 0); // Rotate 90 degrees around X-axis
        
        this.meshes.line.visible = true;
        this.viewer.impl.invalidate(true);
    }

    getCanvasCoordinates(event) {
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((event.offsetX || event.clientX - rect.left) / canvas.clientWidth) * 2 - 1,
            y: -((event.offsetY || event.clientY - rect.top) / canvas.clientHeight) * 2 + 1
        };
    }

    getGlobalOffset() {
        return this.viewer.model.getData().globalOffset;
    }

    addToScene(mesh) {
        this.viewer.overlays.addMesh(mesh, this.overlayName);
    }

    removeFromScene(mesh) {
        this.viewer.overlays.removeMesh(mesh, this.overlayName);
    }

    cleanup() {
        Object.values(this.meshes).forEach(mesh => mesh && this.removeFromScene(mesh));
        this.meshes = {};
        this.state.hovered = null;
        this.state.selected = null;
        this.hideInfoCard();
    }

    get vertexShader() {
        return `
            uniform float size;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (size / (length(mvPosition.xyz) + 1.0));
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
    }

    get fragmentShader() {
        return `
            uniform sampler2D tex;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor.x, vColor.x, vColor.x, 1.0);
                gl_FragColor = gl_FragColor * texture2D(tex, vec2((gl_PointCoord.x + vColor.y * 1.0) / 4.0, 1.0 - gl_PointCoord.y));
                if (gl_FragColor.w < 0.5) discard;
            }
        `;
    }
}

// Extension wrapper to manage the tool
class Markup3D extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this.tool = null;
    }

    async load() {
        this.tool = new Markup3DTool(this.viewer, this.options);
        this.viewer.toolController.registerTool(this.tool);
        
        setTimeout(() => {
            this.viewer.toolController.activateTool(this.tool.getName());
        }, 100);
        
        return true;
    }

    unload() {
        if (this.tool) {
            this.viewer.toolController.deactivateTool(this.tool.getName());
            this.viewer.toolController.deregisterTool(this.tool);
            this.tool = null;
        }
        return true;
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('markup3d', Markup3D);