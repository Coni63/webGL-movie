/* Class Movie */

function Movie (title, id, x, y, z){
    this.movieID = id;
    this.title = title;
    this.x = x;
    this.y = y;
    this.z = z;
}

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


/* Text above points */ 

function Textbox() {
    this.element = document.createElement('div');
    this.element.className = 'text-label';
    this.element.style.position = 'absolute';
    this.element.style.width = 100;
    this.element.style.height = 100;
    this.element.innerHTML = "";
    this.element.style.top = -1000;
    this.element.style.left = -1000;
    this.element.style.fontSize = "10px";
}
    
Textbox.prototype.setParent = function(threejsobj) {
    this.parent = threejsobj;
    this.position = threejsobj.position;
}

Textbox.prototype.updatePosition = function(cam, dist) {        
    var vector = new THREE.Vector3();
    this.parent.localToWorld( vector );

    vector.project( camera );

    vector.x = (+vector.x + 1)/2 * window.innerWidth;
    vector.y = (-vector.y + 1)/2 * window.innerHeight;
    this.element.style.left = vector.x + 'px';
    this.element.style.top = vector.y + 'px';
    this.element.style.fontSize = 10 + "px";
    this.update_fontsize(dist);
}

Textbox.prototype.update_fontsize = function( dist ){
    let alpha = (params.font_close - params.font_far) / params.text_depth;
    let s = - alpha * dist + params.font_close + alpha;
    this.element.style.fontSize = s + "px";
}

Textbox.prototype.setHTML = function(txt){
    this.element.innerHTML = txt;
}

Textbox.prototype.hide = function(){
    this.element.style.display = "none";
}

Textbox.prototype.show = function(){
    this.element.style.display = "block";
}


function TextboxV2(text) {
    this.element = document.createElement('div');
    this.element.className = 'text-label';
    this.element.style.position = 'absolute';
    this.element.style.width = 100;
    this.element.style.height = 100;
    this.element.innerHTML = text;
    this.element.style.top = -1000;
    this.element.style.left = -1000;
    this.element.style.fontSize = "10px";
}
    
TextboxV2.prototype.updatePosition = function(cam, point) {     
    var vector = point.clone();
        vector.project(camera);

    vector.x = (+vector.x + 1)/2 * window.innerWidth;
    vector.y = (-vector.y + 1)/2 * window.innerHeight;
    this.element.style.left = vector.x + 'px';
    this.element.style.top = vector.y + 'px';
}