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

function init() {
    
    var mydata = JSON.parse(data);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 3 );    
    
    clock = new THREE.Clock();
    clock.start()

    light1 = new THREE.DirectionalLight( 0xffff00 );
    light1.position.set( 2, 0, -1 );
    light1.intensity = 0.5;
    
    light2 = new THREE.DirectionalLight( 0xff0000 );
    light2.position.set( -1, 0.86*2, -1 );
    light2.intensity = 0.5;
    
    light3 = new THREE.DirectionalLight( 0x00ff00 );
    light3.position.set( -1, -0.86*2, -1 );
    light3.intensity = 0.5;
    
    light4 = new THREE.DirectionalLight( 0xff00ff );
    light4.position.set( 0, 0, 2 );
    light4.intensity = 0.5;
    
    light5 = new THREE.AmbientLight( 0xaaaaaa );
    
    scene.add( light1 );
    scene.add( light2 );
    scene.add( light3 );
    scene.add( light4 );
    scene.add( light5 );
    
    var geometry = new THREE.SphereGeometry( 0.999, 128, 128 );
    var material  = new THREE.MeshPhongMaterial()
        material.color = new THREE.Color(params.sphere_color);
    sphere = new THREE.Mesh(geometry, material);      
    scene.add( sphere );
    
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
    
    // dat.gui
    var gui = new dat.GUI();
    
    var color = gui.addFolder('Colors');
    color.addColor( params, 'sphere_color' ).onChange( function( value ) {
        sphere.material.color = new THREE.Color( value );
    });
    color.addColor( params, 'ambiente_color' ).onChange( function( value ) {
        ambientLight.color = new THREE.Color( value );
    });
    color.addColor( params, 'spot1_color' ).onChange( function( value ) {
        light1.color = new THREE.Color( value );
    });
    color.addColor( params, 'spot2_color' ).onChange( function( value ) {
        light2.color = new THREE.Color( value );
    });
    color.addColor( params, 'spot3_color' ).onChange( function( value ) {
        light3.color = new THREE.Color( value );
    });
    color.addColor( params, 'spot4_color' ).onChange( function( value ) {
        light4.color = new THREE.Color( value );
    });
    color.close();
        
    gui.add( params, 'display_fps').onChange(function( value ){
        stats.dom.hidden = !value;
    });
    
    gui.add( params, 'display_sphere').onChange(function( value ){
        sphere.visible = value;
    });
        

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
//    renderer.setClearColor( 0xC2DFFF, 1);

    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    mouse = new THREE.Vector2();
    
    // stats
    stats = new Stats();
    container.appendChild( stats.dom );
    
    // mouse control
    controls = new THREE.OrbitControls( camera, domElement = renderer.domElement, localElement=renderer.domElement );
    controls.minDistance = 1.05
    camera.position.set( 0, 0, -1.8 );
    controls.noPan = true;
    
    // octree for raycasting
    raycaster = new THREE.Raycaster();
    raycaster.far = 1
    
    window.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'keydown', onKeyDown, false );
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


function animate() {

    renderer.render( scene, camera );    
        
    requestAnimationFrame( animate );

    stats.update();
    
    controls.update();
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

        case 82: /*R*/	camera.position.set( 0, 0, -1.8 );break;
        case 112: /*F1*/ window.open("https://github.com/Coni63/coni63.github.io",'_blank');break;
    }

}


init();
animate();