if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var camera, scene, renderer, controls, raycaster;
var geometry, material, mesh;
var instances = {};
var octree; 
var mydata = JSON.parse(data);

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersected;

init();
animate();

function init() {

    var container = document.getElementById("container");
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor(0xffffff, 0.1);

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 0, 40 );

    scene = new THREE.Scene();
    stats = new Stats();
    controls = new THREE.OrbitControls( camera );
    raycaster = new THREE.Raycaster();
    
    octree = new THREE.Octree( {
        //scene: scene,
        undeferred: false,
        depthMax: 5,
        objectsThreshold: 8,
        overlapPct: 0.15
    } );
    
    // creation of particles for movies
    geometry = new THREE.SphereBufferGeometry( 0.1, 32, 32 );
    for(var i=0; i<250; i++){  //max 4918
        var movie = new Movie( mydata.movie_title[i], mydata.X[i], mydata.Y[i], mydata.Z[i]);
        var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading : true }) );
            mesh.position.set( movie.x, movie.y, movie.z );
            mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        
        octree.add( mesh, { useFaces: false } );
        instances[ mesh.uuid ] = movie;
        scene.add(mesh);
    }
    
    console.log(octree);
    
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
    
    container.appendChild( renderer.domElement );
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'click', onClick, false );
    window.addEventListener( 'mousemove', onDocumentMouseMove, false );
}

function animate() {

    requestAnimationFrame( animate );
    controls.update();
    render();
    stats.update();

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

function render(){
    renderer.render( scene, camera );
    octree.update();
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
            intersected.material.color.set( 0xff0000 );
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