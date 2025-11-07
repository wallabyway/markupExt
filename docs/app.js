// Configuration Constants
const DEFAULT_URN = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y29uc29saWRhdGVkL3JtZV9hZHZhbmNlZF9zYW1wbGVfcHJvamVjdC5ydnQ";
const TOKEN_ENDPOINT = "https://hd24ouudmhx7ixzla4i6so2atm0fgsex.lambda-url.us-west-2.on.aws";


// View Panel Module
class ViewPanel {
    constructor() {
        this.states = {
            view1: {"objectSet":[{"id":[],"idType":"lmv","isolated":[],"hidden":[],"explodeScale":0,"explodeOptions":{"magnitude":4,"depthDampening":0}}],"viewport":{"aspectRatio":2.799582463465553,"isOrthographic":false,"name":"","eye":[273.86784275360964,146.7518894182768,175.36229264090395],"target":[0.000002014034180319868,-0.0000037221806792331336,3.7483673054339306e-7],"up":[-0.43323576346953174,-0.2321490843671658,0.8708694367575764],"distanceToOrbit":356.7795480131608,"projection":"perspective","worldUpVector":[0,0,1],"pivotPoint":[0.0000020140341945307227,-0.000003722180665022279,3.7483673409610674e-7],"fieldOfView":53.13010235415598},"autocam":{"sceneUpDirection":{"x":0,"y":0,"z":1},"sceneFrontDirection":{"x":0,"y":1,"z":0},"cubeFront":{"x":1,"y":0,"z":0}},"renderOptions":{"environment":"Boardwalk","ambientOcclusion":{"enabled":true,"radius":13.123359580052492,"intensity":1},"toneMap":{"method":1,"exposure":-7,"lightMultiplier":-1e-20},"appearance":{"ghostHidden":false,"ambientShadow":true,"antiAliasing":true,"progressiveDisplay":true,"swapBlackAndWhite":false,"displayLines":true,"displayPoints":true}},"cutplanes":[]},
            view2: {"viewport":{"aspectRatio":2.799582463465553,"isOrthographic":false,"name":"","eye":[1.309364501288762,11.964856856538447,7.228263191923022],"target":[-3.263407495149824,8.019303072525965,5.116411430030672],"up":[-0.2499013854358662,-0.21562399299688886,0.9439574096331425],"distanceToOrbit":40.907152302782116,"projection":"perspective","worldUpVector":[0,0,1],"pivotPoint":[-25.605135917663574,-14.811074256896973,-8.404598951339722],"fieldOfView":53.13010235415598}},
            view3: {"objectSet":[{"id":[19709],"idType":"lmv","isolated":[],"hidden":[],"explodeScale":0,"explodeOptions":{"magnitude":4,"depthDampening":0}}],"viewport":{"aspectRatio":2.799582463465553,"isOrthographic":false,"name":"","eye":[-43.600577512374095,14.938957729942036,3.163517757201216],"target":[-53.888010451515754,0.9431408298252375,-10.102010635378146],"up":[-0.35946893634112687,-0.48904925495727425,0.7947407816587205],"distanceToOrbit":31.347135926111157,"projection":"perspective","worldUpVector":[0,0,1],"pivotPoint":[-58.355350494384766,-5.134572982788086,-15.862595081329346],"fieldOfView":53.13010235415598},"autocam":{"sceneUpDirection":{"x":0,"y":0,"z":1},"sceneFrontDirection":{"x":0,"y":1,"z":0},"cubeFront":{"x":1,"y":0,"z":0}},"renderOptions":{"environment":"Boardwalk","ambientOcclusion":{"enabled":true,"radius":13.123359580052492,"intensity":1},"toneMap":{"method":1,"exposure":-7,"lightMultiplier":-1e-20},"appearance":{"ghostHidden":true,"ambientShadow":true,"antiAliasing":true,"progressiveDisplay":true,"swapBlackAndWhite":false,"displayLines":true,"displayPoints":true}},"cutplanes":[[0,0,1,12.72574520111084]]},
            view4: {"objectSet":[{"id":[],"idType":"lmv","isolated":[137,136],"hidden":[],"explodeScale":0,"explodeOptions":{"magnitude":4,"depthDampening":0}}],"viewport":{"aspectRatio":2.799582463465553,"isOrthographic":false,"name":"","eye":[4.770224907588691,10.501315445426778,194.6501071382107],"target":[4.770224907588691,10.501315445426778,-31.494710722429176],"up":[0,-1,0],"distanceToOrbit":233.17996753712927,"projection":"perspective","worldUpVector":[0,0,1],"pivotPoint":[6.657524634996134,10.817089271586445,-38.52986039891858],"fieldOfView":53.13010235415598},"autocam":{"sceneUpDirection":{"x":0,"y":0,"z":1},"sceneFrontDirection":{"x":0,"y":1,"z":0},"cubeFront":{"x":1,"y":0,"z":0}},"renderOptions":{"environment":"Boardwalk","ambientOcclusion":{"enabled":true,"radius":13.123359580052492,"intensity":1},"toneMap":{"method":1,"exposure":-7,"lightMultiplier":-1e-20},"appearance":{"ghostHidden":false,"ambientShadow":true,"antiAliasing":true,"progressiveDisplay":true,"swapBlackAndWhite":false,"displayLines":true,"displayPoints":true}},"cutplanes":[[0,0,1,4.417631149291992]]}
        };
        this.viewer = null;
    }

    setViewer(viewer) {
        this.viewer = viewer;
    }

    switchView(viewName) {
        if (this.viewer && this.states[viewName]) {
            this.viewer.restoreState(this.states[viewName]);
        }
    }
}


// Main Application
class ViewerApp {
    constructor() {
        this.viewer = null;
        this.viewPanel = new ViewPanel();
        this.markupDataSource = 'markupData.json';
    }

    async init() {
        await this.startViewer();
    }

    async startViewer() {
        const token = await this.fetchToken();
        
        Autodesk.Viewing.Initializer({ 
            env: "AutodeskProduction2", 
            api: 'streamingV2', 
            accessToken: token 
        }, () => {
            this.viewer = new Autodesk.Viewing.Private.GuiViewer3D(document.getElementById('apsViewer'), {});
            
            this.viewer.start();
            this.viewer.setTheme("light-theme");
            this.viewPanel.setViewer(this.viewer);
            
            Autodesk.Viewing.Document.load(`urn:${DEFAULT_URN}`, async (doc) => {
                const viewables = doc.getRoot().getDefaultGeometry();
                
                this.viewer.loadDocumentNode(doc, viewables);
                await this.viewer.waitForLoadDone({ propDb: true, geometry: true });
                this.viewer.navigation.toPerspective();
                
                // Slow down camera movement
                this.viewer.autocam.shotParams.destinationPercent = 3;
                this.viewer.autocam.shotParams.duration = 5;
                
                // Load extension with options after viewer is ready
                await this.viewer.loadExtension('markup3d', { dataSource: this.markupDataSource });
            });
        });
    }

    async fetchToken() {
        return await (await fetch(TOKEN_ENDPOINT)).text();
    }

    switchView(viewName) {
        this.viewPanel.switchView(viewName);
    }
}

// Application Instance
const app = new ViewerApp();

// Global Interface
function initializeViewer() {
    app.init();
}

function switchView(viewName) {
    app.switchView(viewName);
}