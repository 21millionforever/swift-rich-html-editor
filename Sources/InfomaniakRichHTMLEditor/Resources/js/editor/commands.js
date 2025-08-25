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
 * Toggles heading formatting for the current selection or insertion point.
 * Unlike formatBlock, this function toggles heading on/off like bold does.
 *
 * @param {string} headingTag - The heading tag (h1, h2, or h3)
 */
function toggleHeading(headingTag) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const currentHeading = getCurrentHeading(range);
    
    if (currentHeading && currentHeading.toLowerCase() === headingTag.toLowerCase()) {
        // Remove heading formatting (toggle off)
        removeHeadingFormatting(range);
    } else {
        // Apply heading formatting (toggle on)
        applyHeadingFormatting(range, headingTag);
    }
    
    reportSelectedTextAttributesIfNecessary();
}

/**
 * Gets the current heading tag at the selection/insertion point
 */
function getCurrentHeading(range) {
    let element = range.commonAncestorContainer;
    
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
 * Applies heading formatting to the current line/selection
 */
function applyHeadingFormatting(range, headingTag) {
    // If there's no selection, just set the formatting for future typing
    if (range.collapsed) {
        document.execCommand('formatBlock', false, headingTag);
    } else {
        // For selections, apply to the entire line(s) containing the selection
        document.execCommand('formatBlock', false, headingTag);
    }
}

/**
 * Removes heading formatting from the current line/selection
 */
function removeHeadingFormatting(range) {
    // Convert back to normal paragraph
    document.execCommand('formatBlock', false, 'p');
}
