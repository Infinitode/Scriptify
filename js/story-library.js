const STORY_LIBRARY_KEY = "scriptify.story-library.v1";
const ACTIVE_STORY_KEY = "scriptify.active-story.v1";
const LEGACY_DRAFT_KEY = "scriptify.local-draft.v1";
const RECENT_STORY_LIMIT = 5;

let storyRecords = [];
let activeStoryId = null;
let activeStoryCreatedAt = null;
let storyLibraryInitialized = false;
let storyLibraryInitializing = false;
let nativeStoryStorage = false;
let isLoadingStory = false;
let activeStoryDirty = false;
let storyEditVersion = 0;
let isStoryLibraryOpen = false;
let editorLockDepth = 0;
let storySaveTimer = null;
let renameTargetId = null;
let renameReturnFocus = null;

const recentStoriesList = document.getElementById("recentStoriesList");
const storyLibraryView = document.getElementById("storyLibraryView");
const libraryStoryList = document.getElementById("libraryStoryList");
const renameDialog = document.getElementById("renameDialog");
const renameInput = document.getElementById("renameInput");

function makeStoryId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (window.crypto && typeof window.crypto.getRandomValues === "function") window.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function safeDate(value, fallback = new Date().toISOString()) {
  const date = value ? new Date(value) : new Date(fallback);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function storyPlainText(html) {
  const container = document.createElement("div");
  container.innerHTML = html || "";
  return (container.innerText || container.textContent || "").replace(/\u00a0/g, " ").trim();
}

function storyPreview(record) {
  return record.preview || storyPlainText(record.content || "").slice(0, 180);
}

function normalizeStory(record) {
  const createdAt = safeDate(record && record.createdAt);
  return {
    id: String(record && record.id || makeStoryId()),
    name: String(record && record.name || storyPlainText(record && record.title) || "Untitled story").trim() || "Untitled story",
    title: typeof (record && record.title) === "string" ? record.title : "",
    content: typeof (record && record.content) === "string" ? record.content : "",
    preview: String(record && record.preview || ""),
    createdAt,
    updatedAt: safeDate(record && record.updatedAt, createdAt)
  };
}

function sortStories() {
  storyRecords.sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
}

function getStoryById(id) {
  return storyRecords.find((story) => story.id === id) || null;
}

async function withEditorLocked(operation) {
  const appShell = document.querySelector(".app-shell");
  editorLockDepth += 1;
  if (appShell) appShell.inert = true;
  try {
    return await operation();
  } finally {
    editorLockDepth = Math.max(0, editorLockDepth - 1);
    if (appShell) {
      appShell.inert = editorLockDepth > 0 || isStoryLibraryOpen || storyLibraryInitializing || isOpeningStoryLibrary || renameDialog.classList.contains("show");
    }
  }
}

function storeActiveStoryId(id) {
  try {
    if (id) localStorage.setItem(ACTIVE_STORY_KEY, id);
    else localStorage.removeItem(ACTIVE_STORY_KEY);
  } catch (error) {
    console.warn("Could not remember the active story:", error);
  }
}

function readBrowserStories() {
  try {
    const stored = localStorage.getItem(STORY_LIBRARY_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeStory) : [];
  } catch (error) {
    console.warn("Could not read the local story library:", error);
    return [];
  }
}

function persistBrowserStories() {
  try {
    localStorage.setItem(STORY_LIBRARY_KEY, JSON.stringify(storyRecords));
    return true;
  } catch (error) {
    console.error("Could not save the local story library:", error);
    markSaveState("error");
    return false;
  }
}

function readLegacyDraft() {
  try {
    const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== "object" || (!draft.title && !draft.content)) return null;
    const now = safeDate(draft.updatedAt);
    return normalizeStory({
      id: makeStoryId(),
      name: storyPlainText(draft.title) || "Untitled story",
      title: draft.title || "",
      content: draft.content || "",
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    console.warn("Could not migrate the previous local draft:", error);
    return null;
  }
}

function storyDate(value, includeYear = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, includeYear
    ? { month: "short", day: "numeric", year: "numeric" }
    : { month: "short", day: "numeric" }).format(date);
}

function appendStoryAction(menu, id, action, label, icon, destructive = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.storyAction = action;
  button.dataset.storyId = id;
  if (destructive) button.classList.add("is-destructive");
  const iconElement = document.createElement("i");
  iconElement.className = `bi ${icon}`;
  iconElement.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = label;
  button.append(iconElement, text);
  menu.appendChild(button);
}

function createStoryMenu(id, fullView = false) {
  const wrapper = document.createElement("div");
  wrapper.className = fullView ? "story-menu-wrap library-story-menu" : "story-menu-wrap";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "story-more-button";
  toggle.dataset.menuToggle = "true";
  toggle.setAttribute("aria-haspopup", "true");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "More story actions");
  const icon = document.createElement("i");
  icon.className = "bi bi-three-dots";
  icon.setAttribute("aria-hidden", "true");
  toggle.appendChild(icon);

  const menu = document.createElement("div");
  menu.className = "story-context-menu";
  menu.hidden = true;
  menu.inert = true;
  menu.setAttribute("role", "menu");
  menu.dataset.menuFor = id;
  appendStoryAction(menu, id, "rename", "Rename", "bi-pencil-square");
  appendStoryAction(menu, id, "copy", "Make a copy", "bi-copy");
  menu.appendChild(document.createElement("div")).className = "story-menu-divider";
  appendStoryAction(menu, id, "delete", "Delete story", "bi-trash3", true);
  wrapper.append(toggle, menu);
  return wrapper;
}

function createRecentStoryRow(story) {
  const row = document.createElement("div");
  row.className = "recent-story-row";
  row.dataset.storyId = story.id;
  row.classList.toggle("is-active", story.id === activeStoryId);

  const open = document.createElement("button");
  open.type = "button";
  open.className = "recent-story-open";
  open.dataset.openStory = story.id;
  open.title = `Open ${story.name}`;
  const icon = document.createElement("span");
  icon.className = "recent-story-icon";
  const fileIcon = document.createElement("i");
  fileIcon.className = story.id === activeStoryId ? "bi bi-file-earmark-text-fill" : "bi bi-file-earmark-text";
  fileIcon.setAttribute("aria-hidden", "true");
  icon.appendChild(fileIcon);
  const text = document.createElement("span");
  text.className = "recent-story-copy";
  const title = document.createElement("strong");
  title.textContent = story.name;
  const meta = document.createElement("small");
  meta.textContent = `Edited ${storyDate(story.updatedAt)} · Started ${storyDate(story.createdAt)}`;
  text.append(title, meta);
  open.append(icon, text);
  row.append(open, createStoryMenu(story.id));
  return row;
}

function renderRecentStories() {
  if (!recentStoriesList) return;
  const sorted = [...storyRecords].sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
  const recent = sorted.slice(0, RECENT_STORY_LIMIT);
  recentStoriesList.replaceChildren(...recent.map(createRecentStoryRow));
  const count = document.getElementById("recentStoryCount");
  if (count) count.textContent = String(storyRecords.length);
  const libraryCount = document.getElementById("libraryStoryCount");
  if (libraryCount) libraryCount.textContent = `${storyRecords.length} ${storyRecords.length === 1 ? "story" : "stories"}`;
  if (isStoryLibraryOpen) renderStoryLibraryList();
}

function createDateCell(label, value) {
  const cell = document.createElement("div");
  cell.className = "library-date-cell";
  const heading = document.createElement("span");
  heading.className = "mobile-date-label";
  heading.textContent = label;
  const time = document.createElement("time");
  time.dateTime = value || "";
  time.title = value ? new Date(value).toLocaleString() : "Unknown date";
  time.textContent = storyDate(value);
  cell.append(heading, time);
  return cell;
}

function createLibraryStoryRow(story) {
  const row = document.createElement("article");
  row.className = "library-story-row";
  row.dataset.storyId = story.id;
  row.classList.toggle("is-active", story.id === activeStoryId);

  const summary = document.createElement("div");
  summary.className = "library-story-summary";
  const cover = document.createElement("span");
  cover.className = "library-story-cover";
  const coverIcon = document.createElement("i");
  coverIcon.className = "bi bi-file-earmark-text";
  coverIcon.setAttribute("aria-hidden", "true");
  cover.appendChild(coverIcon);
  const description = document.createElement("div");
  description.className = "library-story-description";
  const title = document.createElement("h2");
  title.textContent = story.name;
  const preview = document.createElement("p");
  preview.textContent = storyPreview(story) || "A blank page, ready when you are.";
  description.append(title, preview);
  summary.append(cover, description);

  const actions = document.createElement("div");
  actions.className = "library-row-actions";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "library-open-button";
  open.dataset.openStory = story.id;
  open.textContent = story.id === activeStoryId ? "Continue writing" : "Open story";
  actions.append(open, createStoryMenu(story.id, true));
  row.append(summary, createDateCell("Started", story.createdAt), createDateCell("Last edited", story.updatedAt), actions);
  return row;
}

function renderStoryLibraryList() {
  if (!libraryStoryList) return;
  const search = (document.getElementById("storySearch")?.value || "").trim().toLocaleLowerCase();
  const filtered = storyRecords.filter((story) => {
    if (!search) return true;
    return `${story.name} ${storyPreview(story)}`.toLocaleLowerCase().includes(search);
  }).sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
  libraryStoryList.replaceChildren(...filtered.map(createLibraryStoryRow));
  const empty = document.getElementById("libraryEmpty");
  empty.hidden = filtered.length > 0;
  if (empty.hidden) return;
  const title = empty.querySelector("h2");
  const description = empty.querySelector("p");
  if (storyRecords.length && search) {
    title.textContent = "No matching stories";
    description.textContent = "Try another title or phrase.";
  } else {
    title.textContent = "No stories found";
    description.textContent = "Start a new story and it will be saved here automatically.";
  }
}

function closeStoryMenus(except = null) {
  document.querySelectorAll(".story-context-menu:not([hidden])").forEach((menu) => {
    if (menu === except) return;
    menu.hidden = true;
    menu.inert = true;
    const toggle = menu.parentElement && menu.parentElement.querySelector("[data-menu-toggle]");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });
}

function toggleStoryMenu(toggle) {
  const menu = toggle.parentElement.querySelector(".story-context-menu");
  if (!menu) return;
  const open = menu.hidden;
  closeStoryMenus(menu);
  menu.hidden = !open;
  menu.inert = !open;
  toggle.setAttribute("aria-expanded", String(open));
  if (open) {
    const firstAction = menu.querySelector("[data-story-action]");
    if (firstAction) firstAction.focus();
  }
}

function updateActiveRecordFromEditor() {
  const story = getStoryById(activeStoryId);
  if (!story) return null;
  story.name = getPlainText(titleEditor) || "Untitled story";
  story.title = titleEditor.innerHTML;
  story.content = contentEditor.innerHTML;
  story.preview = storyPlainText(contentEditor.innerHTML).slice(0, 180);
  story.createdAt = activeStoryCreatedAt || story.createdAt || new Date().toISOString();
  story.updatedAt = new Date().toISOString();
  return story;
}

async function persistStory(story) {
  if (nativeStoryStorage) {
    const api = getNativeApi();
    const response = await Promise.resolve(api.save_story(story.id, story.name, story.title, story.content, story.createdAt));
    if (!response || response.ok === false) throw new Error(response && response.error || "The story could not be saved.");
  } else if (!persistBrowserStories()) {
    throw new Error("The story could not be saved on this device.");
  }
  return story;
}

let activeSavePromise = null;
async function saveActiveStory(force = false) {
  if (!storyLibraryInitialized || !activeStoryId || isLoadingStory) return false;
  if (!activeStoryDirty && !force) return true;
  if (activeSavePromise) {
    const previousResult = await activeSavePromise;
    if (activeStoryDirty && activeStoryId) return saveActiveStory(force);
    return previousResult;
  }

  const story = updateActiveRecordFromEditor();
  if (!story) return false;
  const versionAtStart = storyEditVersion;
  const storyIdAtStart = activeStoryId;
  storeActiveStoryId(activeStoryId);
  sortStories();
  renderRecentStories();
  markSaveState("saving", "Saving story…");
  let savePromise;
  savePromise = (async () => {
    try {
      await persistStory(story);
      sortStories();
      renderRecentStories();
      if (activeStoryId === storyIdAtStart) {
        activeStoryDirty = storyEditVersion !== versionAtStart;
        if (!activeStoryDirty) markSaveState("saved", "All changes saved");
      }
      return true;
    } catch (error) {
      console.error("Automatic story save failed:", error);
      markSaveState("error", "Story could not be saved.");
      return false;
    } finally {
      if (activeSavePromise === savePromise) activeSavePromise = null;
    }
  })();
  activeSavePromise = savePromise;
  return await savePromise;
}

function scheduleStorySave() {
  if (isLoadingStory || !storyLibraryInitialized || !activeStoryId) return;
  const story = updateActiveRecordFromEditor();
  if (!story) return;
  storyEditVersion += 1;
  activeStoryDirty = true;
  sortStories();
  renderRecentStories();
  markSaveState("saving", "Saving story…");
  if (storySaveTimer) clearTimeout(storySaveTimer);
  storySaveTimer = setTimeout(() => {
    storySaveTimer = null;
    saveActiveStory();
  }, 900);
}

document.addEventListener("scriptify:document-change", scheduleStorySave);

async function flushStorySave() {
  const pending = Boolean(storySaveTimer);
  if (storySaveTimer) {
    clearTimeout(storySaveTimer);
    storySaveTimer = null;
  }
  if (!pending && !activeStoryDirty) return true;
  return saveActiveStory(true);
}

async function getFullStory(id) {
  const api = getNativeApi();
  if (nativeStoryStorage && api && typeof api.load_story === "function") {
    const story = await Promise.resolve(api.load_story(id));
    return story ? normalizeStory(story) : null;
  }
  return getStoryById(id);
}

async function activateStory(storyOrId, options = {}) {
  const id = typeof storyOrId === "string" ? storyOrId : storyOrId && storyOrId.id;
  if (!id) return false;
  if (!options.skipSave && activeStoryId && activeStoryId !== id) {
    if (!await flushStorySave()) {
      displayMessage("Your current story could not be saved, so it was not switched.", "error");
      return false;
    }
  } else if (storySaveTimer) {
    clearTimeout(storySaveTimer);
    storySaveTimer = null;
  }

  let story = typeof storyOrId === "object" ? normalizeStory(storyOrId) : await getFullStory(id);
  if (!story) {
    displayMessage("That story could not be opened.", "error");
    return false;
  }
  const existing = getStoryById(story.id);
  if (existing) Object.assign(existing, story);
  else storyRecords.push(story);

  activeStoryId = story.id;
  activeStoryCreatedAt = story.createdAt;
  activeStoryDirty = false;
  storyEditVersion += 1;
  storeActiveStoryId(activeStoryId);
  isLoadingStory = true;
  try {
    titleEditor.innerHTML = story.title || "";
    contentEditor.innerHTML = story.content || "";
    refreshEditorMetadata();
  } finally {
    isLoadingStory = false;
  }
  sortStories();
  renderRecentStories();
  markSaveState("saved", "All changes saved");
  if (options.closeLibrary !== false && isStoryLibraryOpen) closeStoryLibrary({ focusEditor: true });
  if (options.focusEditor) contentEditor.focus();
  return true;
}

async function createNewStory(options = {}) {
  return withEditorLocked(async () => {
    if (options.saveCurrent !== false && activeStoryId && !await flushStorySave()) {
      displayMessage("Your current story could not be saved, so a new one was not created.", "error");
      return null;
    }
    const now = new Date().toISOString();
    const story = normalizeStory({
      id: makeStoryId(),
      name: "Untitled story",
      title: "",
      content: "",
      createdAt: now,
      updatedAt: now
    });
    storyRecords.unshift(story);
    activeStoryId = story.id;
    activeStoryCreatedAt = story.createdAt;
    activeStoryDirty = true;
    storyEditVersion += 1;
    storeActiveStoryId(activeStoryId);
    isLoadingStory = true;
    try {
      titleEditor.innerHTML = "";
      contentEditor.innerHTML = "";
      editorScroll.scrollTop = 0;
      refreshEditorMetadata();
    } finally {
      isLoadingStory = false;
    }
    storyLibraryInitialized = true;
    sortStories();
    renderRecentStories();
    await saveActiveStory();
    if (options.closeLibrary !== false && isStoryLibraryOpen) closeStoryLibrary({ focusEditor: true });
    if (options.focus !== false) titleEditor.focus();
    return story;
  });
}

async function openStory(id) {
  if (id === activeStoryId) {
    if (isStoryLibraryOpen) closeStoryLibrary({ focusEditor: true });
    return true;
  }
  return withEditorLocked(async () => {
    try {
      const opened = await activateStory(id, { closeLibrary: true });
      if (opened) displayMessage("Story opened. Keep writing right where you left off.", "success");
      return opened;
    } catch (error) {
      console.error("Could not open story:", error);
      displayMessage("That story could not be opened.", "error");
      return false;
    }
  });
}

let isOpeningStoryLibrary = false;
async function openStoryLibrary() {
  if (!storyLibraryInitialized) {
    displayMessage("Your story library is still loading.");
    return;
  }
  if (isStoryLibraryOpen || isOpeningStoryLibrary) return;
  isOpeningStoryLibrary = true;
  const appShell = document.querySelector(".app-shell");
  if (typeof closeOpenSurfaces === "function") closeOpenSurfaces();
  if (appShell) appShell.inert = true;
  try {
    if (!await flushStorySave()) {
      displayMessage("Your current story could not be saved, so the library was not opened.", "error");
      return;
    }
    isStoryLibraryOpen = true;
    storyLibraryView.classList.add("show");
    storyLibraryView.setAttribute("aria-hidden", "false");
    storyLibraryView.inert = false;
    closeStoryMenus();
    document.getElementById("storySearch").value = "";
    renderStoryLibraryList();
    document.getElementById("storySearch").focus();
  } finally {
    isOpeningStoryLibrary = false;
    if (!isStoryLibraryOpen && appShell) appShell.inert = false;
  }
}

function closeStoryLibrary(options = {}) {
  isStoryLibraryOpen = false;
  storyLibraryView.classList.remove("show");
  storyLibraryView.setAttribute("aria-hidden", "true");
  storyLibraryView.inert = true;
  document.querySelector(".app-shell").inert = false;
  closeStoryMenus();
  if (options.focusEditor) {
    contentEditor.focus();
  } else {
    document.getElementById("viewAllStories").focus();
  }
}

function updateRecordInCache(updatedStory) {
  const updated = normalizeStory(updatedStory);
  const index = storyRecords.findIndex((story) => story.id === updated.id);
  if (index >= 0) storyRecords[index] = { ...storyRecords[index], ...updated };
  else storyRecords.push(updated);
  sortStories();
  if (!nativeStoryStorage) persistBrowserStories();
  renderRecentStories();
  return getStoryById(updated.id);
}

async function openRenameDialog(id, returnFocus) {
  const story = getStoryById(id);
  if (!story) return;
  closeStoryMenus();
  const appShell = document.querySelector(".app-shell");
  if (id === activeStoryId) {
    if (!isStoryLibraryOpen && appShell) appShell.inert = true;
    if (!await flushStorySave()) {
      if (appShell) appShell.inert = isStoryLibraryOpen;
      displayMessage("Your current story could not be saved, so it was not renamed.", "error");
      return;
    }
  }
  renameTargetId = id;
  renameReturnFocus = returnFocus || document.activeElement;
  renameInput.value = story.name;
  renameDialog.classList.add("show");
  renameDialog.setAttribute("aria-hidden", "false");
  renameDialog.inert = false;
  if (appShell) appShell.inert = true;
  storyLibraryView.inert = true;
  renameInput.focus();
  renameInput.select();
}

function closeRenameDialog() {
  if (!renameDialog.classList.contains("show")) return;
  renameDialog.classList.remove("show");
  renameDialog.setAttribute("aria-hidden", "true");
  renameDialog.inert = true;
  storyLibraryView.inert = !isStoryLibraryOpen;
  document.querySelector(".app-shell").inert = isStoryLibraryOpen;
  const focusTarget = renameReturnFocus;
  renameTargetId = null;
  renameReturnFocus = null;
  if (focusTarget && focusTarget.isConnected && !focusTarget.closest("[inert]")) focusTarget.focus();
  else if (isStoryLibraryOpen) document.getElementById("storySearch").focus();
  else document.getElementById("viewAllStories").focus();
}

async function saveStoryRename() {
  const story = getStoryById(renameTargetId);
  const name = renameInput.value.trim();
  if (!story) return closeRenameDialog();
  if (!name) {
    displayMessage("Give this story a name first.");
    renameInput.focus();
    return;
  }

  const id = story.id;
  const api = getNativeApi();
  try {
    if (nativeStoryStorage && api && typeof api.rename_story === "function") {
      const response = await Promise.resolve(api.rename_story(id, name));
      if (!response || response.ok === false) throw new Error(response && response.error || "Rename failed.");
      story.name = name;
      story.title = escapeHtml(name);
      story.updatedAt = response.story && response.story.updatedAt || new Date().toISOString();
    } else {
      const previous = { name: story.name, title: story.title, updatedAt: story.updatedAt };
      story.name = name;
      story.title = escapeHtml(name);
      story.updatedAt = new Date().toISOString();
      if (!persistBrowserStories()) {
        Object.assign(story, previous);
        throw new Error("The story could not be renamed in this browser.");
      }
    }

    if (activeStoryId === id) {
      isLoadingStory = true;
      titleEditor.textContent = name;
      refreshEditorMetadata();
      isLoadingStory = false;
      story.title = titleEditor.innerHTML;
    }
    sortStories();
    renderRecentStories();
    renderStoryLibraryList();
    closeRenameDialog();
    if (activeStoryId === id) await saveActiveStory();
    displayMessage("Story renamed.", "success");
  } catch (error) {
    console.error("Could not rename story:", error);
    displayMessage(error.message || "The story could not be renamed.", "error");
  }
}

async function duplicateStory(id) {
  closeStoryMenus();
  return withEditorLocked(async () => {
    try {
      if (!await flushStorySave()) {
        displayMessage("Your current story could not be saved, so it was not copied.", "error");
        return;
      }
      const original = await getFullStory(id);
      if (!original) {
        displayMessage("That story could not be copied.", "error");
        return;
      }
      const api = getNativeApi();
      let copy;
      if (nativeStoryStorage && api && typeof api.duplicate_story === "function") {
        const response = await Promise.resolve(api.duplicate_story(id));
        if (!response || response.ok === false) throw new Error(response && response.error || "Copy failed.");
        copy = normalizeStory(response.story);
      } else {
        const now = new Date().toISOString();
        const name = `Copy of ${original.name}`.slice(0, 160);
        copy = normalizeStory({ ...original, id: makeStoryId(), name, title: escapeHtml(name), createdAt: now, updatedAt: now });
        storyRecords.push(copy);
        if (!persistBrowserStories()) {
          storyRecords = storyRecords.filter((story) => story.id !== copy.id);
          throw new Error("The copy could not be saved in this browser.");
        }
        sortStories();
        renderRecentStories();
      }
      if (nativeStoryStorage) updateRecordInCache(copy);
      const opened = await activateStory(copy, { closeLibrary: true });
      if (opened) displayMessage("A copy is ready to edit.", "success");
    } catch (error) {
      console.error("Could not copy story:", error);
      displayMessage(error.message || "The story could not be copied.", "error");
    }
  });
}

async function deleteStory(id) {
  closeStoryMenus();
  const story = getStoryById(id);
  if (!story) return;
  if (!window.confirm(`Delete “${story.name}”? This cannot be undone.`)) return;

  return withEditorLocked(async () => {
    const deletingActiveStory = id === activeStoryId;
    const recordsBeforeDelete = [...storyRecords];
    if (deletingActiveStory) await flushStorySave();
    try {
      const api = getNativeApi();
      if (nativeStoryStorage && api && typeof api.delete_story === "function") {
        const response = await Promise.resolve(api.delete_story(id));
        if (!response || response.ok === false) throw new Error(response && response.error || "Delete failed.");
      } else {
        storyRecords = storyRecords.filter((entry) => entry.id !== id);
      }
      storyRecords = storyRecords.filter((entry) => entry.id !== id);

      if (id === activeStoryId) {
        activeStoryId = null;
        activeStoryCreatedAt = null;
        storeActiveStoryId(null);
        const next = [...storyRecords].sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt))[0];
        const loaded = next ? await activateStory(next.id, { skipSave: true, closeLibrary: false }) : false;
        if (!loaded) await createNewStory({ saveCurrent: false, closeLibrary: false, focus: false });
      }
      if (!nativeStoryStorage && !persistBrowserStories()) {
        if (!deletingActiveStory) {
          storyRecords = recordsBeforeDelete;
          renderRecentStories();
        }
        throw new Error("The story could not be deleted from this browser.");
      }
      renderRecentStories();
      displayMessage("Story deleted.", "success");
    } catch (error) {
      console.error("Could not delete story:", error);
      displayMessage(error.message || "The story could not be deleted.", "error");
    }
  });
}

async function runStoryAction(action, id, sourceButton) {
  if (action === "rename") await openRenameDialog(id, sourceButton);
  else if (action === "copy") await duplicateStory(id);
  else if (action === "delete") await deleteStory(id);
}

function handleStoryListClick(event) {
  const menuToggle = event.target.closest("[data-menu-toggle]");
  if (menuToggle) {
    event.stopPropagation();
    toggleStoryMenu(menuToggle);
    return;
  }
  const action = event.target.closest("[data-story-action]");
  if (action) {
    event.stopPropagation();
    runStoryAction(action.dataset.storyAction, action.dataset.storyId, action);
    return;
  }
  const open = event.target.closest("[data-open-story]");
  if (open) openStory(open.dataset.openStory);
}

recentStoriesList.addEventListener("click", handleStoryListClick);
libraryStoryList.addEventListener("click", handleStoryListClick);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".story-menu-wrap")) closeStoryMenus();
});

document.getElementById("toggleRecent").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const collapsed = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!collapsed));
  recentStoriesList.hidden = collapsed;
});
document.getElementById("viewAllStories").addEventListener("click", openStoryLibrary);
document.getElementById("closeLibrary").addEventListener("click", () => closeStoryLibrary());
document.getElementById("newStoryFromLibrary").addEventListener("click", () => createNewStory());
document.getElementById("emptyLibraryNew").addEventListener("click", () => createNewStory());
document.getElementById("storySearch").addEventListener("input", renderStoryLibraryList);
document.getElementById("renameClose").addEventListener("click", closeRenameDialog);
document.getElementById("renameCancel").addEventListener("click", closeRenameDialog);
document.getElementById("renameSave").addEventListener("click", saveStoryRename);
renameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveStoryRename();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (renameDialog.classList.contains("show")) {
      closeRenameDialog();
      return;
    }
    if (isStoryLibraryOpen) closeStoryLibrary();
  }
});

async function initializeStoryLibrary() {
  if (storyLibraryInitialized || storyLibraryInitializing) return;
  storyLibraryInitializing = true;
  const appShell = document.querySelector(".app-shell");
  if (appShell) appShell.inert = true;

  try {
    let records = [];
    const api = getNativeApi();
    if (api && typeof api.list_stories === "function") {
      try {
        records = await Promise.resolve(api.list_stories());
        if (!Array.isArray(records)) throw new Error(records && records.error || "The story library returned an invalid response.");
        nativeStoryStorage = true;
        records = records.map(normalizeStory);
      } catch (error) {
        console.error("Could not access the application story library:", error);
        nativeStoryStorage = false;
        records = readBrowserStories();
        displayMessage("Using this browser's local story library for now.", "error");
      }
    } else {
      nativeStoryStorage = false;
      records = readBrowserStories();
    }

    storyRecords = records;
    if (!storyRecords.length) {
      const legacy = readLegacyDraft();
      if (legacy) {
        storyRecords.push(legacy);
        if (nativeStoryStorage) {
          try { await persistStory(legacy); } catch (error) { console.error("Could not migrate the previous draft:", error); }
        } else {
          persistBrowserStories();
        }
      }
    }

    sortStories();
    storyLibraryInitialized = true;
    const storedActiveId = (() => {
      try { return localStorage.getItem(ACTIVE_STORY_KEY); } catch (error) { return null; }
    })();
    const selected = storyRecords.find((story) => story.id === storedActiveId) || storyRecords[0];
    const loaded = selected ? await activateStory(selected.id, { skipSave: true, closeLibrary: false }) : false;
    if (!loaded) await createNewStory({ saveCurrent: false, closeLibrary: false, focus: false });
    renderRecentStories();
  } catch (error) {
    console.error("Story library initialization failed:", error);
    storyLibraryInitialized = true;
    nativeStoryStorage = false;
    storyRecords = readBrowserStories();
    if (!storyRecords.length) await createNewStory({ saveCurrent: false, closeLibrary: false, focus: false });
    else await activateStory(storyRecords[0].id, { skipSave: true, closeLibrary: false });
    displayMessage("The story library opened in local browser storage.", "error");
  } finally {
    storyLibraryInitializing = false;
    if (appShell) appShell.inert = isStoryLibraryOpen;
  }
}

if (window.pywebview && window.pywebview.api) {
  initializeStoryLibrary();
} else {
  document.addEventListener("pywebviewready", initializeStoryLibrary, { once: true });
  // A normal browser has no pywebview bridge; use its local story library.
  if (window.location.protocol !== "file:") initializeStoryLibrary();
  else setTimeout(() => { if (!storyLibraryInitialized) initializeStoryLibrary(); }, 8000);
}
