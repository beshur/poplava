#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function storeVideoMetadata() {
  const filePath = path.join(__dirname, '../data.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileJson = JSON.parse(fileContent);
    const targets = [];
    for (let id in fileJson) {
      const { timestamps = {} } = fileJson[id];
      if (Object.keys(timestamps).length === 0) {
        targets.push(id)
        execSync(`./tools/storeVideoMetadata.js ${id}`);
      }
    }

    console.log('Data updated successfully', targets);
  } else {
    throw new Error('Data file not found');
  }
}
storeVideoMetadata();
