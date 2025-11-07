// ES6 Module imports for icon3d extensions
import { Icon3dTool, Icon3dToolExtension } from './ext/icon3d.js';
import { InfoCard, Icon3dExtension } from './ext/icon3d.infoCard.js';

// Register extensions with Autodesk Viewer
Autodesk.Viewing.theExtensionManager.registerExtension('icon3d', Icon3dToolExtension);
Autodesk.Viewing.theExtensionManager.registerExtension('icon3d.infoCard', Icon3dExtension);

// Configuration Constants
const DEFAULT_URN = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y29uc29saWRhdGVkL3JtZV9hZHZhbmNlZF9zYW1wbGVfcHJvamVjdC5ydnQ";
const TOKEN_ENDPOINT = "https://hd24ouudmhx7ixzla4i6so2atm0fgsex.lambda-url.us-west-2.on.aws";


// View Panel Module
class ViewPanel {
    constructor(viewer) {
        this.viewer = viewer;
        this.views = [
            {"objectSet":[{"id":[],"idType":"lmv","isolated":[],"hidden":[5137],"explodeScale":0,"explodeOptions":{"magnitude":4,"depthDampening":0}}],"viewport":{"aspectRatio":2.799582463465553,"isOrthographic":false,"name":"","eye":[273.86784275360964,146.7518894182768,175.36229264090395],"target":[0.000002014034180319868,-0.0000037221806792331336,3.7483673054339306e-7],"up":[-0.43323576346953174,-0.2321490843671658,0.8708694367575764],"distanceToOrbit":356.7795480131608,"projection":"perspective","worldUpVector":[0,0,1],"pivotPoint":[0.0000020140341945307227,-0.000003722180665022279,3.7483673409610674e-7],"fieldOfView":53.13010235415598},"autocam":{"sceneUpDirection":{"x":0,"y":0,"z":1},"sceneFrontDirection":{"x":0,"y":1,"z":0},"cubeFront":{"x":1,"y":0,"z":0}},"renderOptions":{"environment":"Boardwalk","ambientOcclusion":{"enabled":true,"radius":13.123359580052492,"intensity":1},"toneMap":{"method":1,"exposure":-7,"lightMultiplier":-1e-20},"appearance":{"ghostHidden":false,"ambientShadow":true,"antiAliasing":true,"progressiveDisplay":true,"swapBlackAndWhite":false,"displayLines":true,"displayPoints":true}},"cutplanes":[]},
            {"objectSet":[{"id":[],"idType":"lmv","isolated":[137,136],"hidden":[],"explodeScale":0,"explodeOptions":{"magnitude":4,"depthDampening":0}}],"viewport":{"aspectRatio":2.799582463465553,"isOrthographic":false,"name":"","eye":[4.770224907588691,10.501315445426778,194.6501071382107],"target":[4.770224907588691,10.501315445426778,-31.494710722429176],"up":[0,-1,0],"distanceToOrbit":233.17996753712927,"worldUpVector":[0,0,1],"pivotPoint":[6.657524634996134,10.817089271586445,-38.52986039891858],"fieldOfView":53.13010235415598},"autocam":{"sceneUpDirection":{"x":0,"y":0,"z":1},"sceneFrontDirection":{"x":0,"y":1,"z":0},"cubeFront":{"x":1,"y":0,"z":0}},"renderOptions":{"environment":"Boardwalk","ambientOcclusion":{"enabled":true,"radius":13.123359580052492,"intensity":1},"toneMap":{"method":1,"exposure":-7,"lightMultiplier":-1e-20},"appearance":{"ghostHidden":false,"ambientShadow":true,"antiAliasing":true,"progressiveDisplay":true,"swapBlackAndWhite":false,"displayLines":true,"displayPoints":true}}},
            {"viewport":{"aspectRatio":2.799582463465553,"isOrthographic":false,"name":"","eye":[1.309364501288762,11.964856856538447,7.228263191923022],"target":[-3.263407495149824,8.019303072525965,5.116411430030672],"up":[-0.2499013854358662,-0.21562399299688886,0.9439574096331425],"distanceToOrbit":40.907152302782116,"projection":"perspective","worldUpVector":[0,0,1],"pivotPoint":[-25.605135917663574,-14.811074256896973,-8.404598951339722],"fieldOfView":53.13010235415598}},
            {"objectSet":[{"id":[19709],"idType":"lmv","isolated":[],"hidden":[],"explodeScale":0,"explodeOptions":{"magnitude":4,"depthDampening":0}}],"viewport":{"aspectRatio":2.799582463465553,"isOrthographic":false,"name":"","eye":[-43.600577512374095,14.938957729942036,3.163517757201216],"target":[-53.888010451515754,0.9431408298252375,-10.102010635378146],"up":[-0.35946893634112687,-0.48904925495727425,0.7947407816587205],"distanceToOrbit":31.347135926111157,"projection":"perspective","worldUpVector":[0,0,1],"pivotPoint":[-58.355350494384766,-5.134572982788086,-15.862595081329346],"fieldOfView":53.13010235415598},"autocam":{"sceneUpDirection":{"x":0,"y":0,"z":1},"sceneFrontDirection":{"x":0,"y":1,"z":0},"cubeFront":{"x":1,"y":0,"z":0}},"renderOptions":{"environment":"Boardwalk","ambientOcclusion":{"enabled":true,"radius":13.123359580052492,"intensity":1},"toneMap":{"method":1,"exposure":-7,"lightMultiplier":-1e-20},"appearance":{"ghostHidden":true,"ambientShadow":true,"antiAliasing":true,"progressiveDisplay":true,"swapBlackAndWhite":false,"displayLines":true,"displayPoints":true}},"cutplanes":[[0,0,1,12.72574520111084]]}
        ];
        this.createUI();
    }

    createUI() {
        const panel = document.createElement('div');
        panel.className = 'absolute top-8 left-8 z-[100] bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3';
        
        const label = document.createElement('span');
        label.className = 'text-sm font-semibold text-gray-700';
        label.textContent = 'View';
        panel.appendChild(label);
        
        const buttons = ['A', 'B', 'C', 'D'];
        buttons.forEach((letter, index) => {
            const btn = document.createElement('button');
            btn.className = 'w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors';
            btn.textContent = letter;
            btn.onclick = () => this.switchView(index);
            panel.appendChild(btn);
        });
        
        document.body.appendChild(panel);
    }

    switchView(index) { if (this.viewer && this.views[index]) this.viewer.restoreState(this.views[index]); }
}


// Main Application
class ViewerApp {
    constructor() {
        this.viewer = null;
        this.viewPanel = null;
        this.icon3dDataSource = 'ext/icon3d.data.json';
    }

    async init() {
        const token = await (await fetch(TOKEN_ENDPOINT)).text();
        
        Autodesk.Viewing.Initializer({ 
            env: "AutodeskProduction2", 
            api: 'streamingV2', 
            accessToken: token 
        }, () => {
            const config = {
                extensions: ['icon3d.infoCard'],
                extensionOptions: {
                    'icon3d.infoCard': { dataSource: this.icon3dDataSource }
                }
            };
            
            this.viewer = new Autodesk.Viewing.Private.GuiViewer3D(document.getElementById('apsViewer'), config);
            
            this.viewer.start();
            this.viewer.setTheme("light-theme");
            this.viewPanel = new ViewPanel(this.viewer);
            
            Autodesk.Viewing.Document.load(`urn:${DEFAULT_URN}`, async (doc) => {
                const viewables = doc.getRoot().getDefaultGeometry();
                
                this.viewer.loadDocumentNode(doc, viewables);
                // Slow down camera movement
                this.viewer.autocam.shotParams.destinationPercent = 2.5;
                this.viewer.autocam.shotParams.duration = 4;
                await this.viewer.waitForLoadDone();
                this.viewer.hide(5137);
            });
        });
    }

}

const app = new ViewerApp();
document.addEventListener('DOMContentLoaded', () => app.init());
