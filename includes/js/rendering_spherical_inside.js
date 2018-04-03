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

function init() {
    
    var mydata = JSON.parse(data);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 1 );    
    
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
//    controls = new THREE.OrbitControlsSphere( camera, domElement = renderer.domElement, localElement=renderer.domElement );
//    controls.minDistance = 0.001
//    controls.maxDistance = 0.999
    scope = renderer.domElement;
    camera.position.set( 0, 0, 0 );
    camera.lookAt(0, 0, 1);
//    controls.noPan = true;
    
    // octree for raycasting
    raycaster = new THREE.Raycaster();
    raycaster.far = 1
    
    window.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mouseout', onDocumentMouseOut, false );  
//    window.addEventListener( 'keydown', onKeyDown, false);
//    window.addEventListener( 'resize', onWindowResize, false );  
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
    
    event.preventDefault();

    if ( pressed == true ){
        mouse.x = -event.clientX - windowHalfX;
        mouse.y = event.clientY - windowHalfY;

        deltaRotationQuaternion = new THREE.Quaternion()
        deltaRotationQuaternion.setFromEuler(new THREE.Euler(
                    (mouse.y - mouseYOnMouseDown) * Math.PI / 1000,
                    (mouse.x - mouseXOnMouseDown) * Math.PI / 1000,                
                    0, 'XYZ'));
        
        mouseXOnMouseDown = mouse.x;    
        mouseYOnMouseDown = mouse.y; 

        points.quaternion.multiplyQuaternions( deltaRotationQuaternion, points.quaternion );
    //    labels.quaternion.multiplyQuaternions( deltaRotationQuaternion, labels.quaternion );
    } else {
        
//        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
//        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        
        mouse.x = -event.clientX - windowHalfX;
        mouse.y = event.clientY - windowHalfY;
        
        toggle += clock.getDelta();

        if (toggle < 0.1){
            return;
        }

        raycaster.setFromCamera( mouse, camera );

        var intersections = raycaster.intersectObject( sphere );

        if ( intersections.length > 0 ) {
            for (i=0; i<instances.length; i++){
                let d = instances[i].vec.distanceToSquared( intersections[ 0 ].point );
                if (d < 9e-6){
                    $("#info").text(instances[i].title);
                    toggle = 0;
                    updateLink(instances[i]);
                }
            }
        }
        
    }
}

function onDocumentMouseDown( event ) {
    event.preventDefault();
    pressed = true;

    mouseXOnMouseDown = event.clientX - windowHalfX;    
    mouseYOnMouseDown = event.clientY - windowHalfY;    
}

function onDocumentMouseUp( event ) {
    pressed = false;
}

function onDocumentMouseOut( event ) {
    pressed = false;
}

function onDocumentMouseWheel( event ) {      
    var d = ((typeof event.wheelDelta != "undefined") ? (-event.wheelDelta) : event.detail);
    camera.position.z -= 0.1/120*d;       
    camera.position.z = Math.max( Math.min(camera.position.z, 0.95) , 0.001);
}

function animate() {

    renderer.render( scene, camera );    
        
    requestAnimationFrame( animate );

    stats.update();
    
//    controls.update();
}

function updateLink(movie) {
    
    let url = "http://www.imdb.com/title/"+movie.movieID+"/";
    $( "#movie_info" ).text(movie.title);
    $( "#movie_info" ).attr("href", url);
    
}

$( "#movie_list" ).change(function() {
    $( "select option:selected" ).each(function() {
        let idx =  $(this).attr("value");
        let mvi = instances[idx];
        camera.position.set(mvi.x, mvi.y, mvi.z);
        updateLink(mvi);
    });
});

function onKeyDown ( event ) {

    switch( event.keyCode ) {

        case 82: /*R*/	camera.position.set( 0, 0, 0 );break;
        case 112: /*F1*/ window.open("https://github.com/Coni63/coni63.github.io",'_blank');break;
    }

}


init();
animate();