document.addEventListener('DOMContentLoaded', function() {
    // Select elements
    const titleElement = document.querySelector('.text h1');
    const editableContent = document.querySelector('.text p');

    // Average words per minute (WPM) reading speed
    const averageReadingSpeed = 250; // You can adjust this value if needed

    // Function to calculate and update all text-related metrics
    function updateTextMetrics() {
        const titleText = titleElement.textContent.trim();
        const contentText = editableContent.textContent.trim();
        const fullText = titleText + ' ' + contentText;

        // Calculate Reading Time
        const wordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;
        const totalSeconds = Math.round(wordCount / (averageReadingSpeed / 60)); // total seconds for reading
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        document.getElementById('reading-time').innerHTML = `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;

        // Calculate Flesch-Kincaid Readability Score
        const fleschScore = calculateFleschKincaid(fullText);
        document.getElementById('flesch-score').innerHTML = fleschScore;
        document.getElementById('flesch-var-p').style.strokeDashoffset = 251 - (251 * parseFloat(fleschScore) / 100);

        // Calculate Average Sentence Length
        const avgSentenceLength = calculateAverageSentenceLength(fullText);
        document.getElementById('avg-sentence-length').innerHTML = avgSentenceLength;

        // Calculate Character Count
        const charCount = calculateCharacterCount(fullText);
        document.getElementById('character-count').innerHTML = charCount;
        const sentCount = countSentences(fullText);
        document.getElementById('sentence-count').innerHTML = `${sentCount} sentences`;

        // Calculate Vocabulary Variety
        const vocabVariety = calculateVocabularyVariety(fullText);
        document.getElementById('vocabulary-variety').innerHTML = vocabVariety;
        document.getElementById('vocab-var-p').style.strokeDashoffset = 251 - (251 * parseFloat(vocabVariety) / 100);
    }

    // Helper functions
    function calculateFleschKincaid(text) {
        function countSyllables(word) {
            word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
            const syllableMatches = word.match(/[aeiouy]{1,2}/g);
            return syllableMatches ? syllableMatches.length : 1;
        }
        function countWords(text) { return text.trim().split(/\s+/).length; }
        function countSentences(text) { return text.split(/[.!?]/).filter(Boolean).length; }

        const words = text.split(/\s+/);
        const wordCount = countWords(text);
        const sentenceCount = countSentences(text);
        const syllableCount = words.reduce((total, word) => total + countSyllables(word), 0);

        const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
        let readability = score >= 90 ? "Very Easy To Read" : score >= 80 ? "Easy To Read" : score >= 70 ? "Fairly Easy To Read" : score >= 60 ? "Standard Reading Difficulty" : score >= 50 ? "Fairly Difficult To Read" : score >= 30 ? "Difficult To Read" : "Very Difficult To Read";
        return `${score.toFixed(2)}%<br><span class='stext'>(${readability})</span>`;
    }

    function countSentences(text) { return text.split(/[.!?]/).filter(Boolean).length; }

    function calculateAverageSentenceLength(text) {
        const wordCount = text.trim().split(/\s+/).length;
        const sentenceCount = text.split(/[.!?]/).filter(Boolean).length;
        const avgSentenceLength = wordCount / sentenceCount;
        return `${avgSentenceLength.toFixed(2)} words`;
    }

    function calculateCharacterCount(text) {
        const charCount = text.replace(/\s/g, '').length; // Exclude whitespace
        return `${charCount} characters`;
    }

    function calculateVocabularyVariety(text) {
        const words = text.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        const vocabVariety = (uniqueWords.size / words.length) * 100; // As percentage
        return `${vocabVariety.toFixed(2)}%`;
    }

    // Attach event listeners to monitor changes in .text h1 and .text p
    titleElement.addEventListener('input', updateTextMetrics);
    editableContent.addEventListener('input', updateTextMetrics);

    // Initial call to display metrics on page load
    updateTextMetrics();
});