"use strict";

/**
 * Executes a command with document.execCommand().
 * If the command changes the selected text, the WKWebView will be notified.
 *
 * @param {string} command - The name of the command to execute
 * @param {string|null} argument - An optional argument for the command
 */
function execCommand(command, argument) {
    document.execCommand(command, false, argument);
    reportSelectedTextAttributesIfNecessary();
}


/**
 * Sets the HTML content of the editor.
 * The current content will be replaced by the new content.
 *
 * @param {string} content - The new HTML content of the editor
 */
function setContent(content) {
    getEditor().innerHTML = content;
}

/**
 * Injects new CSS rules to the editor to change its style.
 *
 * @param {string} content - The new CSS rules to add to the editor
 */
function injectCSS(content) {
    const styleElement = document.createElement("style");
    styleElement.textContent = content;
    document.head.appendChild(styleElement);
}

/**
 * Sets the read-only state of the editor.
 * When read-only is enabled, the editor content cannot be modified but text can still be selected and copied.
 *
 * @param {boolean} isReadOnly - Whether the editor should be read-only
 */
function setReadOnly(isReadOnly) {
    const editor = getEditor();
    editor.contentEditable = !isReadOnly;
}

/**
 * Toggles heading formatting for future typing at insertion point.
 * Like bold, this only affects new text being typed, not existing text.
 *
 * @param {string} headingTag - The heading tag (h1, h2, or h3)
 */
function toggleHeading(headingTag) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Only work at insertion point (no selection)
    if (!range.collapsed) {
        // If there's a selection, do nothing to avoid modifying existing text
        return;
    }

    const currentHeading = getCurrentHeading(range);
    
    if (currentHeading && currentHeading.toLowerCase() === headingTag.toLowerCase()) {
        // Toggle off - create a new paragraph for future typing
        insertNewParagraphForTyping();
    } else {
        // Toggle on - create a new heading for future typing
        insertNewHeadingForTyping(headingTag);
    }
    
    reportSelectedTextAttributesIfNecessary();
}

/**
 * Gets the current heading tag at the insertion point
 */
function getCurrentHeading(range) {
    let element = range.startContainer;
    
    // If it's a text node, get its parent element
    if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
    }

    // Walk up the DOM tree to find heading elements
    while (element && element !== getEditor()) {
        const tagName = element.tagName ? element.tagName.toLowerCase() : '';
        if (tagName.match(/^h[1-6]$/)) {
            return tagName;
        }
        element = element.parentElement;
    }

    return null;
}

/**
 * Creates a new paragraph at cursor position for future typing
 */
function insertNewParagraphForTyping() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Create a new paragraph element
    const newP = document.createElement('p');
    newP.innerHTML = '<br>'; // Needed for cursor placement
    
    // Insert the paragraph after current position
    insertElementAtCursor(newP);
    
    // Place cursor at the beginning of the new paragraph
    const newRange = document.createRange();
    newRange.setStart(newP, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
}

/**
 * Creates a new heading at cursor position for future typing
 */
function insertNewHeadingForTyping(headingTag) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Create a new heading element
    const newHeading = document.createElement(headingTag);
    newHeading.innerHTML = '<br>'; // Needed for cursor placement
    
    // Insert the heading after current position
    insertElementAtCursor(newHeading);
    
    // Place cursor at the beginning of the new heading
    const newRange = document.createRange();
    newRange.setStart(newHeading, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
}

/**
 * Helper function to insert an element at the current cursor position
 */
function insertElementAtCursor(element) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Find the current block element (p, h1, h2, etc.)
    let currentBlock = range.startContainer;
    if (currentBlock.nodeType === Node.TEXT_NODE) {
        currentBlock = currentBlock.parentElement;
    }
    
    // Keep going up until we find a block-level element
    while (currentBlock && currentBlock !== getEditor() && 
           !currentBlock.tagName.match(/^(P|H[1-6]|DIV|BLOCKQUOTE|UL|OL|LI)$/i)) {
        currentBlock = currentBlock.parentElement;
    }
    
    if (currentBlock && currentBlock !== getEditor()) {
        // Insert the new element after the current block
        currentBlock.parentNode.insertBefore(element, currentBlock.nextSibling);
    } else {
        // Fallback: append to editor
        getEditor().appendChild(element);
    }
}
