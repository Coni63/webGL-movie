# Modelisation

## Which datas (Notebook [first\_filtering.ipynb](https://github.com/Coni63/coni63.github.io/blob/master/model/first_filtering.ipynb)) ?
The initial dataset comes from [IMDb](https://www.imdb.com/interfaces/). It provides datas about all the movies existing on their website. Initially we have :

* 4.883.669 movies/series/videos/...
* 27.499.828 links between actors and movies
* 8.497.089 actors with some informations (name, profession, birth/death)
* Some extras-infos about movies (Ratings, crew, episodes in case of series)

On this dataset, a first filtering has been done to keep only movies and remove also movies for adults. 
A merge when datas were unique was also performed (for example link the rating to every movies). 
For actors and crew, I only kept the ones who played in remaining movies.
This reduced a lot the dataset size from 2 go to 170 mo but we still have :

* 200.691 movies with their rating
* 1.817.799 links between actors and movies
* 287.018 actors with some informations (name, profession, birth/death)


## Cleanup/Preparation

### Preparation of Actors (Notebook [Exploration.ipynb](https://github.com/Coni63/coni63.github.io/blob/master/model/Exploration.ipynb))
For every movies we have 1 to N actors. With this quantity of actors, I cannot just apply a Bag-Of-Words by movies. The result would be too big (200.691 * 287.018). The idea was to do first a clustering of actors. 
We know in which movies they played, so the rating/number of Votes on every movies was used. In addition, we have their original profession. There is not a lot of different professions but some were identicals (for example actor and actress). A quick merge has been applied to reduced it a bit more. 
The profession also gives an information about the sex of the actor as an additionnal feature.
BirthDate and DeathDate have been dropped as we have to much missing information (< 2%). 

Cluster has been done in 2 parts. First one was to use a Manifold only on professions (categorical data) with the Hamming Distance to reduce dimension to 2 and then being able to use Euclidean Distance with the Kmeans Clustering Algorithm. This provides 10 clusters of differents actors. 
Prior to do this clustering, a reduction has been performed manually to avoid memory error. I removed all actors which never played in a movie with more than 100 votes or played only 1 time. This reduced the number of actor to 12k.

### Preparation of Writer / Director
The same steps have been followed with Writer/Directors but there is no work of profession's done as we can assume that they are legitimate to do so. You never start Director. The same reduction has been performed with writter and Director to remove the only with only 1 movies or always less than 500 likes.
That means respectively 14.875 writers and 15.489 Directors.

### Go back to movies (Notebook [Preparation.ipynb](https://github.com/Coni63/coni63.github.io/blob/master/model/Preparation.ipynb))
Now we have clusters for every group of Actors/Directors/Writer. They have been pushed back to the movies dataset as a Bag-of-Words feature (so 10+8+8 new categoricals features). Movies without any of these actor/director/writter got dropped resulting to 86.937 movies.
To finish, a classical preparation work has been done to take in account for example the type of movies, remove outlier durations... Then a filtering has been applied to remove movies with not a lot of votes and a bad score. This allowed to reduce the dataset to 40.499 movies. At this stage we have 52 features per movies.


## Completion (Notebook [Extraction.ipynb](https://github.com/Coni63/coni63.github.io/blob/master/model/Extraction.ipynb) & [Concatenation.ipynb](https://github.com/Coni63/coni63.github.io/blob/master/model/Concatenation.ipynb))
On those 40.499 movies, we can easily have additionnal information by using the [OMDb API](http://www.omdbapi.com/). With a suscription of 1$/month, we can query datas of 100.000 movies per day. This has been done on those 40.499 movies to get informations like :

* number of nomination/win for Oscars/Golden Globes/BAFTA/other
* Box Office for some movies
* Country of Origin
* Language available
* Additional Score Metacritic/Rotten Tomatoes
* Recommanded Age
* Website if there is one
* A summary of the movie Story

Thoses datas were extracted with Regular Expression and completed with different values :

* Website : grouped by production (Warner, Fox, Paramount, ...) and One-Hot Encoded.
* Box Office: completed by 0 is we don't have it.
* Country Of Origin : Delete movies not produced in the top 20 and then One-Hot Endoded
* Language : Removed movies not available in French or English.
* Missing Duration : filled by average (there is only a few hundreth). As we have the data from both dataset, we can also compare them for strange values (like 300+ minutes).

### Handling Summaries
On OMDb, we have access to the summary of the movie. To categorize them, the Term Frequency-Inverse Document Frequency Matrix (TF-IDF) with Lemmatization has been set-up and the Non-negative Matrix Factorization algorithm applied on it to extract 20 differents topics from a summary.

After a join of both dataset, we have a fully numeric dataset of 115 features and 27.406 movies. A final filtering for memory reason has been performed to remove movies produced before 1995. Leading to 9150 movies.

## Models (Notebook [Model.ipynb](https://github.com/Coni63/coni63.github.io/blob/master/model/Model.ipynb))

### Global Preparation
#### Scaling
In our dataset we have lot of values with a large bandwidth. On them a log scaling has been applied to avoir having huge differences between for example movies with 100k and 200k Votes. This has been applied on :

* Number of Votes
* Number of every Nominations/Win (for example, we cannot say that a movie with 2 oscars is twice better than a movie with only 1).
* Box Office

Then Scaler have been added on all numerical features. Depending on the type of feature :

* Borned Values have a MinMax Scaler applied (for example Rating)
* Non-borned Values have a Standart Scaler applied (for example number of Votes)
* Categorical Values don't have any scaling applied
* Buckets from the NMF has been normalized by row then a MinMaxScaling has been applied by column

#### Generating Distances Matrices
As we have differents features types and they all don't have the same importance. For example, the style of movie is more important that the Box Office as we have lot of missing data set to 0. 
As a result, I built for every types of data a distance matrix using :

* Hamming Distances for Categorical Datas
* Euclidean Distance for numerical values
* Braycurtis Distance for the result of NMF
* Minkowsky Distance with p = 2**0.5 to reduce the impact of a lot of nomination/wins but still apply a distance to movie with nothing.

This provides 10 distance matrices. They have been Normalized to all have the minimum at 0 and maximum a 1. To finish they have been summed with a weight per importance as follow :

> Final Distance =  1.5 * [ranking] + 0.3 * [year, time, BO] + 1.3 * [movie style] + 0.3 * [actors] + 0.2 * [director] + 0.2 * [writer] + 0.8 * [Topic] + 0.8 * [country] + 1 * [distribution] + 0.2 * [win/nomination] + 0.5 * [rated]

### Model 1

The first Model used is the T-distributed Stochastic Neighbor Embedding (TSNE) in 3D. It has been created with multiple perplexity and Learning Rate. The best Model in term of KL-Divergence and Perplexity (to keep a global structure) has been selected. The parameter is:

* Perplexity : 100
* Learning-Rate : 100 

Then a 3D visualisation in the browser is available usign WebGL (with Three.js). All Sphere represent a movie and the closest movies, are the most similar ones.

### Model 2

The second model use the same Distance Matrix but use the DOubly Stochastic Neighbor Embedding on a Sphere (DOSNES) implemented by myself and available [here](https://github.com/Coni63/DOSNES). The objective of this algorithm is to embed datas on a sphere. A representation of the result is available on the v2 of [this website](https://coni63.github.io/v2/index.html). This second model which doesn't use 3D Mesh is clearly lighter in term of Graphic memory so all movies are displayed by default.

### Model 3

The result of the DOSNES is not as good as expected. It properly split good/bad movies but locally, distances are not as good as what TSNE is doing. As a result, the last model it the TSNE in 2D but then projected on a sphere by using stereographic projection. The reuslt is also available as the 3rd version of [this website](https://coni63.github.io/v3/index.html). The rendering is the same as V2 but with a different dataset so the rendering also have all movies shown. The same parameter as the TSNE 3D have been evaluated and the best one kept :

* Perplexity : 100
* Learning-Rate : 500 

### Colors :

For all model, a scoring has been applied on movies. The formula used is:
> Score = Rating * log(Number of Votes)

This ranking has been used in model 1 when we reduce the number of movie rendered. For model 2  and 3, this ranking has been converted to a color using the colormap from Matplotlib. As a result, best movies are shown in red, and worst ones in violet.
