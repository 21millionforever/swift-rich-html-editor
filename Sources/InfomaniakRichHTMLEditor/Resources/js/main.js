"use strict";

document.addEventListener("DOMContentLoaded", () => {
    reportEditorDidLoad();

    observeResize(document.documentElement);
    observeContentMutation(document, getEditor());
    observeSelectionChange(document);

    const editor = getEditor();
    editor.addEventListener("beforeinput", () => {
        ensurePendingHeadingApplied();
    });
    editor.addEventListener("input", () => {
        // Ensure the pending heading is applied even if the UA modified the DOM post-input
        ensurePendingHeadingApplied();
    });
});

function ensurePendingHeadingApplied() {
    try {
        const desiredTag = window._ikPendingHeadingTag;
        if (!desiredTag) { return; }

        const range = getRange();
        if (!range || !window.getSelection().isCollapsed) { return; }

        const blockElement = getClosestBlockElementFromNode(range.startContainer);
        if (!blockElement || blockElement.tagName === desiredTag) { return; }

        // Replace current block with the desired heading and move caret at end
        const replacement = document.createElement(desiredTag);
        while (blockElement.firstChild) {
            replacement.appendChild(blockElement.firstChild);
        }
        blockElement.parentNode.replaceChild(replacement, blockElement);
        setCaretAtElement(replacement, replacement.childNodes.length);

        window._ikPendingHeadingTag = null;
        reportSelectedTextAttributesIfNecessary();
    } catch (_) { /* noop */ }
}
