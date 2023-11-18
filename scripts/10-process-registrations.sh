#!/bin/bash
source constants.sh
shopt -s extglob
set -ev

MERGED=$RAW_DIR/$VERSION/registrations-dataset-graph.jsonld
COLLISIONS=$RAW_DIR/$VERSION/collisions.jsonld
DISTANCES=$RAW_DIR/$VERSION/euclidean-distances.jsonld

node ./src/concatenate-jsonld.js $REGISTRATIONS $MERGED
node ./src/get-collisions.js $MERGED $COLLISIONS
node ./src/compute-extraction-site-distances.js $MERGED $DISTANCES
