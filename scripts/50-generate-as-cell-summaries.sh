#!/bin/bash
source constants.sh
shopt -s extglob
set -ev

DIR=$RAW_DIR/$VERSION

COLLISIONS=$DIR/collisions.jsonld
SUMMARIES=$DIR/cell-summaries.jsonld

node ./src/compute-as-cell-summaries.js $DIR/atlas-dataset-graph.csv $COLLISIONS $SUMMARIES $DIR/atlas-as-cell-summaries.jsonld
node ./src/compute-as-cell-summaries.js $DIR/full-dataset-graph.csv $COLLISIONS $SUMMARIES $DIR/full-as-cell-summaries.jsonld
