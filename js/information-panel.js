const statsPanel = document.getElementById("statsPanel");
const statsBackdrop = document.getElementById("statsBackdrop");

function toggleStatsPanel(force) {
  const wasOpen = statsPanel.classList.contains("show");
  const open = typeof force === "boolean" ? force : !wasOpen;
  statsPanel.classList.toggle("show", open);
  statsBackdrop.classList.toggle("show", open);
  statsPanel.setAttribute("aria-hidden", String(!open));
  statsPanel.inert = !open;
  statsBackdrop.setAttribute("aria-hidden", String(!open));
  const appShell = document.querySelector(".app-shell");
  if (appShell) appShell.inert = open;
  if (open && typeof hideIdeaCard === "function") hideIdeaCard();
  document.getElementById("infoPop").setAttribute("aria-expanded", String(open));
  if (open) document.getElementById("statsClose").focus();
  else if (wasOpen && statsPanel.contains(document.activeElement)) document.getElementById("infoPop").focus();
}

document.getElementById("infoPop").addEventListener("click", () => toggleStatsPanel());
document.getElementById("statsClose").addEventListener("click", () => toggleStatsPanel(false));
statsBackdrop.addEventListener("click", () => toggleStatsPanel(false));

function getEditorText(element) {
  return (element.innerText || element.textContent || "").replace(/\u00a0/g, " ").trim();
}

function tokenize(text) {
  return text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || [];
}

function countSyllables(word) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return 1;
  if (normalized.length <= 3) return 1;

  const vowelGroups = normalized.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  if (/e$/.test(normalized) && !/le$/.test(normalized) && count > 1) count -= 1;
  if (/[^aeiouy]le$/.test(normalized)) count += 1;
  return Math.max(1, count);
}

function splitSentences(text) {
  if (!text.trim()) return [];
  const cleaned = text.replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc)\./gi, (match) => match.replace(".", ""));
  const pieces = cleaned.match(/[^.!?]+(?:[.!?]+|$)/g) || [cleaned];
  return pieces.map((sentence) => sentence.trim()).filter((sentence) => tokenize(sentence).length > 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function readingTime(wordCount) {
  if (!wordCount) return "Less than a minute";
  const seconds = Math.max(1, Math.ceil((wordCount / 225) * 60));
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (!remainder) return `${minutes} min`;
  return `${minutes} min ${remainder} sec`;
}

function scoreLabel(score) {
  if (score >= 90) return "Very easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}

function updateTextMetrics() {
  const title = getEditorText(titleEditor);
  const body = getEditorText(contentEditor);
  const fullText = [title, body].filter(Boolean).join("\n");
  const words = tokenize(fullText);
  const wordCount = words.length;
  const sentences = splitSentences(fullText);
  const sentenceCount = sentences.length;
  const paragraphBlocks = Array.from(contentEditor.querySelectorAll("p, h2, h3, h4, blockquote, li, div"))
    .filter((element) => getEditorText(element).length > 0);
  const paragraphCount = body ? Math.max(paragraphBlocks.length, body.split(/\n\s*\n/).filter((block) => block.trim()).length, 1) : 0;
  const headingCount = contentEditor.querySelectorAll("h2, h3, h4").length;
  const characters = fullText.length;
  const charactersWithoutSpaces = fullText.replace(/\s/g, "").length;
  const averageSentenceLength = sentenceCount ? wordCount / sentenceCount : 0;
  const normalizedWords = words.map((word) => word.toLocaleLowerCase());
  const uniqueWords = new Set(normalizedWords).size;
  const vocabularyVariety = wordCount ? (uniqueWords / wordCount) * 100 : 0;
  const syllableCount = words.reduce((total, word) => total + countSyllables(word), 0);
  const fleschScore = wordCount
    ? Math.max(0, Math.min(100, 206.835 - 1.015 * (wordCount / Math.max(sentenceCount, 1)) - 84.6 * (syllableCount / wordCount)))
    : null;
  const gradeLevel = wordCount
    ? Math.max(0, 0.39 * (wordCount / Math.max(sentenceCount, 1)) + 11.8 * (syllableCount / wordCount) - 15.59)
    : null;
  const averageWordLength = wordCount ? words.reduce((total, word) => total + word.length, 0) / wordCount : 0;

  document.getElementById("word-count").textContent = formatNumber(wordCount);
  document.getElementById("paragraph-count").textContent = `${formatNumber(paragraphCount)} ${paragraphCount === 1 ? "paragraph" : "paragraphs"}`;
  document.getElementById("heading-count").textContent = `${formatNumber(headingCount)} ${headingCount === 1 ? "heading" : "headings"}`;
  document.getElementById("reading-time").textContent = readingTime(wordCount);
  document.getElementById("character-count").textContent = formatNumber(characters);
  document.getElementById("character-count-no-spaces").textContent = `${formatNumber(charactersWithoutSpaces)} without spaces`;
  document.getElementById("sentence-count").textContent = formatNumber(sentenceCount);
  document.getElementById("avg-sentence-length").textContent = `${averageSentenceLength.toFixed(1)} words per sentence`;
  document.getElementById("unique-word-count").textContent = formatNumber(uniqueWords);
  document.getElementById("vocabulary-variety").textContent = `${vocabularyVariety.toFixed(1)}% vocabulary variety`;
  document.getElementById("vocab-meter").style.width = `${Math.min(100, vocabularyVariety)}%`;
  document.getElementById("flesch-score").textContent = fleschScore === null ? "—" : Math.round(fleschScore);
  document.getElementById("readability-label").textContent = fleschScore === null ? "Add a few lines" : scoreLabel(fleschScore);
  document.getElementById("flesch-meter").style.width = `${fleschScore === null ? 0 : fleschScore}%`;
  document.getElementById("grade-level").textContent = gradeLevel === null ? "Reading grade: —" : `Reading grade: ${Math.max(1, Math.round(gradeLevel))}`;
  document.getElementById("avg-word-length").textContent = `Avg. word: ${averageWordLength ? averageWordLength.toFixed(1) : "—"} chars`;
}

document.addEventListener("scriptify:document-change", updateTextMetrics);
updateTextMetrics();
