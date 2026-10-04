// The built-in story library is the primary autosave. Keep a periodic
// desktop snapshot as a separate safety layer.
setInterval(() => {
  const api = getNativeApi();
  if (!api || typeof api.auto_backup !== "function") return;
  Promise.resolve(api.auto_backup()).catch((error) => console.error("Desktop safety backup failed:", error));
}, 10 * 60 * 1000);

let storyExitFlushStarted = false;
function flushStoryOnExit() {
  if (storyExitFlushStarted || !activeStoryDirty || !activeStoryId) return;
  storyExitFlushStarted = true;
  clearStorySaveTimers();

  // Persist a synchronous recovery copy before asking the native bridge to
  // finish its asynchronous file write. This also makes abrupt OS-level closes
  // recoverable even when the webview is destroyed before the bridge responds.
  const story = updateActiveRecordFromEditor();
  if (story) {
    if (nativeStoryStorage) writePendingStoryRecovery(story);
    else persistBrowserStories();
  }
  saveActiveStory(true);
}

window.addEventListener("beforeunload", flushStoryOnExit);
window.addEventListener("pagehide", flushStoryOnExit);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && activeStoryDirty) {
    flushStorySave().catch((error) => console.error("Could not flush the story when the app was backgrounded:", error));
  }
});
