const video = document.querySelector("#custom-video-player");
const playPauseBtn = document.querySelector("#play-pause-btn");
const playPauseImg = document.querySelector("#play-pause-img");
const progressBar = document.querySelector("#progress-bar-fill");
const timeline = document.querySelector("#timeline");
const currentTimeEl = document.querySelector("#current-time");
const totalTimeEl = document.querySelector("#total-time");
const skipBackBtn = document.querySelector("#skip-back-btn");
const skipForwardBtn = document.querySelector("#skip-forward-btn");
const muteBtn = document.querySelector("#mute-btn");
const muteImg = document.querySelector("#mute-img");
const volumeSlider = document.querySelector("#volume-slider");
const speedSelect = document.querySelector("#speed-select");
const fullscreenBtn = document.querySelector("#fullscreen-btn");
const fullscreenImg = document.querySelector("#fullscreen-img");
const cinemaBtn = document.querySelector("#cinema-btn");

// Replace native controls to present a unified UI
video.removeAttribute("controls");

// Utilities
function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function updatePlayPauseIcon() {
  const isPlaying = !video.paused && !video.ended;
  playPauseImg.src = isPlaying
    ? "https://img.icons8.com/ios-glyphs/30/pause--v1.png"
    : "https://img.icons8.com/ios-glyphs/30/play--v1.png";
}

function updateMuteIcon() {
  muteImg.src =
    video.muted || video.volume === 0
      ? "https://img.icons8.com/ios-glyphs/30/no-audio--v1.png"
      : "https://img.icons8.com/ios-glyphs/30/high-volume--v1.png";
}

function updateProgressBar() {
  const value = (video.currentTime / video.duration) * 100;
  progressBar.style.width = `${value}%`;
  timeline.setAttribute("aria-valuenow", Math.round(value));
  currentTimeEl.textContent = formatTime(video.currentTime);
}

function updateTotalTime() {
  totalTimeEl.textContent = formatTime(video.duration);
}

// Core controls
function togglePlayPause() {
  if (video.paused || video.ended) {
    video.play();
  } else {
    video.pause();
    // Add other functionalities here
  }
}

function skip(seconds) {
  video.currentTime = Math.min(
    Math.max(0, video.currentTime + seconds),
    video.duration || 0
  );
}

function seekByClientX(clientX) {
  const rect = timeline.getBoundingClientRect();
  const ratio = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1);
  video.currentTime = ratio * video.duration;
}

// Event wiring
playPauseBtn.addEventListener("click", togglePlayPause);
// Clicking video toggles playback
let lastDblClickAt = 0;
let justToggledViaPointer = false;
video.addEventListener("dblclick", () => {
  lastDblClickAt = Date.now();
});
video.addEventListener("pointerup", (e) => {
  // Prevent accidental toggle right after a dblclick (used for fullscreen)
  if (Date.now() - lastDblClickAt < 300) return;
  // Only toggle if the primary pointer was used
  if (e.button === 0 || e.pointerType === "touch" || e.pointerType === "pen") {
    togglePlayPause();
    // Debounce to avoid the subsequent 'click' from double-toggling
    justToggledViaPointer = true;
    setTimeout(() => {
      justToggledViaPointer = false;
    }, 250);
  }
});
// In fullscreen, 'click' may be intercepted by the browser's UI.
// Add pointer/touch handlers to ensure reliable toggling when in fullscreen.
video.addEventListener("mouseup", (e) => {
  if (Date.now() - lastDblClickAt < 300) return;
  if (justToggledViaPointer) return;
  if (e.button === 0) {
    togglePlayPause();
    justToggledViaPointer = true;
    setTimeout(() => {
      justToggledViaPointer = false;
    }, 250);
  }
});

video.addEventListener("click", () => {
  if (justToggledViaPointer) return;
  togglePlayPause();
});

video.addEventListener(
  "touchend",
  () => {
    if (Date.now() - lastDblClickAt < 300) return;
    if (!justToggledViaPointer) togglePlayPause();
  },
  { passive: true }
);
video.addEventListener("play", updatePlayPauseIcon);
video.addEventListener("pause", updatePlayPauseIcon);
video.addEventListener("timeupdate", updateProgressBar);
video.addEventListener("loadedmetadata", () => {
  updateTotalTime();
  updateProgressBar();
});

skipBackBtn.addEventListener("click", () => skip(-10));
skipForwardBtn.addEventListener("click", () => skip(10));

// Timeline interactions: click + keyboard arrows/Home/End
let isDragging = false;
timeline.addEventListener("mousedown", (e) => {
  isDragging = true;
  seekByClientX(e.clientX);
});
window.addEventListener("mousemove", (e) => {
  if (isDragging) seekByClientX(e.clientX);
});
window.addEventListener("mouseup", () => {
  isDragging = false;
});
timeline.addEventListener("click", (e) => seekByClientX(e.clientX));
timeline.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      skip(-5);
      break;
    case "ArrowRight":
      e.preventDefault();
      skip(5);
      break;
    case "Home":
      e.preventDefault();
      video.currentTime = 0;
      break;
    case "End":
      e.preventDefault();
      video.currentTime = video.duration;
      break;
  }
});

// Volume and mute
muteBtn.addEventListener("click", () => {
  video.muted = !video.muted;
  updateMuteIcon();
});
volumeSlider.addEventListener("input", () => {
  video.volume = Number(volumeSlider.value);
  video.muted = video.volume === 0; // UX: moving to zero implies muted state
  updateMuteIcon();
});
video.addEventListener("volumechange", updateMuteIcon);

// Playback speed
speedSelect.addEventListener("change", () => {
  video.playbackRate = Number(speedSelect.value);
});

// Fullscreen (handles vendor differences gracefully)
function isFullscreen() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}
function requestFs(el) {
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
}
function exitFs() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
}
function updateFsIcon() {
  const active = !!isFullscreen();
  fullscreenImg.src = active
    ? "https://img.icons8.com/ios-glyphs/30/collapse.png"
    : "https://img.icons8.com/ios-glyphs/30/full-screen--v1.png";
}
fullscreenBtn.addEventListener("click", async () => {
  if (isFullscreen()) {
    await exitFs();
  } else {
    await requestFs(video); // Request fullscreen to fill the entire screen
  }
  updateFsIcon();
});
document.addEventListener("fullscreenchange", () => {
  updateFsIcon();
  // If user exits fullscreen via Esc while in cinema, turn cinema off
  if (!document.fullscreenElement && cinemaFsActive) {
    document.body.classList.remove("cinema-mode");
    cinemaFsActive = false;
  }
});
document.addEventListener("webkitfullscreenchange", () => {
  updateFsIcon();
  if (!document.webkitFullscreenElement && cinemaFsActive) {
    document.body.classList.remove("cinema-mode");
    cinemaFsActive = false;
  }
});

// Double-click video to toggle fullscreen (common pattern)
video.addEventListener("dblclick", () => {
  if (isFullscreen()) {
    exitFs();
  } else {
    requestFs(video);
  }
});

// Cinema Mode: immersive mode + request fullscreen on the entire page
let cinemaFsActive = false; // track whether fullscreen was initiated by cinema mode
cinemaBtn.addEventListener("click", async () => {
  const enabling = !document.body.classList.contains("cinema-mode");
  if (enabling) {
    document.body.classList.add("cinema-mode");
    // If not in fullscreen already, request it so the whole website fills the screen
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      await requestFs(document.documentElement);
      cinemaFsActive = true;
    } else {
      // Already fullscreen. Prefer document fullscreen for consistent UI.
      if (
        document.fullscreenElement !== document.documentElement &&
        document.webkitFullscreenElement !== document.documentElement
      ) {
        try {
          await exitFs();
        } catch {}
        try {
          await requestFs(document.documentElement);
          cinemaFsActive = true;
        } catch {}
      }
    }
  } else {
    document.body.classList.remove("cinema-mode");
    if (
      cinemaFsActive &&
      (document.fullscreenElement || document.webkitFullscreenElement)
    ) {
      try {
        await exitFs();
      } catch {}
    }
    cinemaFsActive = false;
  }
});

// Keyboard shortcuts for familiar streaming UX
document.addEventListener("keydown", (e) => {
  // Ignore when typing in inputs/selects
  const target = e.target;
  const isTyping =
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable);
  if (isTyping) return;

  switch (e.key.toLowerCase()) {
    case " ": // Space
      e.preventDefault();
      togglePlayPause();
      break;
    case "k": // YouTube-like alias
      togglePlayPause();
      break;
    case "arrowleft":
      skip(-5);
      break;
    case "arrowright":
      skip(5);
      break;
    case "j":
      skip(-10);
      break;
    case "l":
      skip(10);
      break;
    case "m":
      video.muted = !video.muted;
      updateMuteIcon();
      break;
    case "f":
      fullscreenBtn.click();
      break;
    case "c":
      cinemaBtn.click();
      break;
  }
});

// Initial state sync
updatePlayPauseIcon();
updateMuteIcon();
if (isFinite(video.duration)) updateTotalTime();
