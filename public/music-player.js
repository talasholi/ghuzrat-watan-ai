(function () {
  // ===== 1) قائمة المقاطع الصوتية =====
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

  var STORAGE_KEY = "gw-music-state";

  function initMusicBar() {
    if (!tracks.length || !window.document || !document.body) return;

    // ===== 2) استرجاع حالة الموسيقى بين الصفحات =====
    var savedState = null;
    try {
      savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      savedState = null;
    }

    // ===== 3) إنشاء شريط الموسيقى في أعلى الصفحة =====
    var bar = document.createElement("div");
    bar.id = "gw-music-bar";
    bar.innerHTML =
      '<div class="gw-music-inner">' +
      '  <div class="gw-music-left">' +
      '    <strong>🎵 موسيقى غرزة وطن</strong>' +
      '    <span id="gw-music-title"></span>' +
      "  </div>" +
      '  <div class="gw-music-right">' +
      '    <button id="gw-music-toggle">▶️ تشغيل</button>' +
      '    <button id="gw-music-next">🔁 تغيير المقطع</button>' +
      '    <button id="gw-music-hide">✖️ إخفاء</button>' +
      "  </div>" +
      "</div>";

    if (document.body.firstChild) {
      document.body.insertBefore(bar, document.body.firstChild);
    } else {
      document.body.appendChild(bar);
    }

    // ===== 4) ستايل الشريط =====
    var style = document.createElement("style");
    style.textContent =
      "#gw-music-bar {" +
      "  width: 100%;" +
      "  background: #fbe7dd;" +
      "  border-bottom: 1px solid #e2c8ba;" +
      "  font-family: inherit;" +
      "  font-size: 14px;" +
      "  direction: rtl;" +
      "  z-index: 9999;" +
      "}" +
      "#gw-music-bar .gw-music-inner {" +
      "  max-width: 1200px;" +
      "  margin: 0 auto;" +
      "  padding: 6px 12px;" +
      "  display: flex;" +
      "  align-items: center;" +
      "  justify-content: space-between;" +
      "  gap: 12px;" +
      "}" +
      "#gw-music-bar .gw-music-left {" +
      "  display: flex;" +
      "  flex-direction: column;" +
      "  gap: 2px;" +
      "}" +
      "#gw-music-bar #gw-music-title {" +
      "  font-size: 12px;" +
      "  color: #5b4035;" +
      "}" +
      "#gw-music-bar .gw-music-right {" +
      "  display: flex;" +
      "  gap: 6px;" +
      "  align-items: center;" +
      "  flex-shrink: 0;" +
      "}" +
      "#gw-music-bar button {" +
      "  border: none;" +
      "  padding: 4px 10px;" +
      "  border-radius: 999px;" +
      "  cursor: pointer;" +
      "  font-size: 12px;" +
      "  background: #f3d4c5;" +
      "  color: #4a2f26;" +
      "  white-space: nowrap;" +
      "}" +
      "#gw-music-bar button:hover {" +
      "  opacity: 0.9;" +
      "}" +
      "#gw-music-hide {" +
      "  background: #f1b7b0;" +
      "}" +
      "@media (max-width: 700px) {" +
      "  #gw-music-bar .gw-music-inner {" +
      "    flex-direction: column;" +
      "    align-items: flex-start;" +
      "    gap: 4px;" +
      "  }" +
      "  #gw-music-bar .gw-music-right {" +
      "    width: 100%;" +
      "    justify-content: flex-start;" +
      "    flex-wrap: wrap;" +
      "  }" +
      "  #gw-music-bar button {" +
      "    padding: 3px 8px;" +
      "    font-size: 11px;" +
      "  }" +
      "  #gw-music-bar #gw-music-title {" +
      "    font-size: 11px;" +
      "  }" +
      "}";

    document.head.appendChild(style);

    // ===== 5) منطق تشغيل الصوت =====
    var currentIndex = 0;
    var isPlaying = false;
    var audio = null;

    if (savedState && typeof savedState.currentIndex === "number") {
      currentIndex = savedState.currentIndex;
      isPlaying = !!savedState.isPlaying;
    }

    function createAudio() {
      if (audio) {
        audio.pause();
        audio = null;
      }
      audio = new Audio(tracks[currentIndex].url);
      audio.loop = true;
      audio.volume = 0.4; // صوت خفيف
    }

    createAudio();

    var toggleBtn = document.getElementById("gw-music-toggle");
    var nextBtn = document.getElementById("gw-music-next");
    var hideBtn = document.getElementById("gw-music-hide");
    var titleSpan = document.getElementById("gw-music-title");

    function saveState() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            currentIndex: currentIndex,
            isPlaying: isPlaying
          })
        );
      } catch (e) {}
    }

    function updateTitle() {
      titleSpan.textContent =
        "المقطع الحالي: " + tracks[currentIndex].title;
    }

    function loadCurrentTrack() {
      createAudio();
      if (isPlaying) {
        audio.play().catch(function (e) {
          console.warn("Autoplay blocked:", e);
        });
      }
      updateTitle();
      saveState();
    }

    toggleBtn.addEventListener("click", function () {
      if (!isPlaying) {
        audio
          .play()
          .then(function () {
            isPlaying = true;
            toggleBtn.textContent = "⏸️ إيقاف";
            saveState();
          })
          .catch(function (e) {
            console.warn("Play blocked:", e);
          });
      } else {
        audio.pause();
        isPlaying = false;
        toggleBtn.textContent = "▶️ تشغيل";
        saveState();
      }
    });

    nextBtn.addEventListener("click", function () {
      currentIndex = (currentIndex + 1) % tracks.length;
      loadCurrentTrack();
    });

    hideBtn.addEventListener("click", function () {
      if (audio) {
        audio.pause();
      }
      isPlaying = false;
      saveState();
      bar.style.display = "none";
    });

    window.addEventListener("beforeunload", saveState);

    updateTitle();
    if (isPlaying) {
      audio
        .play()
        .then(function () {
          toggleBtn.textContent = "⏸️ إيقاف";
        })
        .catch(function (e) {
          console.warn("Autoplay on reload blocked:", e);
        });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMusicBar);
  } else {
    initMusicBar();
  }
})();
