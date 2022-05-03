const player = { current: null };
const index = new FlexSearch.Index({ language: 'uk' });

const VIDEO_HEIGHT = 400;
const VIDEO_WIDTH = '100%';

let overlayVisible = false;

const getSecondsFromTimestamp = function (timestamp) {
  return timestamp
    .split(':')
    .map(function (item, index) {
      return parseInt(item, 10) * (!index ? 60 : 1);
    })
    .reduce(function (sum, item) {
      return (sum = sum + (isNaN(item) ? 0 : item));
    }, 0);
};

const TIMESTAMPS_LIST = function (timestamps) {
  const result = [];
  for (let timestamp in timestamps) {
    result.push(
      `<li><span class="timestamp" data-timestamp="${timestamp}">${timestamp}</span>: ${timestamps[timestamp]}</li>`
    );
  }
  return result.join('');
};

const ITEM_TPL = function ({ id, title, timestamps }) {
  return `<article id="${id}" class="item">
    <h3>${title}</h3>
    <div class="content">
      <div id="playerId${id}"></div>
      <ul class="timestamps">${TIMESTAMPS_LIST(timestamps)}</ul>
    </div>
  </article>`;
};

const TITLE_TPL = function ({ id, title }) {
  return `<article data-id="${id}" data-timestamp="" class="itemTitle">${title}</article>`;
};

const timeStampHandler = function (e) {
  const target = e.target;
  if (!target) {
    return;
  }
  const seconds = getSecondsFromTimestamp(target.dataset.timestamp);
  player.current.seekTo(seconds);
  player.current.playVideo();
};

const resolveSearch = function (searchId) {
  const [id, timestamp] = searchId.split('@');
  const item = DATA[id];
  const result = { id, timestamp, num: item.num, title: item.title };
  if (timestamp) {
    result.title = item.timestamps[timestamp];
  }
  return result;
};

const SEARCH_RESULTS_TPL = function (results) {
  if (!results.length) {
    return '<div>Нічого не знайдено</div>';
  }
  const resolvedResults = results.map(resolveSearch);
  return `<ul>${resolvedResults
    .map(function (item) {
      return `<li class="searchResult" data-id="${
        item.id
      }" data-timestamp="${item.timestamp}">(${item.num}${item.timestamp ? '@' + item.timestamp : ''}) ${item.title}</li>`;
    })
    .join('')}</ul>`;
};

function searchSelectHandler(e) {
  const fields = e.target.dataset;
  const item = DATA[fields.id];

  const currentId = player.current ? player.current.getVideoData().video_id : '';
  if (currentId !== fields.id) {
    document.getElementById('watch').innerHTML = ITEM_TPL(item);
    initVideo(fields.id, fields.timestamp);
    window.scrollTo(0, 0);
  } else {
    const seconds = getSecondsFromTimestamp(fields.timestamp);
    player.current.seekTo(seconds);
    player.current.playVideo();
  }
  toggleSearchOverlay(false);
}

function initSearch() {
  for (let id in DATA) {
    const item = DATA[id];
    // search index
    index.add(item.id, item.title);
    for (let timestamp in item.timestamps) {
      index.add(item.id + '@' + timestamp, item.timestamps[timestamp]);
    }
  }
}

const initVideo = function (id, start = '') {
  player.current = new YT.Player('playerId' + id, {
    height: VIDEO_HEIGHT,
    width: VIDEO_WIDTH,
    videoId: id,
    events: {
      onReady: function () {
        if (start) {
          const seconds = getSecondsFromTimestamp(start);
          player.current.seekTo(seconds);
          player.current.playVideo();
        }
      },
    },
  });
};

function toggleSearchOverlay(on) {
  const searchResultsEl = document.getElementById('searchResults');
  if (!overlayVisible && on) {
    overlayVisible = true;
    searchResultsEl.parentElement.classList.toggle('show');
    document.body.classList.toggle('showOverlay');
  } else if (overlayVisible && !on) {
    overlayVisible = false;
    searchResultsEl.parentElement.classList.toggle('show');
    document.body.classList.toggle('showOverlay');
  }
}

function onSearch(e) {
  const s = e.target.value.toLowerCase();
  const results = index.search(s, 10);

  const searchResultsEl = document.getElementById('searchResults');
  searchResultsEl.innerHTML = SEARCH_RESULTS_TPL(results);
  toggleSearchOverlay(true);
}

function onYouTubeIframeAPIReady() {
  console.log('start');
  let index = 0;
  const watchEl = document.getElementById('watch');
  const videosEl = document.getElementById('videos');
  const searchEl = document.getElementById('search');
  const searchResultsEl = document.getElementById('searchResults');

  const videosHtml = [];
  for (let id in DATA) {
    if (!index) {
      watchEl.innerHTML = ITEM_TPL(DATA[id]);
      initVideo(id);
      videosHtml.push(TITLE_TPL(DATA[id]));
    } else {
      videosHtml.push(TITLE_TPL(DATA[id]));
    }
    index++;
  }

  videosEl.innerHTML = videosHtml.join('');

  initSearch();

  searchEl.addEventListener('keyup', onSearch);

  watchEl.addEventListener('click', function (e) {
    if (e.target) {
      if (e.target.className === 'timestamp') {
        timeStampHandler(e);
      }
    }
  });
  searchResultsEl.addEventListener('click', function (e) {
    if (e.target) {
      if (e.target.className === 'searchResult') {
        searchSelectHandler(e);
      }
    }
  });
  videosEl.addEventListener('click', function (e) {
    searchSelectHandler(e);
  });
}
