import { readFileSync, writeFileSync } from 'fs';
import Papa from 'papaparse';

const DATASET_GRAPH_CSV = process.argv[2];
const COLLISIONS = process.argv[3];
const CELL_SUMMARIES = process.argv[4];
const OUTPUT = process.argv[5];

const collisions = JSON.parse(readFileSync(COLLISIONS));
const collisionLookup = collisions['@graph'].reduce(
  (acc, collision) => ((acc[collision['collision_source']] = collision.collisions), acc),
  {}
);

const summaries = JSON.parse(readFileSync(CELL_SUMMARIES));
const summaryLookup = summaries['@graph'].reduce((lookup, summary) => {
  const id = summary['cell_source'];
  lookup[id] = lookup[id] || [];
  lookup[id].push(summary);
  return lookup;
}, {});

const asCellSummaries = {};

function handleCellSummaries(summaries, collisions) {
  for (const dsSummary of summaries) {
    const cellSummaryRows = dsSummary.summary;
    for (const cell of cellSummaryRows) {
      for (const collision of collisions) {
        const asIri = collision.as_id;
        const modality = dsSummary.modality;
        const weightedCellCount = cell.count * collision.percentage;

        const summary = (asCellSummaries[asIri + modality] = asCellSummaries[asIri + modality] || {
          '@type': 'CellSummary',
          cell_source: asIri,
          annotation_method: 'Aggregation',
          aggregated_summary_count: 0,
          aggregated_summaries: new Set(),
          modality,
          summary: [],
        });
        summary.aggregated_summaries.add(dsSummary.cell_source);

        let summaryRow = summary.summary.find((s) => s.cell_id === cell.cell_id);
        if (summaryRow) {
          summaryRow.count += weightedCellCount;
        } else {
          summaryRow = {
            '@type': 'CellSummaryRow',
            cell_id: cell.cell_id,
            cell_label: cell.cell_label,
            count: weightedCellCount,
            percentage: 0, // to be computed at the end
          };
          summary.summary.push(summaryRow);
        }
      }
    }
  }
}

function finalizeAsCellSummaries() {
  return Object.values(asCellSummaries).map((summary) => {
    const cellCount = summary.summary.reduce((acc, s) => acc + s.count, 0);
    summary.summary.forEach((s) => (s.percentage = s.count / cellCount));
    summary.aggregated_summary_count = summary.aggregated_summaries.size;
    summary.aggregated_summaries = [...summary.aggregated_summaries];
    return summary;
  });
}

const { data } = Papa.parse(readFileSync(DATASET_GRAPH_CSV).toString(), { header: true, skipEmptyLines: true });
for (const { dataset_id, rui_location } of data) {
  const rui_location_id = rui_location ? JSON.parse(rui_location)['@id'] : undefined;
  const summaries = summaryLookup[dataset_id] || [];
  const collisions = collisionLookup[rui_location_id] || [];
  if (summaries.length > 0 && collisions.length > 0) {
    handleCellSummaries(summaries, collisions);
  }
}

const results = finalizeAsCellSummaries();

// Write out the new as-collisions.jsonld file
const jsonld = {
  ...JSON.parse(readFileSync('ccf-context.jsonld')),
  '@graph': results,
};
writeFileSync(OUTPUT, JSON.stringify(jsonld, null, 2));
