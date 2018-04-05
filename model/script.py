import pandas as pd
import math
import numpy as np
import matplotlib
import matplotlib.cm

from scipy.spatial.distance import pdist, squareform

from dosnes import dosnes

def get_color(x):
    return matplotlib.colors.to_hex(cmap(norm(x)))

cmap = matplotlib.cm.get_cmap('gist_rainbow_r')

df = pd.read_csv("../datas/prepared/final_dataset_with_omdb.csv", index_col=0, encoding="ISO-8859-1")
df = df[df.startYear > 1995]
df["score"] = df["averageRating"] * np.log(df["numVotes"])
norm = matplotlib.colors.Normalize(vmin=df["score"].min(), vmax=df["score"].max())
df["color"] = df["score"].apply(get_color)

X = np.load('distance_matrices.npz')

d0 = X["d0"]
d1 = X["d1"]
d2 = X["d2"]
d3 = X["d3"]
d4 = X["d4"]
d5 = X["d5"]
d6 = X["d6"]
d7 = X["d7"]
d8 = X["d8"]
d9 = X["d9"]
d10 = X["d10"]

distance_final = 1.5 * d0 + 0.3 * d1 + 10 * d2 + 0.3 * d3 + 0.2 * d4 + 0.2 * d5 + 0.8 * d6 + 0.8 * d7 + 1 * d8 + 0.2 * d9 + 0.5 * d10
distance_final = squareform(distance_final)

del X
del d0
del d1
del d2
del d3
del d4
del d5
del d6
del d7
del d8
del d9
del d10

mdl = dosnes.DOSNES(metric = "precomputed", verbose = 1)
X_embedded = mdl.fit_transform(distance_final)

to_save = df[["primaryTitle", "color", "score"]].reset_index()
pos = pd.DataFrame(X_embedded)
pos.columns = ["X", "Y", "Z"]
end = pd.concat([to_save, pos], axis=1).sort_values(by=['score'], ascending = False).reset_index(drop=True)
end.to_csv("../datas/simulation/dosnes_new_weight.csv")