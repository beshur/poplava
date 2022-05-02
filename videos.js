const players = {};
let idx;
const VIDEO_HEIGHT = 315;
const VIDEO_WIDTH = 560;

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
    <ul class="timestamps">${TIMESTAMPS_LIST(timestamps)}</ul>

    <div id="playerId${id}"></div>
    </div>
    <span class="expand">Розгорнути</span>
  </article>`;
};

const timeStampHandler = function (e) {
  const target = e.target;
  if (!target) {
    return;
  }
  const article = target.closest('article');
  const id = article.id;
  const player = players[id];
  const seconds = target.dataset.timestamp
    .split(':')
    .map(function (item, index) {
      return parseInt(item, 10) * (!index ? 60 : 1);
    })
    .reduce(function (sum, item) {
      return (sum = sum + item);
    }, 0);
  player.seekTo(seconds);
  player.playVideo();
};

const expandHandler = function (e) {
  const target = e.target;
  const article = target.closest('article');

  const collapsed = article.className === 'item';
  article.className = collapsed ? 'item expanded' : 'item';
  target.innerHTML = collapsed ? 'Згорнути' : 'Розгорнути';
};

function initVideos() {
  idx = lunr(function () {
    this.ref('id');
    this.field('timestamps');
    this.field('title');

    DATA.forEach(function (item) {
      this.add(item);

      players[item.id] = new YT.Player('playerId' + item.id, {
        height: VIDEO_HEIGHT,
        width: VIDEO_WIDTH,
        videoId: item.id,
      });
    }, this);
  });
}

function onSearch(e) {
  const s = e.target.value.toLowerCase();

  console.log('search', idx.search(s));
}

function onYouTubeIframeAPIReady() {
  console.log('start');

  const videosEl = document.getElementById('videos');
  const searchEl = document.getElementById('search');

  const videosHtml = DATA.map(ITEM_TPL);

  videosEl.innerHTML = videosHtml.join('');

  initVideos();

  searchEl.addEventListener('keyup', onSearch);

  videosEl.addEventListener('click', function (e) {
    if (e.target) {
      if (e.target.className === 'timestamp') {
        timeStampHandler(e);
      } else if (e.target.className === 'expand') {
        expandHandler(e);
      }
    }
  });
}
