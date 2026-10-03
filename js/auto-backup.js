// The built-in story library is the primary autosave. Keep a periodic
// desktop snapshot as a separate safety layer.
setInterval(() => {
  const api = getNativeApi();
  if (!api || typeof api.auto_backup !== "function") return;
  Promise.resolve(api.auto_backup()).catch((error) => console.error("Desktop safety backup failed:", error));
}, 10 * 60 * 1000);

let storyExitFlushStarted = false;
function flushStoryOnExit() {
  if (storyExitFlushStarted || !activeStoryDirty) return;
  storyExitFlushStarted = true;
  if (storySaveTimer) {
    clearTimeout(storySaveTimer);
    storySaveTimer = null;
  }
  saveActiveStory(true);
}

window.addEventListener("beforeunload", flushStoryOnExit);
window.addEventListener("pagehide", flushStoryOnExit);
