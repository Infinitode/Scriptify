let transcribing = false;

async function toggleTranscription() {
  const button = document.getElementById("transcribe");
  const timer = document.getElementById("timer");
  const api = getNativeApi();

  if (!api || typeof api.start_transcription !== "function") {
    displayMessage("Voice transcription is available in the desktop app.");
    return;
  }

  button.disabled = true;
  try {
    if (!transcribing) {
      const response = await Promise.resolve(api.start_transcription());
      transcribing = true;
      button.classList.add("is-listening");
      button.setAttribute("aria-label", "Stop voice transcription");
      button.title = "Stop voice transcription";
      timer.classList.add("is-listening");
      timer.textContent = "Listening…";
      if (response) console.log(response);
    } else {
      const response = await Promise.resolve(api.stop_transcription());
      transcribing = false;
      button.classList.remove("is-listening");
      button.setAttribute("aria-label", "Start voice transcription");
      button.title = "Start voice transcription";
      timer.classList.remove("is-listening");
      timer.textContent = "Ready to dictate";
      if (response) console.log(response);
    }
  } catch (error) {
    console.error("Transcription error:", error);
    displayMessage("Voice transcription could not be started.", "error");
    transcribing = false;
    button.classList.remove("is-listening");
    timer.classList.remove("is-listening");
    timer.textContent = "Ready to dictate";
  } finally {
    button.disabled = false;
  }
}

function handleTranscriptionFailure(message) {
  transcribing = false;
  const button = document.getElementById("transcribe");
  const timer = document.getElementById("timer");
  if (button) {
    button.classList.remove("is-listening");
    button.disabled = false;
    button.setAttribute("aria-label", "Start voice transcription");
    button.title = "Start voice transcription";
  }
  if (timer) {
    timer.classList.remove("is-listening");
    timer.textContent = "Ready to dictate";
  }
  displayMessage(message || "Voice transcription stopped unexpectedly.", "error");
}

document.getElementById("transcribe").addEventListener("click", toggleTranscription);

function updateTimer(remainingTime) {
  const timer = document.getElementById("timer");
  if (!timer) return;
  if (transcribing && remainingTime > 0) {
    timer.textContent = `Listening · ${remainingTime}s`;
    timer.classList.add("is-listening");
  } else if (transcribing) {
    timer.textContent = "Processing speech…";
  } else {
    timer.textContent = "Ready to dictate";
    timer.classList.remove("is-listening");
  }
}

function saveSelection1() {
  return saveSelection() || savedEditorRange;
}

function restoreSelection1(range) {
  if (!range) return;
  contentEditor.focus();
  restoreSelection(range);
}

function updateTranscribedText(text) {
  const value = String(text || "").trim();
  if (!value || document.body.classList.contains("reader-mode")) return;

  let range = saveSelection1();
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(contentEditor);
    range.collapse(false);
  }

  const node = range.commonAncestorContainer;
  const target = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!target || !contentEditor.contains(target)) {
    range = document.createRange();
    range.selectNodeContents(contentEditor);
    range.collapse(false);
  }

  const selection = window.getSelection();
  if (!range.collapsed) range.deleteContents();

  const paragraph = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? range.startContainer.closest && range.startContainer.closest("p, h2, h3, h4, blockquote, li")
    : range.startContainer.parentElement && range.startContainer.parentElement.closest("p, h2, h3, h4, blockquote, li");

  if (paragraph && contentEditor.contains(paragraph)) {
    const needsSpace = range.startOffset > 0 && !/\s$/.test(range.startContainer.textContent || "");
    const chunk = document.createTextNode(`${needsSpace ? " " : ""}${value}`);
    range.insertNode(chunk);
    range.setStartAfter(chunk);
    range.collapse(true);
  } else {
    const block = document.createElement("p");
    block.textContent = value;
    range.insertNode(block);
    range.setStart(block, 1);
    range.collapse(true);
  }

  selection.removeAllRanges();
  selection.addRange(range);
  savedEditorRange = range.cloneRange();
  contentEditor.dispatchEvent(new Event("input", { bubbles: true }));
}
