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
 * Toggles a heading level. When the selection is collapsed and the current
 * block is not already the desired heading, this inserts a new empty heading
 * block after the current block and places the caret inside it, so subsequent
 * typing is formatted as the chosen heading without altering existing text.
 *
 * If the selection is not collapsed, applies/removes the heading to/from the
 * current block using formatBlock.
 *
 * @param {string} tag - Heading tag, e.g., "H1", "H2", "H3".
 */
function toggleHeading(tag) {
    // Ensure the editor has focus so selection operations apply correctly
    try { focus(); } catch (_) {}

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return;
    }

    const range = getRange();
    const desiredTag = (tag || "").toUpperCase();
    const currentTag = getCurrentBlockTagName();

    // Multi-range selection: toggle heading on the current block
    if (!selection.isCollapsed) {
        if (currentTag === desiredTag) {
            execCommand("formatBlock", "<p>");
        } else {
            execCommand("formatBlock", `<${desiredTag.toLowerCase()}>`);
        }
        return;
    }

    // Collapsed selection
    if (currentTag === desiredTag) {
        // Toggle off -> paragraph on current block
        execCommand("formatBlock", "<p>");
        return;
    }

    // Insert a new empty heading block and move caret inside a text node.
    // If the closest block is the editor itself (empty editor) insert INSIDE the editor.
    const editor = getEditor();
    const blockElement = getClosestBlockElementFromNode(range.startContainer) || editor;
    const newHeading = document.createElement(desiredTag);
    const textNode = document.createTextNode("");
    newHeading.appendChild(textNode);

    if (blockElement === editor) {
        // Insert inside the editor at the caret position if possible, otherwise append
        let insertIndex = 0;
        if (range.startContainer === editor) {
            insertIndex = Math.min(range.startOffset, editor.childNodes.length);
        } else {
            // Find the closest direct child of editor that contains the caret
            let node = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentNode;
            let directChild = node;
            while (directChild && directChild.parentNode !== editor) {
                directChild = directChild.parentNode;
            }
            if (directChild && directChild.parentNode === editor) {
                insertIndex = Array.prototype.indexOf.call(editor.childNodes, directChild) + 1;
            } else {
                insertIndex = editor.childNodes.length;
            }
        }
        const refNode = editor.childNodes[insertIndex] || null;
        editor.insertBefore(newHeading, refNode);
    } else {
        if (blockElement.nextSibling) {
            blockElement.parentNode.insertBefore(newHeading, blockElement.nextSibling);
        } else {
            blockElement.parentNode.appendChild(newHeading);
        }
    }

    // Place caret inside the heading's text node so typing stays within the H tag
    setCaretAtElement(textNode, 0);
    // Mark that the next input should enforce this heading on the editing engine
    try { window._ikPendingHeadingTag = desiredTag; } catch (_) {}
    reportSelectedTextAttributesIfNecessary();
}

function getClosestBlockElementFromNode(node) {
    if (!node) { return null; }
    let el = (node.nodeType === Node.ELEMENT_NODE) ? node : node.parentNode;
    while (el && el !== document) {
        const tag = el.tagName;
        if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE"].includes(tag)) {
            return el;
        }
        el = el.parentNode;
    }
    return null;
}
