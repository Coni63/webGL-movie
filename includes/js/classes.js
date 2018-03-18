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
}