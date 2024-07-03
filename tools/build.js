#!/usr/bin/env node
const fs = require('fs');
// Read the data from the JSON file
fs.readFile('data.json', 'utf8', (err, jsonString) => {
  if (err) {
    console.log("Error reading file from disk:", err);
    return;
  }
  try {
    // Parse the JSON data
    const data = JSON.parse(jsonString);

    // Extract the first object
    let firstObject;
    for (let p in data) {
      firstObject = data[p];
      if (!firstObject.deleted) {
        break;
      }
    }
    console.log('Data read successfully');

    // Read the index.html file
    fs.readFile('./tools/template.html', 'utf8', (err, htmlString) => {
      if (err) {
        console.log("Error reading file from disk:", err);
        return;
      }

      let timestampsHtml = '';
      for (let timestamp in firstObject.timestamps) {
        const label = firstObject.timestamps[timestamp];
        timestampsHtml += `<li><span class="timestamp" data-timestamp="${timestamp}">${timestamp}</span>: ${label}</li>`;
      }

      const sha = process.env.SHA?.substring(0, 6) || 'dev';
      // Insert the first object into the HTML
      const modifiedHtmlString = htmlString
        .replace(/%%id%%/g, firstObject.id)
        .replace(/%%title%%/g, firstObject.title)
        .replace('%%timestamps%%', timestampsHtml)
        .replace(/%%SHA%%/g, sha);

      // Write the modified HTML back to index.html
      fs.writeFile('index.html', modifiedHtmlString, err => {
        if (err) console.log("Error writing file:", err);
      });
    });
  } catch (err) {
    console.log('Error parsing JSON string:', err);
  }
});
