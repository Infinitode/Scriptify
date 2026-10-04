const titleEditor = document.getElementById("Title");
const contentEditor = document.getElementById("transcribedText");
const editorScroll = document.getElementById("editorScroll");
const formatMenu = document.getElementById("formatMenu");
const formatMenuToggle = document.getElementById("formatMenuToggle");
const toastMessage = document.getElementById("toastMessage");

let savedEditorRange = null;
let messageTimer = null;
let readerFontSize = 19;

function loadReaderTheme() {
  try {
    return window.localStorage.getItem("scriptify.readerTheme") === "dark" ? "dark" : "light";
  } catch (error) {
    return "light";
  }
}

let readerTheme = loadReaderTheme();

function getNativeApi() {
  return window.pywebview && window.pywebview.api ? window.pywebview.api : null;
}

function getPlainText(element) {
  return (element && (element.innerText || element.textContent) || "").replace(/\u00a0/g, " ").trim();
}

function getDocumentData() {
  return {
    title: titleEditor.innerHTML,
    content: contentEditor.innerHTML,
    updatedAt: new Date().toISOString()
  };
}

function markSaveState(state, message) {
  const status = document.getElementById("saveStatus");
  const dot = document.getElementById("saveDot");
  if (!status || !dot) return;

  status.textContent = message || (state === "saving" ? "Saving…" : state === "error" ? "Could not save" : "All changes saved");
  dot.classList.toggle("is-saving", state === "saving");
  dot.classList.toggle("has-error", state === "error");
}

function getWordCount(text) {
  const matches = text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu);
  return matches ? matches.length : 0;
}

function countWords() {
  const text = [getPlainText(titleEditor), getPlainText(contentEditor)].filter(Boolean).join(" ");
  const count = getWordCount(text);
  const formattedCount = new Intl.NumberFormat().format(count);
  const draftCount = document.getElementById("draft-word-count");
  if (draftCount) draftCount.textContent = `${formattedCount} ${count === 1 ? "word" : "words"}`;
  return count;
}

function refreshEditorMetadata() {
  const title = getPlainText(titleEditor) || "Untitled story";
  const topbarTitle = document.getElementById("topbarTitle");
  const draftLabel = document.querySelector(".draft-label > span:nth-child(2)");
  if (topbarTitle) topbarTitle.textContent = title;
  if (draftLabel) draftLabel.textContent = title === "Untitled story" ? "Untitled draft" : title;
  countWords();
  document.dispatchEvent(new CustomEvent("scriptify:document-change"));
}

function saveSelection() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;
  const range = selection.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (element && contentEditor.contains(element)) return range.cloneRange();
  return null;
}

function restoreSelection(range) {
  if (!range) return false;
  try {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch (error) {
    return false;
  }
}

function selectionBelongsToEditor() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return false;
  const node = selection.getRangeAt(0).commonAncestorContainer;
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return Boolean(element && contentEditor.contains(element));
}

function focusEditorAtEnd() {
  contentEditor.focus();
  const range = document.createRange();
  range.selectNodeContents(contentEditor);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  savedEditorRange = range.cloneRange();
}

function updateToolbarState() {
  const commands = ["bold", "italic", "underline", "strikeThrough"];
  commands.forEach((command) => {
    const buttonId = command === "strikeThrough" ? "strike" : command;
    const button = document.getElementById(buttonId);
    if (!button) return;
    let active = false;
    try {
      active = selectionBelongsToEditor() && document.queryCommandState(command);
    } catch (error) {
      active = false;
    }
    button.classList.toggle("active", Boolean(active));
    button.setAttribute("aria-pressed", String(Boolean(active)));
  });

  const currentLabel = document.getElementById("currentBlockLabel");
  if (!currentLabel || !selectionBelongsToEditor()) return;
  const selection = window.getSelection();
  const node = selection.getRangeAt(0).startContainer;
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  const block = element && element.closest("h2, h3, h4, blockquote, li, p, div");
  if (!block || !contentEditor.contains(block)) return;
  const labels = { H2: "Heading 1", H3: "Heading 2", H4: "Heading 3", BLOCKQUOTE: "Quote", LI: "List item" };
  currentLabel.textContent = labels[block.tagName] || "Body text";
}

function closeFormatMenu() {
  if (!formatMenu || !formatMenuToggle) return;
  const restoreFocus = !formatMenu.hidden && formatMenu.contains(document.activeElement);
  formatMenu.hidden = true;
  formatMenu.inert = true;
  formatMenuToggle.setAttribute("aria-expanded", "false");
  if (restoreFocus) formatMenuToggle.focus();
}

function toggleFormatMenu() {
  if (!formatMenu || !formatMenuToggle) return;
  const willOpen = formatMenu.hidden;
  formatMenu.hidden = !willOpen;
  formatMenu.inert = !willOpen;
  formatMenuToggle.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) {
    const firstItem = formatMenu.querySelector("[role='menuitem']");
    if (firstItem) firstItem.focus();
  }
}

function formatText(command) {
  if (document.body.classList.contains("reader-mode")) return;
  closeFormatMenu();
  let range = saveSelection() || savedEditorRange;
  const rangeNode = range && range.commonAncestorContainer;
  const rangeElement = rangeNode && (rangeNode.nodeType === Node.ELEMENT_NODE ? rangeNode : rangeNode.parentElement);
  if (!rangeElement || !contentEditor.contains(rangeElement)) range = null;
  contentEditor.focus();
  if (range) restoreSelection(range);
  else focusEditorAtEnd();

  const blockFormats = { paragraph: "p", p: "p", h2: "h2", h3: "h3", h4: "h4", quote: "blockquote", blockquote: "blockquote" };
  try {
    if (blockFormats[command]) {
      document.execCommand("formatBlock", false, blockFormats[command]);
    } else if (["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"].includes(command)) {
      document.execCommand(command, false, null);
    }
  } catch (error) {
    console.error("Unable to format text:", error);
  }

  savedEditorRange = saveSelection() || savedEditorRange;
  contentEditor.dispatchEvent(new Event("input", { bubbles: true }));
  updateToolbarState();
  contentEditor.focus();
}

function displayMessage(message, kind = "info") {
  if (!toastMessage) return;
  if (messageTimer) clearTimeout(messageTimer);
  toastMessage.replaceChildren();
  const icon = document.createElement("i");
  icon.className = `bi ${kind === "error" ? "bi-exclamation-circle" : kind === "success" ? "bi-check-circle" : "bi-info-circle"}`;
  icon.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = String(message || "");
  toastMessage.append(icon, text);
  toastMessage.classList.add("show");
  messageTimer = setTimeout(() => toastMessage.classList.remove("show"), 2600);
}

async function save_file() {
  const api = getNativeApi();
  if (api && typeof api.save_content === "function") {
    try {
      const response = await Promise.resolve(api.save_content());
      if (response) displayMessage(response, String(response).startsWith("Error") ? "error" : "success");
      markSaveState(String(response || "").startsWith("Error") ? "error" : "saved");
    } catch (error) {
      console.error("Save failed:", error);
      displayMessage("The draft could not be saved.", "error");
      markSaveState("error");
    }
    return;
  }

  downloadDocument("scriptify", "application/json", JSON.stringify(getDocumentData(), null, 2), "scriptify");
  displayMessage("Your Scriptify draft was downloaded.", "success");
}

async function open_file() {
  const api = getNativeApi();
  if (api && typeof api.load_content === "function") {
    try {
      const response = await Promise.resolve(api.load_content());
      refreshEditorMetadata();
      if (response) displayMessage(response, String(response).startsWith("Error") ? "error" : "success");
    } catch (error) {
      console.error("Open failed:", error);
      displayMessage("The selected draft could not be opened.", "error");
    }
    return;
  }
  const input = document.getElementById("importFile");
  if (input) {
    input.value = "";
    input.click();
  }
}

async function export_file() {
  const api = getNativeApi();
  if (api && typeof api.export_as === "function") {
    try {
      const response = await Promise.resolve(api.export_as());
      if (response) displayMessage(response, String(response).startsWith("Error") ? "error" : "success");
    } catch (error) {
      console.error("Export failed:", error);
      displayMessage("The draft could not be exported.", "error");
    }
    return;
  }

  const title = getPlainText(titleEditor) || "Untitled story";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${contentEditor.innerHTML}</body></html>`;
  downloadDocument(title, "text/html", html, "html");
  displayMessage("An HTML copy of your draft was downloaded.", "success");
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function downloadDocument(name, mimeType, content, extension) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const safeName = (getPlainText(titleEditor) || name || "Untitled story").replace(/[\\/:*?"<>|]+/g, "-").trim() || "Untitled story";
  anchor.href = url;
  anchor.download = `${safeName}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setDocumentContent(data) {
  if (!data || typeof data !== "object") throw new Error("This file does not contain a Scriptify draft.");
  titleEditor.innerHTML = typeof data.title === "string" ? data.title : "";
  contentEditor.innerHTML = typeof data.content === "string" ? data.content : "";
  refreshEditorMetadata();
  markSaveState("saved");
}

function startNewDocument() {
  if (typeof createNewStory === "function") return createNewStory();
  titleEditor.innerHTML = "";
  contentEditor.innerHTML = "";
  editorScroll.scrollTop = 0;
  refreshEditorMetadata();
  displayMessage("A fresh page is ready.", "success");
}

function clearCurrentDocument() {
  if (!(getPlainText(titleEditor) || getPlainText(contentEditor))) return;
  if (!window.confirm("Clear the writing in this story? This will update its automatic save.")) return;
  titleEditor.innerHTML = "";
  contentEditor.innerHTML = "";
  editorScroll.scrollTop = 0;
  refreshEditorMetadata();
  markSaveState("saving", "Saving story…");
  displayMessage("The current story was cleared.", "success");
  titleEditor.focus();
}

function closeWindow() {
  const api = getNativeApi();
  if (api && typeof api.closeWindow === "function") api.closeWindow();
  else displayMessage("Window controls are available in the desktop app.");
}

function minimizeWindow() {
  const api = getNativeApi();
  if (api && typeof api.minimizeWindow === "function") api.minimizeWindow();
}

function toggleFullscreen() {
  const api = getNativeApi();
  if (api && typeof api.toggleFullscreen === "function") {
    api.toggleFullscreen();
  } else if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => displayMessage("Fullscreen could not be exited."));
  } else if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => displayMessage("Fullscreen is unavailable in this preview."));
  }
}

function updateReaderProgress() {
  if (!document.body.classList.contains("reader-mode")) return;
  const scrollable = editorScroll.scrollHeight - editorScroll.clientHeight;
  const progress = scrollable > 0 ? Math.min(100, Math.round((editorScroll.scrollTop / scrollable) * 100)) : 0;
  const bar = document.getElementById("readerProgressBar");
  const label = document.getElementById("readerProgressText");
  if (bar) bar.style.width = `${progress}%`;
  if (label) label.textContent = `${progress}%`;
}

function setReaderTheme(theme, persist = true) {
  readerTheme = theme === "dark" ? "dark" : "light";
  const isDark = readerTheme === "dark";
  document.body.classList.toggle("reader-dark", isDark);

  const toggle = document.getElementById("readerThemeToggle");
  const icon = document.getElementById("readerThemeIcon");
  const label = toggle && toggle.querySelector(".reader-theme-label");
  const action = isDark ? "Switch to a light reading page" : "Switch to a dark reading page";
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", action);
    toggle.title = action;
  }
  if (icon) icon.className = `bi ${isDark ? "bi-sun" : "bi-moon-stars"}`;
  if (label) label.textContent = isDark ? "Light page" : "Dark page";

  if (persist) {
    try {
      window.localStorage.setItem("scriptify.readerTheme", readerTheme);
    } catch (error) {
      // Theme still applies for this session if persistent storage is unavailable.
    }
  }
}

function toggleReaderTheme() {
  setReaderTheme(readerTheme === "dark" ? "light" : "dark");
}

function toggleReadingMode(force) {
  const entering = typeof force === "boolean" ? force : !document.body.classList.contains("reader-mode");
  if (entering === document.body.classList.contains("reader-mode")) return;
  if (entering && typeof transcribing !== "undefined" && transcribing) {
    displayMessage("Stop transcription before entering reading mode.");
    return;
  }

  if (entering) {
    closeOpenSurfaces();
    savedEditorRange = saveSelection() || savedEditorRange;
    titleEditor.setAttribute("contenteditable", "false");
    contentEditor.setAttribute("contenteditable", "false");
    document.body.classList.add("reader-mode");
    if (typeof hideIdeaCard === "function") hideIdeaCard();
    editorScroll.scrollTop = 0;
  } else {
    document.body.classList.remove("reader-mode");
    titleEditor.setAttribute("contenteditable", "true");
    contentEditor.setAttribute("contenteditable", "true");
  }

  const toggle = document.getElementById("readingModeToggle");
  const controls = document.getElementById("readerControls");
  toggle.setAttribute("aria-pressed", String(entering));
  toggle.setAttribute("aria-label", entering ? "Exit reading mode" : "Enter reading mode");
  toggle.title = entering ? "Exit reading mode" : "Enter reading mode (Ctrl+Shift+R)";
  toggle.querySelector("span").textContent = entering ? "Writing" : "Read";
  toggle.querySelector(".bi").className = entering ? "bi bi-pencil" : "bi bi-book";
  controls.classList.toggle("show", entering);
  controls.setAttribute("aria-hidden", String(!entering));
  controls.inert = !entering;

  if (entering) {
    updateReaderProgress();
    editorScroll.focus({ preventScroll: true });
  } else if (savedEditorRange) {
    contentEditor.focus({ preventScroll: true });
    restoreSelection(savedEditorRange);
  }
}

function closeOpenSurfaces() {
  closeFormatMenu();
  const statsPanel = document.getElementById("statsPanel");
  if (statsPanel && statsPanel.classList.contains("show")) toggleStatsPanel(false);
  const dictionaryPopup = document.getElementById("dictionaryPopup");
  if (dictionaryPopup && dictionaryPopup.classList.contains("show")) closeDictionary();
  if (typeof hideIdeaCard === "function") hideIdeaCard();
}

["bold", "italic", "underline", "strike"].forEach((id) => {
  const button = document.getElementById(id);
  if (!button) return;
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", () => formatText(button.dataset.command));
});

document.querySelectorAll("#formatMenu [data-format]").forEach((item) => {
  item.addEventListener("mousedown", (event) => event.preventDefault());
  item.addEventListener("click", () => formatText(item.dataset.format));
});

formatMenuToggle.addEventListener("mousedown", (event) => event.preventDefault());
formatMenuToggle.addEventListener("click", toggleFormatMenu);
document.getElementById("undo").addEventListener("mousedown", (event) => event.preventDefault());
document.getElementById("redo").addEventListener("mousedown", (event) => event.preventDefault());
document.getElementById("undo").addEventListener("click", () => { contentEditor.focus(); document.execCommand("undo"); });
document.getElementById("redo").addEventListener("click", () => { contentEditor.focus(); document.execCommand("redo"); });

titleEditor.addEventListener("input", () => {
  refreshEditorMetadata();
  markSaveState("saving");
});
contentEditor.addEventListener("input", () => {
  savedEditorRange = saveSelection() || savedEditorRange;
  refreshEditorMetadata();
  markSaveState("saving");
});
contentEditor.addEventListener("keyup", updateToolbarState);
contentEditor.addEventListener("mouseup", updateToolbarState);
document.addEventListener("selectionchange", () => {
  const range = saveSelection();
  if (range) savedEditorRange = range;
  updateToolbarState();
});

titleEditor.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    contentEditor.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".format-control")) closeFormatMenu();
});

document.getElementById("newDocument").addEventListener("click", startNewDocument);
document.getElementById("clearbtn").addEventListener("click", clearCurrentDocument);
document.getElementById("savebtn").addEventListener("click", save_file);
document.getElementById("openbtn").addEventListener("click", open_file);
document.getElementById("exportbtn").addEventListener("click", export_file);
document.getElementById("min").addEventListener("click", minimizeWindow);
document.getElementById("max").addEventListener("click", toggleFullscreen);
document.getElementById("close").addEventListener("click", closeWindow);
document.getElementById("readingModeToggle").addEventListener("click", () => toggleReadingMode());
document.getElementById("readerExit").addEventListener("click", () => toggleReadingMode(false));
document.getElementById("readerThemeToggle").addEventListener("click", toggleReaderTheme);
setReaderTheme(readerTheme, false);
document.getElementById("fontDecrease").addEventListener("click", () => {
  readerFontSize = Math.max(15, readerFontSize - 1);
  document.documentElement.style.setProperty("--reader-font-size", `${readerFontSize}px`);
});
document.getElementById("fontIncrease").addEventListener("click", () => {
  readerFontSize = Math.min(27, readerFontSize + 1);
  document.documentElement.style.setProperty("--reader-font-size", `${readerFontSize}px`);
});
editorScroll.addEventListener("scroll", updateReaderProgress, { passive: true });

const importFile = document.getElementById("importFile");
importFile.addEventListener("change", async () => {
  const file = importFile.files && importFile.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    setDocumentContent(data);
    displayMessage("Draft opened successfully.", "success");
  } catch (error) {
    console.error("Unable to open draft:", error);
    displayMessage("That file could not be opened as a Scriptify draft.", "error");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (document.body.classList.contains("reader-mode")) {
      toggleReadingMode(false);
      return;
    }
    closeOpenSurfaces();
    return;
  }

  const appShell = document.querySelector(".app-shell");
  if (appShell && appShell.inert) return;
  const modifier = event.ctrlKey || event.metaKey;
  if (!modifier) return;
  const key = event.key.toLowerCase();

  if (event.shiftKey && key === "r") {
    event.preventDefault();
    toggleReadingMode();
  } else if (event.altKey && ["1", "2", "3"].includes(key)) {
    event.preventDefault();
    formatText({ "1": "h2", "2": "h3", "3": "h4" }[key]);
  } else if (key === "s") {
    event.preventDefault();
    save_file();
  } else if (key === "o") {
    event.preventDefault();
    open_file();
  } else if (key === "e") {
    event.preventDefault();
    export_file();
  } else if (key === "n") {
    event.preventDefault();
    startNewDocument();
  } else if (key === "r" && !event.shiftKey) {
    event.preventDefault();
    document.getElementById("randombtn").click();
  }
});

refreshEditorMetadata();
markSaveState("saved");
