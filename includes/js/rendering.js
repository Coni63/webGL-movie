if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var camera, scene, renderer, controls, raycaster, container;
var geometry, material, mesh;
var instances = {}; // store obj -> movie
var meshes = [];
var octree; 
var mydata = JSON.parse(data);

var raycaster; // = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersected;

var params = {
    color : '#ff0000',
    scale : 1,
    max_points: 250
};

init();
animate();

function init() {

    container = document.getElementById("container");

    // camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 0, 40 );

    // scene
    scene = new THREE.Scene();

    // octree for raycasting
    raycaster = new THREE.Raycaster();

    // mesh
    geometry = new THREE.IcosahedronBufferGeometry( 0.1*params.scale, 0 );
    for(var i=0; i<4918 ; i++){  //max 4918
        var movie = new Movie( mydata.movie_title[i], mydata.X[i], mydata.Y[i], mydata.Z[i]);
        var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading : true }) );
            mesh.position.set( movie.x, movie.y, movie.z );
            mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        instances[ mesh.uuid ] = movie;
        meshes.push(mesh);
    }
    
    regenerate();

    // lights
    var ambientLight = new THREE.AmbientLight(0x999999 );
    scene.add(ambientLight);

    var lights = [];
    lights[0] = new THREE.DirectionalLight( 0xffffff, 1 );
    lights[0].position.set( 30, 0, 0 );
    lights[1] = new THREE.DirectionalLight( 0x11E8BB, 1 );
    lights[1].position.set( 20, 30, 15 );
    lights[2] = new THREE.DirectionalLight( 0x8200C9, 1 );
    lights[2].position.set( -20, -30, 15 );
    scene.add( lights[0] );
    scene.add( lights[1] );
    scene.add( lights[2] );


    // dat.gui
    var gui = new dat.GUI();

    gui.addColor( params, 'color' ) //.onChange( function( value ) {console.log(value);} );

    gui.add( params, 'scale', 0.1, 10 ).step( 0.005 ).onChange( function( value ) {
        params.scale = value;
        for (var i = 0; i < scene.children.length; i++){
            if (scene.children[i].type == "Mesh"){
                scene.children[i].scale.x = params.scale;
                scene.children[i].scale.y = params.scale;
                scene.children[i].scale.z = params.scale;
            }
        }
    } );

    gui.add( params, 'max_points', 1, 4918 ).step( 1 ).onChange( function( value ) {
        regenerate();
    } );
    
    var obj = { 'Regenerate' : function(){ 
        regenerate();
    }};
    gui.add(obj,'Regenerate');

//    gui.add( helper, 'visible' ).name( 'Show Flow Map');

    gui.open();


    // stats
    stats = new Stats();
    container.appendChild( stats.dom );

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.setClearColor(0xffffff, 0.1);
    container.appendChild( renderer.domElement );

    // mouse control
    controls = new THREE.OrbitControls( camera, renderer.domElement  );

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
        $("#info").text("Select a Movie");
        document.body.style.cursor = 'auto';

    } else {
        $("#info").text("Select a Movie");
    }

}

function regenerate(){
    for (var i = 0; i < scene.children.length; i++){
        if (scene.children[i].type == "Mesh"){
            scene.remove(scene.children[i]);
        }
    }
    
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
    }
}

function onKeyDown ( event ) {

    switch( event.keyCode ) {

        case 82: /*R*/	camera.position.set( 0, 0, 40 ); break;
        case 71: /*R*/	regenerate(); break;

    }

}