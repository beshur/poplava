#!/usr/bin/env node
const fs = require('fs');
const { SitemapStream, streamToPromise } = require('sitemap')
const { Readable } = require('stream')

// Read the data from the JSON file
function writePage(videoObject, isFirst) {
  // Read the index.html file
  fs.readFile('./tools/template.html', 'utf8', (err, htmlString) => {
    if (err) {
      console.log("Error reading file from disk:", err);
      return;
    }

    let timestampsHtml = '';
    for (let timestamp in videoObject.timestamps) {
      const label = videoObject.timestamps[timestamp];
      timestampsHtml += `<li><span class="timestamp" data-timestamp="${timestamp}">${timestamp}</span>: ${label}</li>`;
    }

    const sha = process.env.SHA?.substring(0, 6) || 'dev';
    // Insert the first object into the HTML
    const modifiedHtmlString = htmlString
      .replace(/%%id%%/g, videoObject.id)
      .replace(/%%title%%/g, videoObject.title)
      .replace('%%timestamps%%', timestampsHtml)
      .replace(/%%SHA%%/g, sha);

    // Write the modified HTML back to index.html
    const filename = isFirst ? 'dist/index.html' : `dist/poplava${videoObject.num}.html`;
    fs.writeFile(filename, modifiedHtmlString, err => {
      if (err) console.log(`Error writing ${videoObject.num} file:`, err);
    });
  });
}

fs.readFile('data.json', 'utf8', async (err, jsonString) => {
  if (err) {
    console.log("Error reading file from disk:", err);
    return;
  }
  try {
    // Parse the JSON data
    const data = JSON.parse(jsonString);

    const links = [{ url: '/', changefreq: 'weekly', priority: 1 }]
    // Extract the first object
    let videoObject;
    let first = true;
    for (let p in data) {
      videoObject = data[p];
      if (!videoObject.deleted) {
        writePage(videoObject, first);
        if (!first) {
          links.push({ url: `/poplava${videoObject.num}.html`, changefreq: 'monthly', priority: 0.5 })
        }
        first = false;
      }
    }
    console.log('Data read successfully');

    // Create a stream to write to
    const stream = new SitemapStream({ hostname: 'https://frontova-poplava.pp.ua/' })

    // Return a promise that resolves with your XML string
    const sitemapXml = await streamToPromise(Readable.from(links).pipe(stream)).then((data) =>
      data.toString()
    )
    fs.writeFile('dist/sitemap.xml', sitemapXml, err => {
      if (err) console.log("Error writing sitemap file:", err);
    });

  } catch (err) {
    console.log('Error parsing JSON string:', err);
  }
});
