var container, stats;
var camera, scene, renderer;
var camera_pos = new THREE.Vector3( 0, 0, 0.01 );
var mouse;
var labelPos;
var raycaster;
var points;
var stats;
var max_movie = 9150;
var nb_labels = 76;
var intersected;
var instances = [];
var toggle = 0;
var clock;
var text_container;
var centroides;
var mydata;
var labels;
var poster_placeholder;

function init() {
        
    mydata = JSON.parse(data);
    centroides = JSON.parse(cluster);
    
    text_container = document.getElementById("textbox_container");
    
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 3 );    
    
    clock = new THREE.Clock();
    clock.start()
        
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array( max_movie*3 );
    var colors = new Float32Array( max_movie*3 );
    
    var rad = [];
    for ( var i = 0; i < max_movie; ++i ) {      
        var movie = new MovieV2(i, mydata.score[i], mydata.color[i], mydata.primaryTitle[i], mydata.tconst[i], mydata.X[i], mydata.Y[i], mydata.Z[i]);
        instances.push(movie);
        
        positions[ 3 * i ] = movie.x;
        positions[ 3 * i + 1 ] = movie.y;
        positions[ 3 * i + 2 ] = movie.z;
        
        var color = new THREE.Color( 0xeeeeee );
        
        colors[ 3 * i ] = movie.color.r;
        colors[ 3 * i + 1 ] = movie.color.g;
        colors[ 3 * i + 2 ] = movie.color.b;
        
        rad.push(movie.score*1000);
        
        $("#movie_list").append('<option value='+i+'>'+ movie.title + '</option>');
    } 
        
    var sel = $('#movie_list');
    var opts_list = sel.find('option');
        opts_list.sort(function(a, b) { return $(a).text() > $(b).text() ? 1 : -1; });
    sel.html('').append(opts_list);
    $("#movie_list").val($("#movie_list option:first").val());
    
    pMaterial = new THREE.PointsMaterial( {
        size: 0.003,
        transparent: false,        
        vertexColors: THREE.VertexColors
    } );
    
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
        
    points = new THREE.Points( geometry, pMaterial );
    scene.add( points );
    
    // Centroides
    labels = new THREE.Object3D();
    for (var i = 0; i < nb_labels; i++) {
        var label = makeTextSprite( centroides["Style"][i], 5, { r:244, g:241, b:66, a:1.0 } );        
            label.position.set( centroides["X"][i], centroides["Y"][i], centroides["Z"][i] );
        labels.add(label)        
    }
    scene.add( labels );
    
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x000000, 1);

    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    mouse = new THREE.Vector2();
    
    // stats
    stats = new Stats();
    container.appendChild( stats.dom );
    
    // mouse control
    controls = new THREE.OrbitControls( camera, domElement = renderer.domElement, localElement=renderer.domElement );
    camera.position.copy( camera_pos );
    camera.lookAt(0, 0, 1);
    controls.noPan = true;
    controls.noZoom =true;
    
    // octree for raycasting
    raycaster = new THREE.Raycaster();
    raycaster.far = 1
    
    window.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'keydown', onKeyDown, false );
    // IE9, Chrome, Safari, Opera
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    // Firefox
	document.addEventListener("DOMMouseScroll", onDocumentMouseWheel, false);
    window.addEventListener( 'resize', onWindowResize, false );  
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
    
    event.preventDefault();
        
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    display_label();
}

function display_label(){ 
    toggle += clock.getDelta();

    if (camera.zoom < 10) {
        text_container.innerHTML = "";
        return;
    }
    if (toggle < 0.1) return;

    
    text_container.innerHTML = "";
    
    raycaster.setFromCamera( mouse, camera );

    intersection = raycaster.ray.direction

    for (i=0; i<instances.length; i++){
        let d = instances[i].vec.distanceToSquared( intersection );
        
        if (d < 1e-7){
            toggle = 0;
            updateLink(instances[i]);
        }
        if (d < 1e-3){
            var textbox = new TextboxV2(instances[i].title, instances[i].color);
                textbox.updatePosition(camera, instances[i].vec);
            text_container.appendChild(textbox.element);
        }
    }
}

function onDocumentMouseWheel( event ) {      
    var d = ((typeof event.wheelDelta != "undefined") ? (-event.wheelDelta) : event.detail);
    let factor_zoom_speed = (1.9*camera.zoom+3)/49;      // factor 0.1 @ min zoom (1), factor 2 @ max_zoom (50)
    camera.zoom -= factor_zoom_speed*Math.sign(d);
    camera.zoom = Math.min(camera.zoom, 50);  // max zoom
    camera.zoom = Math.max(camera.zoom, 1);   // min zoom
    update_rendering();
    display_label();
}

function animate() {
    if (camera.zoom > 10){
        labels.visible = false;
    } else {
        labels.visible = true;
    }
    
    renderer.render( scene, camera );    
        
    requestAnimationFrame( animate );

    stats.update();
    
    controls.update();
}

function updateLink(movie) {
    let url = "http://www.imdb.com/title/"+movie.movieID+"/";
//    $( "#info" ).html('<a href="' +url+ '" target="_blank">'+movie.title+'<a>');
    
    let src = "../posters/"+movie.movieID+".jpg";
    $( "#poster_placeholder" ).html('<a href="' +url+ '" target="_blank"><img src="' +src+ '" alt="'+movie.title+'"/><a>');
    
}

function update_rendering(){
    controls.rotateSpeed = 1/camera.zoom;
    let factor_particle_size = (0.007*camera.zoom+0.14)/49;
    points.material.size = factor_particle_size; 
    camera.updateProjectionMatrix();
    controls.update();
}

$( "#movie_list" ).change(function() {
    $( "select option:selected" ).each(function() {
        let idx =  $(this).attr("value");
        let mvi = instances[idx];
        let _target =  mvi.vec.clone();
        let _pos = mvi.vec.clone().multiplyScalar(-0.01);
        camera.position.copy(_pos);
        controls.target.copy( _target );
        controls.target.set( 0, 0, 0 );
        camera.zoom = 40;
        update_rendering();
        updateLink(mvi);
    });
});

function onKeyDown ( event ) {

    switch( event.keyCode ) {

        case 82: /*R*/	camera.position.copy( camera_pos );break;
        case 112: /*F1*/ window.open("https://github.com/Coni63/coni63.github.io",'_blank');break;
    }

}

function makeTextSprite( message, weight, color ) {
    var fontface = "Monospace";
    var fontsize = 30;
    var borderThickness = 0;
    var borderColor = color;
    var backgroundColor = { r:255, g:255, b:255, a:1.0 };
    var textColor = color;

    var canvas = document.createElement('canvas');
    canvas.width = 512
    canvas.height = 128
    var context = canvas.getContext('2d');
    context.font = fontsize + "px " + fontface;
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
    context.fillText( message, (canvas.width/2) - (textWidth / 2), 60);
    context.textBaseline = 'middle';
    context.textAlign = "center";

    var texture = new THREE.Texture(canvas) 
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture} );
    spriteMaterial.depthWrite = false;
    spriteMaterial.depthTest = false;
        
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set( 0.002*weight * fontsize, 0.001*weight * fontsize, 0.01 * fontsize);
    
    return sprite;  
}

var supportsES6 = function() {
    try {
        new Function("(a = 0) => a");
        return true;
    }
    catch (err) {
        return false;
    }}();

if (supportsES6 == true){

    var MovieV2 = class {
        constructor(rank, score, color, title, id, x, y, z){
            this.rank = rank;
            this.score = score;
            this.movieID = id;
            this.title = title;
            this.x = x;
            this.y = y;
            this.z = z;
            this.color = new THREE.Color( color );
            this.vec = new THREE.Vector3(x, y, z);
        }
    };

    var TextboxV2 = class {
        constructor(text, color) {
            this.element = document.createElement('div');
            this.element.className = 'text-label';
            this.element.style.position = 'absolute';
            this.element.style.width = 100;
            this.element.style.height = 100;
            this.element.innerHTML = text;
            this.element.style.top = -1000;
            this.element.style.left = -1000;
            this.element.style.fontSize = "10px";
            this.element.style.color = "#"+color.getHexString();
        };

        updatePosition(cam, point) {     
            var vector = point.clone();
                vector.project(camera);

            vector.x = (+vector.x + 1)/2 * window.innerWidth;
            vector.y = (-vector.y + 1)/2 * window.innerHeight;
            this.element.style.left = vector.x + 'px';
            this.element.style.top = vector.y + 'px';
        };

    };

} else {

    function MovieV2(rank, score, color, title, id, x, y, z){
        this.rank = rank;
        this.score = score;
        this.movieID = id;
        this.title = title;
        this.x = x;
        this.y = y;
        this.z = z;
        this.color = new THREE.Color( color );
        this.vec = new THREE.Vector3(x, y, z);
    }

    function TextboxV2(text, color) {
        this.element = document.createElement('div');
        this.element.className = 'text-label';
        this.element.style.position = 'absolute';
        this.element.style.width = 100;
        this.element.style.height = 100;
        this.element.innerHTML = text;
        this.element.style.top = -1000;
        this.element.style.left = -1000;
        this.element.style.fontSize = "10px";
        this.element.style.color = "#"+color.getHexString();
    }

    TextboxV2.prototype.updatePosition = function(cam, point) {     
        var vector = point.clone();
            vector.project(camera);

        vector.x = (+vector.x + 1)/2 * window.innerWidth;
        vector.y = (-vector.y + 1)/2 * window.innerHeight;
        this.element.style.left = vector.x + 'px';
        this.element.style.top = vector.y + 'px';
    }
}

init();
animate();