function Movie(){
    this.movieID = "000";
    this.x = Math.random()-0.5;
    this.y = Math.random()-0.5;
    this.z = Math.random()-0.5;
    this.links = [];
};

Movie.prototype.create_link = function(other_movie){
    this.links.push(other_movie);
    other_movie.create_link(this);
    console.log("link created");
}