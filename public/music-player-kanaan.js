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

  var STORAGE_KEY = "gw-music-state-v5";

  function initMusicBar() {
    if (!tracks.length || !window.document || !document.body) return;

    // 🧹 امسح أي شريط قديم لو موجود
    var oldBar = document.getElementById("gw-music-bar");
    if (oldBar && oldBar.parentNode) {
      oldBar.parentNode.removeChild(oldBar);
    }

    // ===== 2) استرجاع الحالة من localStorage =====
    var savedState = null;
    try {
      savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      savedState = null;
    }

    var currentIndex = 0;
    var isPlaying = false;
    var lastPosition = 0; // زمن آخر نقطة تشغيل بالثواني

    if (savedState) {
      if (typeof savedState.currentIndex === "number") {
        currentIndex = savedState.currentIndex;
      }
      if (typeof savedState.isPlaying === "boolean") {
        isPlaying = savedState.isPlaying;
      }
      if (typeof savedState.position === "number") {
        lastPosition = savedState.position;
      }
    }

    // ===== 3) إنشاء شريط الموسيقى =====
    var bar = document.createElement("div");
    bar.id = "gw-music-bar";
    bar.style.display = isPlaying ? "block" : "none"; // لو كانت شغالة قبل، نعرض الشريط
    bar.innerHTML =
      '<div class="gw-music-inner">' +
      '  <div class="gw-music-left">' +
      '    <strong> موسيقى أرض كنعان</strong>' +
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
      "  background: #F9F9F9;" +
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
      var titleSpan = document.getElementById("gw-music-title");
      if (titleSpan) {
        titleSpan.textContent =
          "المقطع الحالي: " + tracks[currentIndex].title;
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

      // لما تجهز الميتاداتا نرجع لآخر ثانية محفوظة
      audio.addEventListener("loadedmetadata", function () {
        var dur = audio.duration || 0;
        var pos = lastPosition || 0;
        if (dur && pos > 0 && pos < dur) {
          audio.currentTime = pos;
        }

        if (isPlaying) {
          audio
            .play()
            .then(function () {})
            .catch(function () {});
        }
      });
    }

    createAudio();
    updateTitle();

    var toggleBtn = document.getElementById("gw-music-toggle");
    var nextBtn = document.getElementById("gw-music-next");
    var hideBtn = document.getElementById("gw-music-hide");

    if (isPlaying && toggleBtn) {
      toggleBtn.textContent = "⏸️ إيقاف";
    }

    // زر تشغيل/إيقاف
    toggleBtn.addEventListener("click", function () {
      if (!isPlaying) {
        audio
          .play()
          .then(function () {
            isPlaying = true;
            toggleBtn.textContent = "⏸️ إيقاف";
            saveState();
          })
          .catch(function () {});
      } else {
        audio.pause();
        isPlaying = false;
        lastPosition = audio.currentTime;
        toggleBtn.textContent = "▶️ تشغيل";
        saveState();
      }
    });

    // زر تغيير المقطع
    nextBtn.addEventListener("click", function () {
      currentIndex = (currentIndex + 1) % tracks.length;
      lastPosition = 0; // نبدأ من البداية في المقطع الجديد
      createAudio();
      updateTitle();
      if (isPlaying) {
        audio
          .play()
          .then(function () {})
          .catch(function () {});
      }
      saveState();
    });

    // زر إخفاء
    hideBtn.addEventListener("click", function () {
      if (audio) {
        lastPosition = audio.currentTime;
        audio.pause();
      }
      isPlaying = false;
      saveState();
      bar.style.display = "none";
    });

    // نحفظ الوقت قبل مغادرة الصفحة
    window.addEventListener("beforeunload", function () {
      if (audio) {
        lastPosition = audio.currentTime;
      }
      saveState();
    });

    // ===== 6) زر الأيقونة في أعلى يمين الصفحة (أسود) =====
    var iconBtn = document.createElement("button");
    iconBtn.id = "gw-header-music-btn";
    iconBtn.type = "button";
    iconBtn.textContent = "♫";
    iconBtn.title = "موسيقى أرض كنعان";
    iconBtn.style.cssText =
      "position: absolute;" +
      "top: 12px;" +
      "right: 20px;" +
      "z-index: 10000;" +
      "background: transparent;" +
      "border: none;" +
      "cursor: pointer;" +
      "font-size: 24px;" +
      "color: black;";

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
