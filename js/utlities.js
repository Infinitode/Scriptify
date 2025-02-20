function clear() {
  document.querySelector(".text h1").innerHTML = "Story Title";
  document.querySelector(".text p").innerHTML =
    "You can begin writing here. Or click the button in the bottom bar, to start live transcription.";
  displayMessage("<i class='bi bi-info-circle-fill'></i> Cleared title and text content.")
}
document.getElementById("clearbtn").addEventListener("click", clear);

const closer = document.querySelectorAll(".closer")[0];
closer.addEventListener("click", function () {
  document.querySelector(".sidebar").classList.toggle("closed");
  if (document.querySelector(".sidebar").classList.contains("closed")) {
    document.querySelector(".g1-6").classList.add("closed");
    closer.children[0].setAttribute("class", "bi bi-chevron-compact-right");
    closer.classList.add('closed');
  } else {
    document.querySelector(".g1-6").classList.remove("closed");
    closer.children[0].setAttribute("class", "bi bi-chevron-compact-left");
    closer.classList.remove('closed');
  }
});
const closer1 = document.querySelectorAll(".closer")[1];
closer1.addEventListener("click", function () {
  document.querySelector(".bottom-bar").classList.toggle("closed");
  if (document.querySelector(".bottom-bar").classList.contains("closed")) {
    closer1.children[0].setAttribute("class", "bi bi-chevron-compact-up");
  } else {
    closer1.children[0].setAttribute("class", "bi bi-chevron-compact-down");
  }
});

const infopopbtn = document.getElementById('infoPop');
const infoPopup = document.querySelector(".info-popup");
infopopbtn.addEventListener("click", function(){
    infoPopup.classList.add("show");
    closer.click();
})

document.querySelector(".info-popup .flex .bi").addEventListener("click", function(){
    infoPopup.classList.remove("show");
    closer.click();
})

function countWords() {
  // Select the second <p> element inside the .text class
  const paragraph = document.querySelector(".text p");
  console.log("counting...");

  if (paragraph) {
    // Get the text content of the second <p> and trim any extra spaces
    const text = paragraph.textContent.trim();

    // Split the text by spaces and filter out any empty strings, then count the words
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    // Update the content of the #words element with the word count
    document.getElementById(
      "words"
    ).innerHTML = `<i class="bi bi-hash"></i> ${wordCount} words`;
    document.getElementById("word-count").innerText = `${wordCount} words`;
  }
}

// Get the second <p> element and add an input event listener for real-time word counting
const editableParagraph = document.querySelector(".text p");

// Listen for any changes in the contenteditable paragraph
editableParagraph.addEventListener("input", countWords);

// Initial word count
countWords(); // Call it once to show the initial word count

// Function to handle text formatting using execCommand
function formatText(command) {
  // Save the current selection before applying the style
  const selection = saveSelection();

  if (command === "bold") {
    document.execCommand("bold", false, null);
  } else if (command === "italic") {
    document.execCommand("italic", false, null);
  } else if (command === "underline") {
    document.execCommand("underline", false, null);
  } else if (command === "h1") {
    document.execCommand("formatBlock", false, "h2");

    // Insert default "Heading" text if the h2 is empty
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    if (range) {
      const h2Element = range.startContainer.closest("h2");

      if (h2Element) {
        if (!h2Element.textContent.trim()) {
          h2Element.textContent = "Heading";
        }
      } else {
        // If no h2 exists, create a new one with "Heading"
        const newH2 = document.createElement("h2");
        newH2.textContent = "Heading";

        // Insert the new h2 in the current position
        range.deleteContents();
        range.insertNode(newH2);

        // Set the caret inside the new h2
        const newRange = document.createRange();
        newRange.setStart(newH2, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  } else if (command === "quote") {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    if (selectedText) {
      // Wrap the selected text with quotation marks
      range.deleteContents();
      range.insertNode(document.createTextNode(`“${selectedText}”`));
    } else {
      // If no text is selected, just insert quotation marks at the caret position
      range.insertNode(document.createTextNode("”"));
      range.insertNode(document.createTextNode("“"));
    }

    // Restore the cursor position after inserting the quote
    selection.removeAllRanges();
    selection.addRange(range);
  }
  // Restore the saved selection (return cursor to previous position)
  restoreSelection(selection);
  updateToolbarState(); // Update button states after command
}

// Function to save the current selection (caret position)
function saveSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    return selection.getRangeAt(0);
  }
  return null;
}

// Function to restore the saved selection (caret position)
function restoreSelection(range) {
  if (range) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// Function to update toolbar buttons based on text selection
function updateToolbarState() {
  // Toggle bold button active state
  const isBold = document.queryCommandState("bold");
  document.getElementById("bold").classList.toggle("active", isBold);

  // Toggle italic button active state
  const isItalic = document.queryCommandState("italic");
  document.getElementById("italic").classList.toggle("active", isItalic);

  const isUnderline = document.queryCommandState("underline");
  document.getElementById("underline").classList.toggle("active", isUnderline);
}

function open_file() {
  pywebview.api.load_content();
}
function save_file() {
  pywebview.api.save_content();
}
function export_file() {
  pywebview.api.export_as();
}

// Add event listener to detect when selection changes
document
  .querySelector(".text p")
  .addEventListener("mouseup", updateToolbarState);
document.querySelector(".text p").addEventListener("keyup", updateToolbarState);
document.querySelector(".text").addEventListener("input", updateToolbarState);

function closeWindow() {
  pywebview.api.closeWindow();
}
document.getElementById("close").addEventListener("click", closeWindow);
function minimizeWindow() {
  pywebview.api.minimizeWindow();
}
document.getElementById("min").addEventListener("click", minimizeWindow);
function toggleFullscreen() {
  pywebview.api.toggleFullscreen();
}
document.getElementById("max").addEventListener("click", toggleFullscreen);

var warningPopup = document.querySelector('.popup');

function displayMessage(message){
    warningPopup.innerHTML = message;
    warningPopup.style.transform = "translateY(0)";
    setTimeout(() => {
        warningPopup.style.transform = "translateY(calc(-100% - 1em))";
    }, 2000);
}