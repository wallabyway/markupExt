export class Icon3dTool extends Autodesk.Viewing.ToolInterface {
    constructor(viewer, options = {}) {
        super();
        this.viewer = viewer;
        this.options = options;
        this.names = ['icon3d-tool'];
        this.active = false;
        this.overlayName = 'icon3d-overlay';
        this.infoCard = null; // Optional InfoCard reference
        
        this.config = {
            size: 120.0,
            threshold: 5,
            dataSource: options?.dataSource || 'ext/icon3d.data.json'
        };
        
        this.state = {
            markupItems: [],
            hovered: null
        };
        
        this.meshes = {};
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.PointCloud.threshold = this.config.threshold;
        
        // Remove inherited methods to use our own
        delete this.register;
        delete this.deregister;
        delete this.activate;
        delete this.deactivate;
        delete this.getPriority;
        delete this.handleSingleClick;
        delete this.handleMouseMove;
    }

    getName() { return this.names[0]; }
    getPriority() { return 50; }
    setInfoCard(infoCard) { this.infoCard = infoCard; }
    getMarkupItem(id) { return this.state.markupItems.find(item => item.id === id); }

    activate(name, viewer) {
        if (!this.active) {
            this.active = true;
            
            if (!this.viewer.overlays.hasScene(this.overlayName)) {
                this.viewer.overlays.addScene(this.overlayName);
            }
            
            // Wait for model to load before loading markup data
            if (this.viewer.model) {
                this.loadMarkupData();
            } else {
                this.viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
                    this.loadMarkupData();
                });
            }
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
        const hitIndex = this.performHitTest(event);
        if (hitIndex !== null && this.infoCard) {
            const item = this.state.markupItems[hitIndex];
            this.infoCard.show(item.id);
        }
        return hitIndex !== null;
    }

    handleMouseMove(event) {
        const hitIndex = this.performHitTest(event);
        
        if (hitIndex !== null) {
            if (this.state.hovered !== null) {
                this.geometry.colors[this.state.hovered].r = 1.0;
            }
            this.state.hovered = hitIndex;
            this.geometry.colors[hitIndex].r = 2.0;
            this.geometry.colorsNeedUpdate = true;
            this.viewer.impl.invalidate(true);
        } else {
            if (this.state.hovered !== null) {
                this.geometry.colors[this.state.hovered].r = 1.0;
                this.state.hovered = null;
                this.geometry.colorsNeedUpdate = true;
                this.viewer.impl.invalidate(true);
            }
        }
        return false;
    }

    async loadMarkupData() {
        const response = await fetch(this.config.dataSource);
        this.state.markupItems = await response.json();
        
        this.geometry = new THREE.Geometry();
        this.state.markupItems.forEach(item => {
            this.geometry.vertices.push(new THREE.Vector3(item.x, item.y, item.z + 3));
            this.geometry.colors.push(new THREE.Color(1.0, item.icon, 0));
        });

        // Load texture and wait for it to be ready
        const texture = THREE.ImageUtils.loadTexture('ext/icons.png', undefined, () => {
            this.viewer.impl.invalidate(true);
        });

        const material = new THREE.ShaderMaterial({
            vertexColors: THREE.VertexColors,
            fragmentShader: this.fragmentShader,
            vertexShader: this.vertexShader,
            depthWrite: true,
            depthTest: true,
            uniforms: {
                size: { type: 'f', value: this.config.size },
                tex: { type: 't', value: texture }
            }
        });

        this.meshes.pointCloud = new THREE.PointCloud(this.geometry, material);
        this.viewer.overlays.addMesh(this.meshes.pointCloud, this.overlayName);
    }

    performHitTest(event) {
        if (!this.meshes.pointCloud) return null;
        
        const canvas = this.viewer.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = ((event.offsetX || event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        const y = -((event.offsetY || event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
        
        const camera = this.viewer.impl.camera;
        
        if (camera.isPerspective) {
            // Perspective camera: rays emanate from camera position
            const vector = new THREE.Vector3(x, y, 0.5).unproject(camera);
            this.raycaster.set(
                camera.position,
                vector.sub(camera.position).normalize()
            );
        } else {
            // Orthographic camera: parallel rays from screen point
            const origin = new THREE.Vector3(x, y, -1).unproject(camera);
            const direction = new THREE.Vector3(0, 0, -1).transformDirection(camera.matrixWorld);
            this.raycaster.set(origin, direction);
        }

        const intersects = this.raycaster.intersectObject(this.meshes.pointCloud);
        return intersects.length > 0 ? intersects[0].index : null;
    }

    cleanup() {
        this.infoCard?.cleanup();
        Object.values(this.meshes).forEach(mesh => this.viewer.overlays.removeMesh(mesh, this.overlayName));
        this.meshes = {};
        this.state.hovered = null;
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

// Simple extension wrapper for standalone use
export class Icon3dToolExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) { super(viewer, options); this.tool = null; }

    async load() {
        this.tool = new Icon3dTool(this.viewer, this.options);
        this.viewer.toolController.registerTool(this.tool);
        this.viewer.toolController.activateTool(this.tool.getName());
        
        return true;
    }

    unload() {
        this.viewer.toolController.deactivateTool(this.tool.getName());
        this.viewer.toolController.deregisterTool(this.tool);
        this.tool = null;
        return true;
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('icon3d', Icon3dToolExtension);
