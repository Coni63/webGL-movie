/* Class Movie */

function Movie(title, x, y, z){
    this.movieID = title;
    this.title = title;
    this.x = x;
    this.y = y;
    this.z = z;
    this.links = [];
};

Movie.prototype.create_link = function(other_movie){
    this.links.push(other_movie);
    other_movie.create_link(this);
    console.log("link created");
};

/* Text above points */ 

var Textbox = class {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'text-label';
        this.element.style.position = 'absolute';
        this.element.style.width = 100;
        this.element.style.height = 100;
        this.element.innerHTML = "hi there!";
        this.element.style.top = -1000;
        this.element.style.left = -1000;
    }
    
    setParent(threejsobj) {
        this.parent = threejsobj;
        this.position = threejsobj.position;
    }

    updatePosition(cam) {        
        var vector = new THREE.Vector3();
        this.parent.localToWorld( vector );

        vector.project( camera );

        vector.x = (+vector.x + 1)/2 * window.innerWidth;
        vector.y = (-vector.y + 1)/2 * window.innerHeight;
        this.element.style.left = vector.x + 'px';
        this.element.style.top = vector.y + 'px';
    }

    setHTML(txt){
        this.element.innerHTML = txt;
    }
    
    hide(){
        this.element.style.display = "none";
    }
    
    show(){
        this.element.style.display = "block";
    }
    
}