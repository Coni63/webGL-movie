var container, stats;
var camera, scene, renderer;
var light1, light2;
var labelPos;
var sphere;
var mouse;
var mouseXOnMouseDown = 0;
var mouseYOnMouseDown = 0;
var raycaster;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var deltaRotationQuaternion;
var data, classNames;
var points;
var stats;
var max_movie = 9150;
var raycaster;
var intersected;
var instances = [];
var toggle = 0;
var clock;
var params = {
    sphere_color : '#8e0909',
    ambiente_color : '#999999',
    spot1_color: '#ffffff',
    spot2_color: '#11E8BB',
    spot3_color: '#8200C9',
    spot4_color: '#ff00ff',
    display_fps : true,
    display_sphere : true,
}
var scope;
var pressed = false;
var camera_pos = new THREE.Vector3( 0, 0, 0.01 );
var text_container;

function init() {
    
    var mydata = JSON.parse(data);
    
    text_container = document.getElementById("textbox_container");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 1.5 );    
    
    clock = new THREE.Clock();
    clock.start()
        
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array( max_movie*3 );
    var colors = new Float32Array( max_movie*3 );

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

    if (camera.zoom < 20) {
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
            var textbox = new TextboxV2(instances[i].title);
                textbox.updatePosition(camera, instances[i].vec);
//            instances[i].textbox.updatePosition(camera, instances[i].vec);
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

    renderer.render( scene, camera );    
        
    requestAnimationFrame( animate );

    stats.update();
    
    controls.update();
}

function updateLink(movie) {
    let url = "http://www.imdb.com/title/"+movie.movieID+"/";
    $( "#info" ).html('<a href="' +url+ '" target="_blank">'+movie.title+'<a>');
    $( "#info" ).attr("href", url);
    
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


init();
animate();