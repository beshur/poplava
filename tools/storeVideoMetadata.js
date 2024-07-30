#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { fetchMetadataForId } = require('./fetchMetadataForId');

const videoId = process.argv[2];

async function storeVideoMetadata() {
  const filePath = path.join(__dirname, '../data.json');
  if (fs.existsSync(filePath)) {
    const newEntry = await fetchMetadataForId(videoId);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileJson = JSON.parse(fileContent);
    let result = '';
    if (typeof fileJson[videoId] !== 'undefined') {
      fileJson[videoId] = newEntry;
      result = JSON.stringify(fileJson, null, 2);
    } else {
      const addition = `"${videoId}":${JSON.stringify(newEntry)},`;
      result = fileContent.split('\n')
      result.splice(1, 1, addition);
      result = result.join('\n');
    }
    fs.writeFileSync(filePath, result, 'utf-8');
    console.log('Data updated successfully');
  } else {
    throw new Error('Data file not found');
  }
}
storeVideoMetadata();
