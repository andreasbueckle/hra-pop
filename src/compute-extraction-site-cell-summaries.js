import { readFileSync, writeFileSync } from 'fs';
import Papa from 'papaparse';

const DATASET_GRAPH_CSV = process.argv[2];
const CELL_SUMMARIES = process.argv[3];
const OUTPUT = process.argv[4];

const summaries = JSON.parse(readFileSync(CELL_SUMMARIES));
const summaryLookup = summaries['@graph'].reduce((lookup, summary) => {
  const id = summary['cell_source'];
  lookup[id] = lookup[id] || [];
  lookup[id].push(summary);
  return lookup;
}, {});

const ruiCellSummaries = {};

function handleCellSummaries(id, summaries) {
  for (const dsSummary of summaries) {
    const cellSummaryRows = dsSummary.summary;
    const summary = (ruiCellSummaries[id] = ruiCellSummaries[id] || {
      '@type': 'CellSummary',
      cell_source: id,
      annotation_method: 'Aggregation',
      aggregated_summary_count: 0,
      aggregated_summaries: new Set(),
      summary: [],
    });
    summary.aggregated_summaries.add(dsSummary.cell_source);

    for (const cell of cellSummaryRows) {
      let summaryRow = summary.summary.find((s) => s.cell_id === cell.cell_id);
      if (summaryRow) {
        summaryRow.count += cell.count;
      } else {
        summaryRow = {
          '@type': 'CellSummaryRow',
          cell_id: cell.cell_id,
          cell_label: cell.cell_label,
          count: cell.count,
          percentage: 0, // to be computed at the end
        };
        summary.summary.push(summaryRow);
      }
    }
  }
}

function finalizeCellSummaries() {
  return Object.values(ruiCellSummaries).map((summary) => {
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
  if (rui_location_id && summaries.length > 0) {
    handleCellSummaries(rui_location_id, summaries);
  }
}

const results = finalizeCellSummaries();

// Write out the new rui-location-cell-summaries.jsonld file
const jsonld = {
  ...JSON.parse(readFileSync('ccf-context.jsonld')),
  '@graph': results,
};
writeFileSync(OUTPUT, JSON.stringify(jsonld, null, 2));
