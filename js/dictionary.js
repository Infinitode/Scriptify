document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        const selectedWord = getSelectedText().trim();
        if (selectedWord) {
            fetchDictionaryDefinition(selectedWord);
        }
    }
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        save_file();
    }
    if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        open_file();
    }
    if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        export_file();
    }
    if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        randomBtn.click();
    }
});

// Function to get selected text
function getSelectedText() {
    if (window.getSelection) {
        return window.getSelection().toString();
    }
    return '';
}

// Fetch word definition from the Dictionary API
async function fetchDictionaryDefinition(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayDictionaryData(data);
    } catch (error) {
        displayMessage('<i class="bi bi-exclamation-triangle-fill"></i> Error fetching dictionary data.');
        console.error(error);
    }
}

// Function to display the dictionary data
function displayDictionaryData(data) {
    if (!data || data.length === 0) {
        alert('No definition found');
        return;
    }

    const wordData = data[0]; // Take the first entry for now
    document.getElementById('dictWord').innerText = wordData.word || 'N/A';
    document.getElementById('phonetic').innerText = wordData.phonetic || wordData.phonetics[0]?.text || 'N/A';

    // Clear previous definitions, synonyms, and antonyms
    const definitionsDiv = document.getElementById('definitions');
    const synonymsDiv = document.getElementById('synonyms');
    const antonymsDiv = document.getElementById('antonyms');

    definitionsDiv.innerHTML = '';
    synonymsDiv.innerHTML = '';
    antonymsDiv.innerHTML = '';

    let allSynonyms = new Set();
    let allAntonyms = new Set();

    // Process all meanings
    data.forEach(entry => {
        entry.meanings.forEach(meaning => {
            var c1 = document.createElement('div');
            c1.classList.add('card');
            // Create part of speech heading
            const partOfSpeech = document.createElement('h3');
            partOfSpeech.textContent = meaning.partOfSpeech;
            c1.appendChild(partOfSpeech);

            // Process each definition for this part of speech
            meaning.definitions.forEach(def => {
                const defElement = document.createElement('p');
                defElement.innerHTML = `<strong>Definition:</strong> ${def.definition}`;
                c1.appendChild(defElement);

                // Check if example exists and append it
                if (def.example) {
                    const exampleElement = document.createElement('p');
                    exampleElement.innerHTML = `<em>Example:</em> ${def.example}`;
                    c1.appendChild(exampleElement);
                }
            });

            // Collect synonyms and antonyms from this meaning
            if (meaning.synonyms && meaning.synonyms.length > 0) {
                meaning.synonyms.forEach(synonym => allSynonyms.add(synonym));
            }

            if (meaning.antonyms && meaning.antonyms.length > 0) {
                meaning.antonyms.forEach(antonym => allAntonyms.add(antonym));
            }

            definitionsDiv.appendChild(c1);
        });
    });

    // Display collected synonyms and antonyms (if any)
    synonymsDiv.innerText = allSynonyms.size > 0 ? Array.from(allSynonyms).join(", ") : 'None';
    antonymsDiv.innerText = allAntonyms.size > 0 ? Array.from(allAntonyms).join(", ") : 'None';

    // Show the dictionary popup
    document.getElementById('dictionaryPopup').style.transform = 'scale(1)';
}

// Close dictionary popup
document.getElementById('closePopup').addEventListener('click', function() {
    document.getElementById('dictionaryPopup').style.transform = 'scale(0)';
});

// Handle dictionary button click in bottom bar (if applicable)
document.getElementById('dictionaryButton')?.addEventListener('click', function() {
    const selectedWord = getSelectedText().trim();
    if (selectedWord) {
        fetchDictionaryDefinition(selectedWord);
    }
});
