#!/bin/bash
source constants.sh
shopt -s extglob
set -ev

DIR=$RAW_DIR/$VERSION

# Make APPROVED_SOURCES visible to process.env in node.js
export APPROVED_SOURCES

node ./src/split-atlas-data.js \
  $DIR/full-dataset-graph.csv \
  $DIR/cell-summaries.jsonld \
  $DIR/atlas-dataset-graph.csv \
  $DIR/atlas-lq-dataset-graph.csv \
  $DIR/test-dataset-graph.csv \
  $DIR/non-atlas-dataset-graph.csv

node ./src/unflatten-dataset-graph.js $DIR/atlas-dataset-graph.csv $DIR/atlas-dataset-graph.jsonld
node ./src/unflatten-dataset-graph.js $DIR/atlas-lq-dataset-graph.csv $DIR/atlas-lq-dataset-graph.jsonld
node ./src/unflatten-dataset-graph.js $DIR/test-dataset-graph.csv $DIR/test-dataset-graph.jsonld
