if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var camera, scene, renderer, controls, raycaster, container;
var geometry, material, mesh;
var instances = {}; // store obj -> movie
var meshes = [];
var octree; 
var mydata = JSON.parse(data);
var ambientLight;
var lights = [];
var max_movie = 250;

var raycaster;
var mouse = new THREE.Vector2();
var intersected;
var frustum = new THREE.Frustum();
var cameraViewProjectionMatrix = new THREE.Matrix4();

var params = {
    color : '#ff0000',
    scale : 1,
    max_points: 250,
    ambiente_color : '#999999',
    spot1_color: '#ffffff',
    spot2_color: '#11E8BB',
    spot3_color: '#8200C9',
    color_dropdown: '#00ff00',
    max_depth : 100,
    display_fps : true,
    text_depth : 7
};

var textlabels = [];

init();
animate();

function init() {

    container = document.getElementById("container");

    // camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, params.max_depth );
    camera.position.set( 0, 0, 40 );

    // scene
    scene = new THREE.Scene();

    // octree for raycasting
    raycaster = new THREE.Raycaster();

    // mesh
    geometry = new THREE.IcosahedronBufferGeometry( 0.1*params.scale, 0 );
    for(var i=0; i<max_movie ; i++){
        var movie = new Movie( mydata.movie_title[i], mydata.X[i], mydata.Y[i], mydata.Z[i]);
        var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading : true }) );
            mesh.position.set( movie.x, movie.y, movie.z );
            mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        instances[ mesh.uuid ] = movie;
        meshes.push(mesh);
        
        var text = new Textbox();
            text.setHTML(movie.title);
            text.setParent(mesh);
            textlabels.push(text);
        container.appendChild(text.element);
    }
    
    // lights
    ambientLight = new THREE.AmbientLight(params.ambiente_color);
    scene.add(ambientLight);

    lights[0] = new THREE.DirectionalLight( params.spot1_color, 1 );
    lights[0].position.set( 30, 0, 0 );
    lights[1] = new THREE.DirectionalLight( params.spot2_color, 1 );
    lights[1].position.set( 20, 30, 15 );
    lights[2] = new THREE.DirectionalLight( params.spot3_color, 1 );
    lights[2].position.set( -20, -30, 15 );
    scene.add( lights[0] );
    scene.add( lights[1] );
    scene.add( lights[2] );


    // dat.gui
    var gui = new dat.GUI();
    
    var color = gui.addFolder('Colors');
    color.addColor( params, 'color' );
    color.addColor( params, 'color_dropdown' );
    color.addColor( params, 'ambiente_color' ).onChange( function( value ) {
        ambientLight.color = new THREE.Color( value );
    });
    color.addColor( params, 'spot1_color' ).onChange( function( value ) {
        lights[0].color = new THREE.Color( value );
    });
    color.addColor( params, 'spot2_color' ).onChange( function( value ) {
        lights[1].color = new THREE.Color( value );
    });
    color.addColor( params, 'spot3_color' ).onChange( function( value ) {
        lights[2].color = new THREE.Color( value );
    });
    color.close();
    
    var rendering = gui.addFolder('Rendering');
    rendering.add( params, 'scale', 0.1, 10 ).step( 0.005 ).onChange( function( value ) {
        params.scale = value;
        for (var i = 0; i < scene.children.length; i++){
            if (scene.children[i].type == "Mesh"){
                scene.children[i].scale.x = params.scale;
                scene.children[i].scale.y = params.scale;
                scene.children[i].scale.z = params.scale;
            }
        }
    } );
    
    rendering.add( params, 'max_points', 1, max_movie ).step( 1 ).onChange( function( value ) {
        regenerate();
    } );
    
    rendering.add( params, 'max_depth', 1, 100 ).step( 1 ).onChange( function( value ) {
        camera.far = value;
        camera.updateProjectionMatrix();
    } );
    
    rendering.add( params, 'text_depth', 1, 100 ).step( 1 );
    
    rendering.add( params, 'display_fps').onChange(function( value ){
        stats.dom.hidden = !value;
    });
    
    rendering.open();
        
    var obj = { 'Regenerate' : function(){ 
        regenerate();
    }};
    gui.add(obj,'Regenerate');

    gui.open();

    // stats
    stats = new Stats();
    container.appendChild( stats.dom );

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    container.appendChild( renderer.domElement );
    
    regenerate();

    // mouse control
    controls = new THREE.OrbitControls( camera, domElement = renderer.domElement, localElement=renderer.domElement );
        
    // events
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'click', onClick, false );
    window.addEventListener( 'mousemove', onDocumentMouseMove, false );

    document.addEventListener( 'keydown', onKeyDown, false );
}

function animate() {

    requestAnimationFrame( animate );
    render();
    controls.update();
    stats.update();

}

function render(){
    
    camera.updateMatrixWorld(); // make sure the camera matrix is updated
    camera.matrixWorldInverse.getInverse( camera.matrixWorld );
    cameraViewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    frustum.setFromMatrix( cameraViewProjectionMatrix );

    for(var i=0; i<textlabels.length; i++) {
        if ( frustum.intersectsObject( meshes[i] ) ){
            if ( meshes[i].position.distanceTo( camera.position ) < params.text_depth ) {
                textlabels[i].show();
                textlabels[i].updatePosition(camera);
                continue;
            }
        }
        textlabels[i].hide();
    }
        
    renderer.render( scene, camera );
    octree.update();
}

function onClick( event ) {

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    if (intersected) controls.target.set(intersected.position.x, intersected.position.y, intersected.position.z);

}

function onWindowResize( event ) {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var octreeObjects = octree.search( raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction );
    var intersections = raycaster.intersectOctreeObjects( octreeObjects );

    if ( intersections.length > 0 ) {

        if ( intersected != intersections[ 0 ].object ) {

            if ( intersected ) intersected.material.color.set( 0xffffff );

            intersected = intersections[ 0 ].object;
            intersected.material.color.set( params.color );
            selected_movie = instances[ intersected.uuid ];
            $("#info").text(selected_movie.title);
        }

        document.body.style.cursor = 'pointer';

    }
    else if ( intersected ) {

        intersected.material.color.set( 0xffffff );
        intersected = null;
        $("#info").text("");
        document.body.style.cursor = 'auto';

    } else {
        $("#info").text("");
    }

}

function regenerate(){
    for (var i = 0; i < scene.children.length; i++){
        if (scene.children[i].type == "Mesh"){
            scene.remove(scene.children[i]);
        }
    }
    
    $("#movie_list").find('option').remove().end();
    
    octree = new THREE.Octree( {
        //scene: scene,
        undeferred: false,
        depthMax: 5,
        objectsThreshold: 8,
        overlapPct: 0.15
    } );
    
    for (var i=0; i< params.max_points ; i++){
        scene.add(meshes[i]);
        octree.add(meshes[i], { useFaces: false } );
        $("#movie_list").append('<option value='+meshes[i].uuid+'>'+ instances[meshes[i].uuid].title + '</option>');
    }
}

function onKeyDown ( event ) {

    switch( event.keyCode ) {

        case 82: /*R*/	camera.position.set( 0, 0, 40 ); break;
        case 71: /*R*/	regenerate(); break;

    }

}

$( "#movie_list" ).change(function() {
  $( "select option:selected" ).each(function() {
     let uuid_selected =  $(this).attr("value");
      for (var i = 0; i < scene.children.length; i++){
        if (scene.children[i].uuid == uuid_selected){
            target_pos = scene.children[i].position;
            console.log(target_pos);
            controls.target.set(target_pos.x, target_pos.y, target_pos.z);
            camera.position.set(target_pos.x+5, target_pos.y, target_pos.z);
            controls.update();
            scene.children[i].material.color.set( params.color_dropdown );
            $("#info").text($(this).text());
        }
    }
  });
});

