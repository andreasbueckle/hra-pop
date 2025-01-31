import fetch from 'node-fetch';
import { readFileSync, writeFileSync } from 'fs';

const REGISTRATION_URLS = process.argv.slice(2, -1);
const OUTPUT_JSONLD = process.argv.slice(-1)[0];

async function getJsonLd(inputFile) {
  let document = [];
  if (inputFile.startsWith('http')) {
    document = await fetch(inputFile, { follow: true }).then((r) => r.json());
  } else {
    document = JSON.parse(readFileSync(inputFile).toString());
  }

  return document['@graph'] || document || [];
}

async function concatenateJsonLds(inputFiles) {
  let results = [];

  for (const inputFile of inputFiles) {
    const documents = await getJsonLd(inputFile);
    results = results.concat(documents);
  }

  const jsonld = {
    ...JSON.parse(readFileSync('ccf-context.jsonld')),
    '@graph': results,
  };

  return jsonld;
}

const jsonld = await concatenateJsonLds(REGISTRATION_URLS);
writeFileSync(OUTPUT_JSONLD, JSON.stringify(jsonld, null, 2));
