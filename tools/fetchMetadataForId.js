// const fetch = require('node-fetch');

const API_KEY = process.env.YOUTUBE_API_KEY;
// const VIDEO_ID = 'ExHqD3o26u4';
// const VIDEO_ID = process.argv[2];

const fetchYoutubeMetadata = async (videoId) => {
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails,statistics&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.items.length === 0) {
      console.log('Video %s not found', videoId);
      return null;
    }
    return data.items[0];
  } catch (error) {
    console.error('Error fetching video metadata:', videoId, error);
    return null;
  }
};

const extractTimestampsWithTitles = (description) => {
  const lines = description.split('\n');
  const timestampRegex = /\b\d{1,2}?:?\d{1,2}:\d{2}\b/;
  const timestampsWithTitles = {};

  lines.forEach(line => {
    const match = line.match(timestampRegex);
    if (match) {
      const timestamp = match[0];
      const title = line.replace(new RegExp(`${timestamp} [-—]`), '').trim();
      timestampsWithTitles[timestamp] = title;
    }
  });

  return timestampsWithTitles;
};
async function fetchMetadataForId(VIDEO_ID) {
  const metadata = await fetchYoutubeMetadata(VIDEO_ID)
  if (metadata) {
    const dateRecordedMatch = metadata.snippet.description.match(/Випуск за (\d+\.\d+\.\d+)/)
    const date = new Date(dateRecordedMatch ? dateRecordedMatch[1] : metadata.snippet.publishedAt);
    const dateFormatted = `${date.getFullYear()}-${date.getMonth() + 1 < 10 ? '0' : ''}${date.getMonth() + 1}-${date.getDate() < 10 ? '0' : ''}${date.getDate()}`;
    const title = metadata.snippet.localized.title;
    const num = parseInt(metadata.snippet.localized.title.match(/(\d+)/)[1]);

    const timestamps = extractTimestampsWithTitles(metadata.snippet.description);
    const result = {
      id: VIDEO_ID,
      date: dateFormatted,
      title,
      num,
      timestamps
    };
    console.log('Video Metadata:', result);
    return result
  }
  return null;
}

module.exports = {
  fetchMetadataForId
}
