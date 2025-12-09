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

  var STORAGE_KEY = "gw-music-state-v3";

  function initMusicBar() {
    if (!tracks.length || !window.document || !document.body) return;

    // 🧹 امسح أي شريط قديم لو موجود
    var oldBar = document.getElementById("gw-music-bar");
    if (oldBar && oldBar.parentNode) {
      oldBar.parentNode.removeChild(oldBar);
    }

    // ===== 2) استرجاع حالة التشغيل =====
    var savedState = null;
    try {
      savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      savedState = null;
    }

    // ===== 3) إنشاء شريط الموسيقى (مخفي افتراضياً) =====
    var bar = document.createElement("div");
    bar.id = "gw-music-bar";
    bar.style.display = "none";
    bar.innerHTML =
      '<div class="gw-music-inner">' +
      '  <div class="gw-music-left">' +
      '    <strong> موسيقى غرزة وطن</strong>' +
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
      "#gw-music-bar #gw-music-title {" +
      "  font-size: 12px;" +
      "  color: #5b4035;" +
      "}" +
      "#gw-music-bar button {" +
      "  border: none;" +
      "  padding: 4px 10px;" +
      "  border-radius: 999px;" +
      "  cursor: pointer;" +
      "  font-size: 12px;" +
      "  background: #f3d4c5;" +
      "  color: #4a2f26;" +
      "}";

    document.head.appendChild(style);

    // ===== 5) منطق الصوت =====
    var currentIndex = 0;
    var isPlaying = false;
    var audio = null;

    if (savedState && typeof savedState.currentIndex === "number") {
      currentIndex = savedState.currentIndex;
      isPlaying = !!savedState.isPlaying;
    }

    function createAudio() {
      if (audio) audio.pause();
      audio = new Audio(tracks[currentIndex].url);
      audio.loop = true;
      audio.volume = 0.4;
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
          JSON.stringify({ currentIndex, isPlaying })
        );
      } catch (e) {}
    }

    function updateTitle() {
      titleSpan.textContent =
        "المقطع الحالي: " + tracks[currentIndex].title;
    }

    function loadCurrentTrack() {
      createAudio();
      if (isPlaying) audio.play().catch(() => {});
      updateTitle();
      saveState();
    }

    toggleBtn.addEventListener("click", function () {
      if (!isPlaying) {
        audio.play()
          .then(() => {
            isPlaying = true;
            toggleBtn.textContent = "⏸️ إيقاف";
            saveState();
          })
          .catch(() => {});
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
      if (audio) audio.pause();
      isPlaying = false;
      saveState();
      bar.style.display = "none";
    });

    updateTitle();

    // ===== 6) زر الموسيقى في أعلى يمين الصفحة – اللون الأسود =====
    var iconBtn = document.createElement("button");
    iconBtn.id = "gw-header-music-btn";
    iconBtn.type = "button";
    iconBtn.textContent = "♫";
    iconBtn.title = "موسيقى غرزة وطن";
    iconBtn.style.cssText =
      "position: absolute;" +
      "top: 12px;" +
      "right: 20px;" +
      "z-index: 10000;" +
      "background: transparent;" +
      "border: none;" +
      "cursor: pointer;" +
      "font-size: 24px;" +
      "color: black;";   // ← لون الأيقونة أسود

    iconBtn.addEventListener("click", function () {
      bar.style.display = bar.style.display === "none" ? "block" : "none";
    });

    document.body.appendChild(iconBtn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMusicBar);
  } else {
    initMusicBar();
  }
})();
