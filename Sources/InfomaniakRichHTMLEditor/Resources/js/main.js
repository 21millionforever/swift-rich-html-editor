"use strict";

document.addEventListener("DOMContentLoaded", () => {
    reportEditorDidLoad();

    observeResize(document.documentElement);
    observeContentMutation(document, getEditor());
    observeSelectionChange(document);
    
    // Add keydown listener for heading formatting
    getEditor().addEventListener('keydown', handleHeadingFormatOnType);
    
    // Clear heading format state on clicks (cursor movement)
    getEditor().addEventListener('click', clearHeadingFormatOnMove);
});
