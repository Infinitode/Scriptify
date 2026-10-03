function getSelectedText() {
  return window.getSelection ? window.getSelection().toString() : "";
}

async function fetchDictionaryDefinition(word) {
  const cleanWord = String(word || "").trim();
  if (!cleanWord) return;

  // --- Primary API ---
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length) {
        displayDictionaryData(data);
        return;
      }
    }
  } catch (primaryError) {
    console.warn("Primary dictionary API unavailable, trying fallback:", primaryError);
  }

  // --- Fallback API ---
  try {
    const fallbackResponse = await fetch(`https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(cleanWord)}`);
    if (!fallbackResponse.ok) {
      displayMessage(`No definition found for "${cleanWord}".`);
      return;
    }
    const fallbackData = await fallbackResponse.json();
    const normalised = normalizeFreeDict(fallbackData);
    if (!normalised.length) {
      displayMessage(`No definition found for "${cleanWord}".`);
      return;
    }
    displayDictionaryData(normalised);
  } catch (fallbackError) {
    console.error("Fallback dictionary API also failed:", fallbackError);
    displayMessage("The dictionary could not be reached. Check your connection.", "error");
  }
}

/**
 * Converts a freedictionaryapi.com response object into the array-of-entries
 * shape that displayDictionaryData expects (dictionaryapi.dev format).
 */
function normalizeFreeDict(data) {
  if (!data || !Array.isArray(data.entries) || !data.entries.length) return [];

  // Group entries by partOfSpeech so each group becomes one "meaning".
  const meaningMap = new Map();
  for (const entry of data.entries) {
    const pos = entry.partOfSpeech || "unknown";
    if (!meaningMap.has(pos)) meaningMap.set(pos, { partOfSpeech: pos, definitions: [], synonyms: [], antonyms: [] });
    const meaning = meaningMap.get(pos);

    for (const sense of entry.senses || []) {
      meaning.definitions.push({
        definition: sense.definition || "",
        example: (sense.examples || [])[0] || "",
      });
      (sense.synonyms || []).forEach((s) => meaning.synonyms.push(s));
      (sense.antonyms || []).forEach((a) => meaning.antonyms.push(a));
    }

    (entry.synonyms || []).forEach((s) => meaning.synonyms.push(s));
    (entry.antonyms || []).forEach((a) => meaning.antonyms.push(a));
  }

  const firstEntry = data.entries[0];
  const phonetic = (firstEntry?.pronunciations || []).find((p) => p.text)?.text || "";

  return [{
    word: data.word || "",
    phonetic,
    phonetics: phonetic ? [{ text: phonetic }] : [],
    meanings: Array.from(meaningMap.values()),
  }];
}

function displayDictionaryData(data) {
  if (!Array.isArray(data) || !data.length) {
    displayMessage("No definition was found for that word.");
    return;
  }

  const wordData = data[0];
  document.getElementById("dictWord").textContent = wordData.word || "Word";
  const phonetic = wordData.phonetic || (wordData.phonetics || []).find((entry) => entry.text)?.text || "Not available";
  document.getElementById("phonetic").textContent = phonetic;

  const definitions = document.getElementById("definitions");
  definitions.replaceChildren();
  const synonyms = new Set();
  const antonyms = new Set();

  data.forEach((entry) => {
    (entry.meanings || []).forEach((meaning) => {
      const card = document.createElement("section");
      card.className = "dictionary-definition";
      const heading = document.createElement("h3");
      heading.textContent = meaning.partOfSpeech || "Definition";
      card.appendChild(heading);

      (meaning.definitions || []).slice(0, 4).forEach((definition) => {
        const definitionLine = document.createElement("p");
        definitionLine.textContent = definition.definition || "No definition text available.";
        card.appendChild(definitionLine);
        if (definition.example) {
          const example = document.createElement("p");
          example.className = "example";
          example.textContent = `“${definition.example}”`;
          card.appendChild(example);
        }
      });

      (meaning.synonyms || []).forEach((word) => synonyms.add(word));
      (meaning.antonyms || []).forEach((word) => antonyms.add(word));
      definitions.appendChild(card);
    });
  });

  document.getElementById("synonyms").textContent = synonyms.size ? Array.from(synonyms).slice(0, 14).join(", ") : "None listed";
  document.getElementById("antonyms").textContent = antonyms.size ? Array.from(antonyms).slice(0, 14).join(", ") : "None listed";
  const popup = document.getElementById("dictionaryPopup");
  popup.classList.add("show");
  popup.setAttribute("aria-hidden", "false");
  popup.inert = false;
  if (typeof hideIdeaCard === "function") hideIdeaCard();
  const appShell = document.querySelector(".app-shell");
  if (appShell) appShell.inert = true;
  document.getElementById("closePopup").focus();
}

function closeDictionary() {
  const popup = document.getElementById("dictionaryPopup");
  const restoreFocus = popup.contains(document.activeElement);
  popup.classList.remove("show");
  popup.setAttribute("aria-hidden", "true");
  popup.inert = true;
  const appShell = document.querySelector(".app-shell");
  if (appShell) appShell.inert = false;
  if (restoreFocus) document.getElementById("dictionaryButton").focus();
}

document.getElementById("closePopup").addEventListener("click", closeDictionary);
document.getElementById("dictionaryPopup").addEventListener("click", (event) => {
  if (event.target.id === "dictionaryPopup") closeDictionary();
});
document.getElementById("dictionaryButton").addEventListener("mousedown", (event) => event.preventDefault());
document.getElementById("dictionaryButton").addEventListener("click", () => {
  const word = getSelectedText().trim();
  if (!word) {
    displayMessage("Select a word in your draft to look it up.");
    return;
  }
  fetchDictionaryDefinition(word);
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
    event.preventDefault();
    const word = getSelectedText().trim();
    if (word) fetchDictionaryDefinition(word);
    else displayMessage("Select a word in your draft to look it up.");
  }
});
