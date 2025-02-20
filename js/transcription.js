let transcribing = false; // Keep track of whether transcription is on or off

// Toggle transcription on/off
function toggleTranscription() {
  if (!transcribing) {
    // Start transcription
    window.pywebview.api.start_transcription().then((response) => {
      console.log(response);
      transcribing = true;
      document.getElementById("transcribe").innerHTML =
        '<i class="bi bi-mic-mute-fill color"></i>';
      document.getElementById("timer").innerHTML = "Listening...";
    });
  } else {
    // Stop transcription
    window.pywebview.api.stop_transcription().then((response) => {
      console.log(response);
      transcribing = false;
      document.getElementById("transcribe").innerHTML =
        '<i class="bi bi-mic-fill"></i>';
      document.getElementById("timer").innerHTML = "Not listening";
    });
  }
}

function updateTimer(remainingTime, isRunning) {
  const timerElement = document.getElementById("timer"); // Ensure this ID matches your HTML

  if (remainingTime > 0) {
    // Timer is still counting down
    timerElement.innerHTML = `Listening... ${remainingTime}s remaining`;
  } else {
    // Timer has finished, waiting for the next interval
    timerElement.innerHTML = `Not listening`;
  }
}

// Helper function to save the current caret position
function saveSelection1() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange();
    }
    return null;
  }

  // Helper function to restore the saved caret position
  function restoreSelection1(range) {
    if (range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function updateTranscribedText(text) {
    const selection = window.getSelection();
    const range = saveSelection1(); // Save the current selection/caret position

    if (range && selection.rangeCount > 0) {
      // Insert the transcribed text
      if (!selection.isCollapsed) {
        range.deleteContents(); // Remove the selected text if any
      }

      // Create a new text node with the transcribed text and insert it at the caret position
      const newTextNode = document.createTextNode(text);
      range.insertNode(newTextNode);

      // Move the caret to the end of the inserted text node
      range.setStartAfter(newTextNode);
      range.setEndAfter(newTextNode);

      // Restore the selection with the updated caret position
      restoreSelection1(range);
    } else {
      // If no selection, append the transcribed text at the end of a specific element
      const transcribedElement = document.getElementById("transcribedText");
      transcribedElement.appendChild(document.createTextNode(text));
    }
  }
