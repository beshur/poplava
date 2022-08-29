const player = { current: null };
const index = new FlexSearch.Index({ tokenize: 'full', language: 'uk' });

const VIDEO_HEIGHT = 400;
const VIDEO_WIDTH = '100%';

let overlayVisible = false;
let currentId = '';
let debounceTimer;

const analyticsPush = function (category, action, name) {
  if (_paq) {
    _paq.push(['trackEvent', category, action, name]);
  }
};

const debounce = (callback, time) => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(callback, time);
};

const debouncedSearchKeyup = function () {
  return debounce(analyticsPush.bind(null, 'Search', 'Keyup', 'keyup'), 250);
};

const getSecondsFromTimestamp = function (timestamp) {
  if (!timestamp) {
    return 0;
  }
  return timestamp
    .split(':')
    .map(function (item, index, array) {
      if (array.length === 3) {
        // hours
        return parseInt(item, 10) * (!index ? 3600 : index === 1 ? 60 : 1);
      }
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
      <span class="lds-dual-ring"></span>
    </div>
    <ul class="timestamps">${TIMESTAMPS_LIST(timestamps)}</ul>
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
  changeVideo({
    id: currentId,
    timestamp: target.dataset.timestamp,
  });
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
      return `<li class="searchResult" data-id="${item.id}" data-timestamp="${item.timestamp}">
        <span class="timestamp">${item.num}${item.timestamp ? '@' + item.timestamp : ''}</span>
        ${item.title}
      </li>`;
    })
    .join('')}</ul>`;
};

const initVideo = function (videoId, start = '') {
  player.current = new YT.Player('playerId' + videoId, {
    height: VIDEO_HEIGHT,
    width: VIDEO_WIDTH,
    videoId,
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

function searchSelectHandler(dataset) {
  const { id, timestamp } = dataset;
  changeVideo({ id, timestamp });
}

function changeVideo({ id, timestamp }) {
  const item = DATA[id];

  if (currentId !== id) {
    currentId = id;
    document.getElementById('watch').innerHTML = ITEM_TPL(item);
    initVideo(id, timestamp);
    window.scrollTo(0, 0);
    analyticsPush('Videos', 'Selected Video', [id, timestamp].join('@'));
  } else {
    const seconds = getSecondsFromTimestamp(timestamp);
    player.current.seekTo(seconds);
    player.current.playVideo();
    analyticsPush('Videos', 'Selected Timestamp', [id, timestamp].join('@'));
  }
  toggleSearchOverlay(false);
  document.querySelectorAll(`#videos article`).forEach((item) => item.classList.remove('active'));
  document.querySelector(`#videos [data-id="${id}"]`)?.classList.toggle('active');
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
  debouncedSearchKeyup();
  toggleSearchOverlay(true);
}

function onRusClick() {
  let el = document.getElementById('rusAudio');

  const num = Math.floor(Math.random() * 3);
  if (!el) {
    el = document.createElement('audio');
    el.id = 'rusAudio';
    document.body.appendChild(el);
  }
  el.src = `./rus${num}.m4a`;
  el.play();
  analyticsPush('Easter', 'Clicked', 'click' + num);
}

window.onload = function () {
  console.log('loaded');

  let index = 0;
  const watchEl = document.getElementById('watch');
  const videosEl = document.getElementById('videos');
  const searchEl = document.getElementById('search');
  const overlayEl = document.getElementById('overlay');
  const searchResultsEl = document.getElementById('searchResults');
  const rusEl = document.querySelector('.rus');

  const videosHtml = [];
  for (let id in DATA) {
    videosHtml.push(TITLE_TPL(DATA[id]));
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
    let pointer = e;
    if (e.target.className !== 'searchResult') {
      pointer = { target: e.target.parentElement };
    }

    const { id, timestamp } = pointer.target.dataset;
    analyticsPush('Search', 'Selected Result', [id, timestamp].join('@'));
    searchSelectHandler(pointer.target.dataset);
  });
  videosEl.addEventListener('click', function (e) {
    const { id } = e.target.dataset;
    analyticsPush('Videos', 'Selected Video', id);
    searchSelectHandler(e.target.dataset);
  });

  overlayEl.addEventListener('click', function (e) {
    toggleSearchOverlay(false);
  });

  rusEl.addEventListener('click', onRusClick);

  // This code loads the IFrame Player API code asynchronously.
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

function onYouTubeIframeAPIReady() {
  console.log('YT API loaded');
  for (let id in DATA) {
    changeVideo({ id });
    break;
  }
}
