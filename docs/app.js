var viewer;
var svfURL = "https://lmv-models.s3.amazonaws.com/toy_plane/toy_plane.svf";
var $ = function(div){return document.getElementById(div)}


function initializeViewer() {
    window.devicePixelRatio = 1;
    viewer = new Autodesk.Viewing.Private.GuiViewer3D($('forgeViewer'), {});
    var options = {
        env: "Local",
        useConsolidation: true,
        useADP: false,
    }
    Autodesk.Viewing.Initializer( options, function() {
        viewer.start(svfURL, options, onSuccess);            
    });

    // Init after the viewer is ready
    function onSuccess() {
        viewer.setBackgroundColor(0,0,0, 155,155,155);
        viewer.impl.toggleGroundShadow(true);
        viewer.loadExtension("markup3d");
        initializeMarkup();
    }
}


function initializeMarkup(){
        var elem = $("label");
        // create 20 random markup points
        // where icon is 0="Issue", 1="BIMIQ_Warning", 2="RFI", 3="BIMIQ_Hazard"
        var dummyData = [];
        for (let i=0; i<20; i++) {
            dummyData.push({
                icon:  Math.round(Math.random()*3),  
                x: Math.random()*300-150, 
                y: Math.random()*50-20, 
                z: Math.random()*150-130
            });
        }        
        window.dispatchEvent(new CustomEvent('newData', {'detail': dummyData}));

        function moveLabel(p) {
            elem.style.left = ((p.x + 1)/2 * window.innerWidth) + 'px';
            elem.style.top =  (-(p.y - 1)/2 * window.innerHeight) + 'px';            
        }
        // listen for the 'Markup' event, to re-position our <DIV> POPUP box
        window.addEventListener("onMarkupMove", e=>{moveLabel(e.detail)}, false)
        window.addEventListener("onMarkupClick", e=>{
            elem.style.display = "block";
            moveLabel(e.detail);
            elem.innerHTML = `<img src="img/${(e.detail.id%6)}.jpg"><br>Markup ID:${e.detail.id}`;
        }, false);
    }


function switchView(level) {
    viewer.restoreState(viewStates[level]);
}

    // get view state from console
    // v=viewer.getState();delete(v.seedURN);delete(v.objectSet);delete(v.renderOptions);delete(v.cutplanes);JSON.stringify(v)

var viewStates = {
    "view1": {"viewport":{"name":"","eye":[363.4573315717432,454.00539656374525,653.3954041272863],"target":[-182.44454194347043,-270.9675826967336,-373.32406499505953],"up":[-0.2483724861641897,0.8485857169975204,-0.4671331598424841],"worldUpVector":[0,1,0],"pivotPoint":[37.81322646507962,43.88141314081513,40.03438798259458],"distanceToOrbit":806.276539067982,"aspectRatio":1.902061855670103,"projection":"perspective","isOrthographic":false,"fieldOfView":22.918312146742387}},
    "view2": {"viewport":{"name":"","eye":[99.97230916985185,568.8908329153263,-120.01029576775429],"target":[81.51428263715795,-753.2667313893775,239.58144614031337],"up":[-0.04946167020653998,0.2627619643160633,0.963592078261929],"worldUpVector":[0,1,0],"pivotPoint":[48.193467686450305,18.558605555111114,11.800714547187397],"distanceToOrbit":566.2807733860644,"aspectRatio":1.902061855670103,"projection":"perspective","isOrthographic":false,"fieldOfView":22.918312146742387}},
    "view3": {"viewport":{"name":"","eye":[-424.2691476449123,542.6505164276925,279.13303803246106],"target":[268.0259078155068,-460.8007897974295,-346.6149756761407],"up":[0.5432521913940823,0.6810027141839978,-0.4910319336046847],"worldUpVector":[0,1,0],"pivotPoint":[24.323528772924313,57.16362725342778,128.62718425779093],"distanceToOrbit":650.8747272159101,"aspectRatio":1.902061855670103,"projection":"perspective","isOrthographic":false,"fieldOfView":22.918312146742387}},
}