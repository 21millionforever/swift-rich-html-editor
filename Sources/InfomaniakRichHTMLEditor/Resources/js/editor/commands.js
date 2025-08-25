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

// Track the next formatting state for headings (like how bold works)
let nextHeadingFormat = null;

/**
 * Toggles heading formatting like bold - tracks state for future typing without changing existing text.
 *
 * @param {string} headingTag - The heading tag (h1, h2, or h3)
 */
function toggleHeading(headingTag) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Only work at insertion point (no selection)
    if (!range.collapsed) {
        return;
    }

    const currentHeading = getCurrentHeading(range);
    const targetTag = headingTag.toLowerCase();
    
    // Toggle the next heading format state
    if (nextHeadingFormat === targetTag) {
        // Toggle off
        nextHeadingFormat = null;
    } else if (currentHeading === targetTag) {
        // We're in this heading type, toggle off
        nextHeadingFormat = null;
    } else {
        // Toggle on
        nextHeadingFormat = targetTag;
    }
    
    reportSelectedTextAttributesIfNecessary();
}

/**
 * Gets the current heading tag at the insertion point
 */
function getCurrentHeading(range) {
    let element = range.startContainer;
    
    if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
    }

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
 * Handle keydown events to apply heading formatting when user starts typing
 */
function handleHeadingFormatOnType(event) {
    // Clear heading format on navigation keys
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || 
        event.key === 'ArrowUp' || event.key === 'ArrowDown' ||
        event.key === 'Home' || event.key === 'End' ||
        event.key === 'PageUp' || event.key === 'PageDown') {
        nextHeadingFormat = null;
        reportSelectedTextAttributesIfNecessary();
        return;
    }
    
    if (!nextHeadingFormat) return;
    
    // Only apply on actual character input (not control keys)
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        if (!range.collapsed) return;
        
        // Create a new heading element
        const headingElement = document.createElement(nextHeadingFormat);
        headingElement.textContent = event.key;
        
        // Insert the heading at cursor position
        range.deleteContents();
        range.insertNode(headingElement);
        
        // Position cursor after the typed character
        const newRange = document.createRange();
        newRange.setStart(headingElement.firstChild, 1);
        newRange.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Clear the formatting state
        nextHeadingFormat = null;
        
        // Prevent default typing behavior
        event.preventDefault();
        
        // Report the change
        reportSelectedTextAttributesIfNecessary();
    }
}

/**
 * Clear heading format state on cursor movement
 */
function clearHeadingFormatOnMove() {
    if (nextHeadingFormat) {
        nextHeadingFormat = null;
        reportSelectedTextAttributesIfNecessary();
    }
}
