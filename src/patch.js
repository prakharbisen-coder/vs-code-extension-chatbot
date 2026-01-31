const vscode = require('vscode');

/**
 * Validates the proposed patch against the current document.
 * @param {Array} patch - The JSON patch from Gemini.
 * @param {vscode.TextEditor} editor - The active text editor.
 * @returns {Array<string>} - List of error messages, empty if valid.
 */
function validatePatch(patch, editor) {
    const errors = [];
    if (!Array.isArray(patch)) {
        errors.push('Patch must be an array of changes.');
        return errors;
    }

    const document = editor.document;
    const lineCount = document.lineCount;

    patch.forEach((change, index) => {
        if (!change.file) {
            errors.push(`Change #${index + 1}: Missing 'file' property.`);
        }

        // Simple check: Ensure we are editing the open file
        // In a real extension, we might match relative paths strictly.
        // For now, we assume the AI context was just this file.

        if (typeof change.startLine !== 'number' || typeof change.endLine !== 'number') {
            errors.push(`Change #${index + 1}: startLine and endLine must be numbers.`);
        }

        if (change.startLine < 1 || change.startLine > lineCount + 1) { // +1 allows appending
            errors.push(`Change #${index + 1}: startLine ${change.startLine} is out of bounds (1-${lineCount}).`);
        }

        if (change.endLine < change.startLine) {
            errors.push(`Change #${index + 1}: endLine ${change.endLine} cannot be less than startLine ${change.startLine}.`);
        }
    });

    return errors;
}

/**
 * Applies the patch to the document(s).
 * @param {Array} patch 
 * @returns {Promise<boolean>}
 */
async function applyPatch(patch) {
    const edit = new vscode.WorkspaceEdit();
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return false;
    }

    for (const change of patch) {
        try {
            // Find the file in the workspace
            const fileName = change.file;
            const pattern = `**/*${fileName}`;
            const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 1);
            
            if (uris.length === 0) {
                vscode.window.showErrorMessage(`File not found: ${fileName}`);
                continue;
            }
            
            const fileUri = uris[0];
            const document = await vscode.workspace.openTextDocument(fileUri);
            
            // AI returns 1-based lines, inclusive.
            // VS Code uses 0-based lines.
            let startLine = change.startLine - 1;
            let endLine = change.endLine - 1;

            // Construct range covering the full lines
            let range;

            if (startLine >= document.lineCount) {
                // Appending at the very end
                const lastLine = document.lineAt(document.lineCount - 1);
                range = new vscode.Range(lastLine.range.end, lastLine.range.end);
            } else {
                const startPos = new vscode.Position(startLine, 0);

                let endPos;
                if (endLine >= document.lineCount - 1) {
                    // End of document
                    const lastLine = document.lineAt(document.lineCount - 1);
                    endPos = lastLine.range.end;
                } else {
                    // Start of the line *after* the end line
                    endPos = new vscode.Position(endLine + 1, 0);
                }
                range = new vscode.Range(startPos, endPos);
            }

            let newText = change.replacement;
            edit.replace(fileUri, range, newText);
            
        } catch (error) {
            console.error(`Error processing change for ${change.file}:`, error);
            vscode.window.showErrorMessage(`Failed to apply change to ${change.file}: ${error.message}`);
        }
    }

    const success = await vscode.workspace.applyEdit(edit);
    
    if (success) {
        // Show all modified files
        const modifiedFiles = [...new Set(patch.map(c => c.file))];
        vscode.window.showInformationMessage(`Changes applied to: ${modifiedFiles.join(', ')}`);
    }
    
    return success;
}

/**
 * Validates the proposed patch.
 * @param {Array} patch - The JSON patch from Gemini.
 * @returns {Array<string>} - List of error messages, empty if valid.
 */
function validatePatch(patch) {
    const errors = [];
    if (!Array.isArray(patch)) {
        errors.push('Patch must be an array of changes.');
        return errors;
    }

    patch.forEach((change, index) => {
        if (!change.file) {
            errors.push(`Change #${index + 1}: Missing 'file' property.`);
        }

        if (typeof change.startLine !== 'number' || typeof change.endLine !== 'number') {
            errors.push(`Change #${index + 1}: startLine and endLine must be numbers.`);
        }

        if (change.startLine < 1) {
            errors.push(`Change #${index + 1}: startLine must be >= 1.`);
        }

        if (change.endLine < change.startLine) {
            errors.push(`Change #${index + 1}: endLine ${change.endLine} cannot be less than startLine ${change.startLine}.`);
        }
    });

    return errors;
}

module.exports = {
    validatePatch,
    applyPatch
};
