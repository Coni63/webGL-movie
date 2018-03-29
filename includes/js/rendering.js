if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var camera, scene, renderer, controls, raycaster, container;
var geometry, material, mesh, ambientLight;
var intersected;
var octree = new THREE.Octree( {
    undeferred: false,
    depthMax: 5,
    objectsThreshold: 8,
    overlapPct: 0.15
} );
var mouse = new THREE.Vector2();
var frustum = new THREE.Frustum();
var cameraViewProjectionMatrix = new THREE.Matrix4();

var lights = [];
var meshes = [];
var text_container;

var max_movie = 9150;
var base_radius = 0.05;
var params = {
    color : '#ff0000',
    scale : 1,
    max_points: 2500,
    ambiente_color : '#999999',
    spot1_color: '#ffffff',
    spot2_color: '#11E8BB',
    spot3_color: '#8200C9',
    color_dropdown: '#00ff00',
    max_depth : 60,
    display_fps : true,
    text_depth : 4,
    font_close : 15,
    font_far : 6
};

// instantiate a loader
//var loader = new THREE.JSONLoader();
//var loader = new THREE.ObjectLoader();
//var loader = new THREE.FileLoader();
//    loader.load(
//        // resource URL
//        'datas/prod_dataset2.json',
//
//        // onLoad callback
//        function ( data ) {
//            console.log( 'loaded' );
//            mydata = JSON.parse(data);
//            console.log(mydata);
//        },
//
//        // onProgress callback
//        function ( xhr ) {
//            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
//        },
//
//        // onError callback
//        function( err ) {
//            console.log( 'An error happened' );
//        }
//    );
//
//var object = loader.parse( mydata );

//var mydata;
//$.getJSON( "datas/new_model50.json" , function( result ){
//    mydata = result;
//});

var mydata = JSON.parse(data);

init();
animate();

function init() {
    // get Elements
    container = document.getElementById("container");
    text_container = document.getElementById("textbox_container");
    
    // camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, params.max_depth );
    camera.position.set( 0, 0, 25 );

    // scene
    scene = new THREE.Scene();

    // octree for raycasting
    raycaster = new THREE.Raycaster();

    // mesh
    geometry = new THREE.IcosahedronBufferGeometry( base_radius*params.scale, 0 );
//    geometry = new THREE.TetrahedronBufferGeometry( base_radius*params.scale );
    for(var i=0; i < max_movie ; i++){
//        var movie = new Movie( mydata.movie_title[i], mydata.X[i], mydata.Y[i], mydata.Z[i]);
        var movie = new Movie( mydata.primaryTitle[i], mydata.tconst[i], mydata.X[i], mydata.Y[i], mydata.Z[i]);
        var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading : true }) );
            mesh.position.set( movie.x, movie.y, movie.z );
            mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
            mesh.visible = false;
        mesh.info = movie;
        
        var text = new Textbox();
            text.setHTML(movie.title);
            text.setParent(mesh);
        mesh.textbox = text;
        
        octree.add(mesh, { useFaces: false } );
        meshes.push(mesh);
        scene.add(mesh);
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
    
    var font_info = gui.addFolder('Text');
    font_info.add( params, 'text_depth' , 1, params.max_depth).step( 1 );
    font_info.add( params, 'font_close' , 5, 30).step( 1 );
    font_info.add( params, 'font_far' , 1, 10).step( 1 );
    font_info.close();
    
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
    
//    rendering.add( params, 'text_depth', 1, 100 ).step( 1 );
    
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
    controls.update();  // update mouse moves
    stats.update();     // display stats

}

function render(){
    
    //Live generation of Textboxes
    text_container.innerHTML = "";
    
    camera.updateMatrixWorld(); // make sure the camera matrix is updatedr
    camera.matrixWorldInverse.getInverse( camera.matrixWorld );
    cameraViewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    frustum.setFromMatrix( cameraViewProjectionMatrix );

    for (var i=0; i<meshes.length; i++) {
        if (!meshes[i].visible) continue;
        
        if (!frustum.intersectsObject( meshes[i] )) continue;
        
        let d = meshes[i].position.distanceTo( camera.position );
        if ( d <= params.text_depth ) {
            meshes[i].textbox.updatePosition(camera, d);
            text_container.appendChild(meshes[i].textbox.element);
        }
    }
    
    // rendering of the scene
    renderer.render( scene, camera );
    octree.update();
    
}

function onClick( event ) {

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    if (intersected) controls.target.set(intersected.position.x, intersected.position.y, intersected.position.z);
    
    updateLink(intersected.info);

}

function onWindowResize( event ) {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {
    // change color on the selected item with mouse. Use Raycaster and Octree structure for performances.
    
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
            $("#info").text(intersected.info.title);
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
    // regenerate dropdown list with only visible points
    $("#movie_list").find('option').remove().end();
    
    for (var i=0; i< meshes.length ; i++){
        meshes[i].visible = false;
    }
    
    for (var i=0; i< params.max_points ; i++){
        meshes[i].visible = true;
        $("#movie_list").append('<option value='+meshes[i].uuid+'>'+ meshes[i].info.title + '</option>');
    } 
    
    var sel = $('#movie_list');
//    var selected = sel.val(); // cache selected value, before reordering
    var opts_list = sel.find('option');
        opts_list.sort(function(a, b) { return $(a).text() > $(b).text() ? 1 : -1; });
    sel.html('').append(opts_list);
//    sel.val(selected); // set cached selected value
    $("#movie_list").val($("#movie_list option:first").val());

}

function onKeyDown ( event ) {

    switch( event.keyCode ) {

        case 82: /*R*/	camera.position.set( 0, 0, 25 ); controls.target.set( 0, 0, 0 ); break;
        case 71: /*G*/	regenerate(); break;
        case 72: /*H*/   window.open("https://github.com/Coni63/coni63.github.io/blob/master/README.md",'_blank');
        case 112: /*F1*/ window.open("https://github.com/Coni63/coni63.github.io",'_blank');
    }

}

function updateLink(movie) {
    
    let url = "http://www.imdb.com/title/"+movie.movieID+"/";
    $( "#movie_info" ).text(movie.title);
    $( "#movie_info" ).attr("href", url);
    
}

$( "#movie_list" ).change(function() {
  $( "select option:selected" ).each(function() {
     let uuid_selected =  $(this).attr("value");
      for (var i = 0; i < scene.children.length; i++){
        if (scene.children[i].uuid == uuid_selected){
            target_pos = scene.children[i].position;
            controls.target.set(target_pos.x, target_pos.y, target_pos.z);
            camera.position.set(target_pos.x+5, target_pos.y, target_pos.z);
            controls.update();
            scene.children[i].material.color.set( params.color_dropdown );
            $("#info").text($(this).text());
            updateLink(scene.children[i].info);
        }
    }
  });
});
