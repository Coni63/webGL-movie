# Movie Explorer

This project use Machine Learning Algorithms to be represent, in a 3D space, movies based on similarities. From a Dataset provided by [IMDb](https://www.imdb.com/interfaces/), a subset of movie has been extracted. Datas have been completed/improved by using [OMDb API](http://www.omdbapi.com/). After a phase a cleanup/preparation, the tSNE model has been used to represent movies in a smaller dimension. The rendering has been done in JavaScript using WebGL with three.js.

Website is available at [https://coni63.github.io/](https://coni63.github.io/)

Information about the Modelization is available in the [MODEL.md](https://github.com/Coni63/coni63.github.io/blob/master/MODEL.md)

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

On mouse over a particle, the title with be displayed on top of the screen. In addition, all movies at a distance given to the camera will have the name close to it. The depth of rendering can be adjusted.

### Movements

You can move the camera with :

* left-click : rotation of the camera around a point ( initial position is (0, 0, 0) )
* right-click : Pan the camera
* mouse-wheel : zoom (maintain the click and mouse the mouse also work)
* r : reset the camera to the initial position
* g : re-generate the rendering (only in case of bug)
* h : open the Help ( this page, so you probably already know :) )

### Options

Several options are possibles in the control panel. You can change :

* color : Color of the point onMouseOver
* color_dropdown : Color of the point on DropDown List
* ambiente_color : Color of the ambient light
* spotX_color : Color of both directionnal lights
* max_points : Number of movies/particle displayed (decrease performances)
* text_depth : max depth where title is displayed (decrease performances a lot)  
* font_close/far : size of the font close to camera and at the limit of the frustum
* scale : Size of all particles
* max_depth : Depth of the frustum
* display_fps : hide/show the Stats Panel
* regenerate : same as pressing "g"


## Authors

* **Nicolas MINE** - *Initial work* - [Coni63](https://github.com/Coni63)


## Acknowledgments

Some pieces of codes comes from som answers on StackOverflow forum. Most usefull ones will be displayed below :

## To be done

This project is still under constructions with a lot of features to include. Feel free to create a Pull request, let me know for improvements possible or issues. As mentionned above, a new dataset from IMDB will be used to create a more relevant clustering. 

## Possible issues

##### Important lags

You may experience lags for multiple reasons :

1. The number of points displayed is quite important for your computer (WebGL performances are lower than a game). Try to reduce the option "max_points".

2. The depth of Text is too big. Every label are generaed using a floating <div>. At every frame, all position are recomputed and this is intensive if you display title of a lot of movies.

3. You don't have the "Hardware Activation"'s option activated. If you have a GPU and you see in the task manager that the use is 0% for your browser, that means this option is disabled. To activate it follow the steps based on your Browser on [this link](https://wevideo.zendesk.com/hc/en-us/articles/225259448-How-to-enable-WebGL)

## Known Issues

* This website doesn't work on IE11 as it doesn't support ES6 yet.
