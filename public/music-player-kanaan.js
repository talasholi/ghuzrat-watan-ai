(function () {
  var tracks = [
    {
      title: "موسيقى تراثية 1",
      url: "https://ghuzrat-watan-ai.onrender.com/audio/urLTg-3eImU.mp3"
    },
    {
      title: "موسيقى تراثية 2",
      url: "https://ghuzrat-watan-ai.onrender.com/audio/SCeKnYAvr7c.mp3"
    }
  ];

  var STORAGE_KEY = "kanaan-music-state-v2";

  function initMusicBar() {
    if (!tracks.length || !window.document || !document.body) return;

    var oldBar = document.getElementById("kanaan-music-bar");
    if (oldBar && oldBar.parentNode) oldBar.parentNode.removeChild(oldBar);

    var oldBtn = document.getElementById("kanaan-header-music-btn");
    if (oldBtn && oldBtn.parentNode) oldBtn.parentNode.removeChild(oldBtn);

    var savedState = null;
    try {
      savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      savedState = null;
    }

    var currentIndex = 0;
    var isPlaying = false;
    var lastPosition = 0;

    if (savedState) {
      if (typeof savedState.currentIndex === "number") currentIndex = savedState.currentIndex;
      if (typeof savedState.isPlaying === "boolean") isPlaying = savedState.isPlaying;
      if (typeof savedState.position === "number") lastPosition = savedState.position;
    }

    var bar = document.createElement("div");
    bar.id = "kanaan-music-bar";
    bar.style.display = isPlaying ? "block" : "none";

    bar.innerHTML =
      '<div class="kanaan-music-inner">' +
      '  <div class="kanaan-music-left">' +
      '    <strong>موسيقى أرض كنعان</strong>' +
      '    <span id="kanaan-music-title"></span>' +
      "  </div>" +
      '  <div class="kanaan-music-right">' +
      '    <button id="kanaan-music-toggle">▶ تشغيل</button>' +
      '    <button id="kanaan-music-next">↺ تغيير المقطع</button>' +
      '    <button id="kanaan-music-hide">✕ إخفاء</button>' +
      "  </div>" +
      "</div>";

    document.body.insertBefore(bar, document.body.firstChild);

    var style = document.createElement("style");
    style.textContent =
      "#kanaan-music-bar {" +
      "width:100%;" +
      "background:rgba(62,48,38,0.90);" +
      "color:#f2eadf;" +
      "border-bottom:1px solid rgba(242,234,223,0.25);" +
      "font-family:inherit;" +
      "font-size:14px;" +
      "direction:rtl;" +
      "z-index:9999;" +
      "}" +

      "#kanaan-music-bar .kanaan-music-inner {" +
      "max-width:1200px;" +
      "margin:0 auto;" +
      "padding:6px 12px;" +
      "display:flex;" +
      "align-items:center;" +
      "justify-content:space-between;" +
      "gap:12px;" +
      "}" +

      "#kanaan-music-title {" +
      "font-size:12px;" +
      "color:#f2eadf;" +
      "margin-right:8px;" +
      "}" +

      "#kanaan-music-bar button {" +
      "border:1px solid rgba(255,255,255,0.45);" +
      "padding:4px 10px;" +
      "border-radius:999px;" +
      "cursor:pointer;" +
      "font-size:12px;" +
      "background:#a9886b;" +
      "color:#ffffff;" +
      "}" +

      "#kanaan-music-bar button:hover {" +
      "background:#8f7158;" +
      "}";

    document.head.appendChild(style);

    var audio = null;

    function saveState() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            currentIndex: currentIndex,
            isPlaying: isPlaying,
            position: audio ? audio.currentTime : lastPosition
          })
        );
      } catch (e) {}
    }

    function updateTitle() {
      var titleSpan = document.getElementById("kanaan-music-title");
      if (titleSpan) {
        titleSpan.textContent = "المقطع الحالي: " + tracks[currentIndex].title;
      }
    }

    function createAudio() {
      if (audio) {
        audio.pause();
        audio = null;
      }

      audio = new Audio(tracks[currentIndex].url);
      audio.loop = true;
      audio.volume = 0.4;

      audio.addEventListener("loadedmetadata", function () {
        var dur = audio.duration || 0;

        if (dur && lastPosition > 0 && lastPosition < dur) {
          audio.currentTime = lastPosition;
        }

        if (isPlaying) {
          audio.play().catch(function () {});
        }
      });
    }

    createAudio();
    updateTitle();

    var toggleBtn = document.getElementById("kanaan-music-toggle");
    var nextBtn = document.getElementById("kanaan-music-next");
    var hideBtn = document.getElementById("kanaan-music-hide");

    if (isPlaying && toggleBtn) {
      toggleBtn.textContent = "⏸ إيقاف";
    }

    toggleBtn.addEventListener("click", function () {
      if (!isPlaying) {
        audio
          .play()
          .then(function () {
            isPlaying = true;
            toggleBtn.textContent = "⏸ إيقاف";
            saveState();
          })
          .catch(function () {});
      } else {
        audio.pause();
        isPlaying = false;
        lastPosition = audio.currentTime;
        toggleBtn.textContent = "▶ تشغيل";
        saveState();
      }
    });

    nextBtn.addEventListener("click", function () {
      currentIndex = (currentIndex + 1) % tracks.length;
      lastPosition = 0;
      createAudio();
      updateTitle();

      if (isPlaying) {
        audio.play().catch(function () {});
      }

      saveState();
    });

    hideBtn.addEventListener("click", function () {
      if (audio) {
        lastPosition = audio.currentTime;
        audio.pause();
      }

      isPlaying = false;
      saveState();
      bar.style.display = "none";
    });

    window.addEventListener("beforeunload", function () {
      if (audio) {
        lastPosition = audio.currentTime;
      }

      saveState();
    });

    var iconBtn = document.createElement("button");
    iconBtn.id = "kanaan-header-music-btn";
    iconBtn.type = "button";
    iconBtn.textContent = "♫";
    iconBtn.title = "موسيقى أرض كنعان";

    iconBtn.style.cssText =
      "position:absolute;" +
      "top:12px;" +
      "right:0px;" +
      "z-index:10000;" +
      "background:transparent;" +
      "border:none;" +
      "cursor:pointer;" +
      "font-size:28px;" +
      "color:white;" +
      "text-shadow:0 0 8px rgba(0,0,0,0.9);";

    iconBtn.addEventListener("click", function () {
      if (bar.style.display === "none") {
        bar.style.display = "block";
      } else {
        bar.style.display = "none";
      }
    });

    document.body.appendChild(iconBtn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMusicBar);
  } else {
    initMusicBar();
  }
})();
