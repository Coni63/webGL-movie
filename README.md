# Movie Explorer

This project use Machine Learning Algorithms to be position in 3D movies in space (the more similar 2 movies are, the closer they are in space). Positions are determined by using a TSNE on the IMDB_5000 dataset. Rendering is done in WebGL with the library Three.js. A new Clustering will be done soon with a new and more complete dataset.

Website is available at [https://coni63.github.io/](https://coni63.github.io/)

![rendering](https://github.com/Coni63/coni63.github.io/blob/master/includes/img/render1.png)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

No prerequisites are needed, you can download the repository or clone it.

```
git clone https://github.com/Coni63/coni63.github.io.git
```

### Installing

No installation is required. All libraries are included in "/includes/" folder


## How to use

You can explore the World of Movie manually or you can select a movie in the dropdown list. The dropdown list evolves based on the number of points displayed (the more you display, the slower the rendering is ... obviously :) ) 

On mouse over a mesh, the title with be displayed on top of the screen in addition of the text if you display it.

### Movements

You can move the camera with :

* left-click : rotation of the camera around a point ( initial position is (0, 0, 0) )
* right-click : Pan the camera
* mouse-wheel : zoom (maintain the click and mouse the mouse also work)
* r : reset the camera to the initial position
* g : re-generate the rendering (only in case of bug)

### Options

Several options are possibles in the control panel. You can change :

* color : Color of the point onMouseOver
* color_dropdown : Color of the point on DropDown List
* ambiente_color : Color of the ambient light
* spotX_color : Color of both directionnal lights
* scale : Color of both meshes
* max_depth : Depth of the frustum
* text_depth : max depth where title is displayed (decrease performances a lot)  
* display_fps : hide/show the Stats Panel
* regenerate : same as pressing g


## Authors

* **Nicolas MINE** - *Initial work* - [Coni63](https://github.com/Coni63)


## Acknowledgments

Some pieces of codes comes from som answers on StackOverflow forum. Most usefull ones will be displayed below :

## To be done

This project is still under constructions with a lot of features to include. Feel free to create a Pull request, let me know for improvements possible or issues. As mentionned above, a new dataset from IMDB will be used to create a more relevant clustering.