const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

async function getEditorContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }

    const document = editor.document;
    const content = document.getText();

    // Limit file size to 200KB to avoid token limits / perf issues
    if (content.length > 200 * 1024) {
        throw new Error('File is too large (>200KB) for analysis.');
    }

    return {
        file: vscode.workspace.asRelativePath(document.uri),
        language: document.languageId,
        content: content,
        absolutePath: document.uri.fsPath
    };
}

async function findFilesByName(fileNames) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        console.log('No workspace folders open');
        return [];
    }

    const files = [];
    const maxFileSize = 200 * 1024; // 200KB per file

    for (const fileName of fileNames) {
        try {
            console.log(`Searching for file: ${fileName}`);
            // Search for the file in the workspace with better pattern
            // Support both exact match and wildcard
            const pattern = `**/*${fileName}`;
            const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 10);
            console.log(`Found ${uris.length} matches for ${fileName}`);

            for (const uri of uris) {
                try {
                    const stat = await vscode.workspace.fs.stat(uri);
                    if (stat.size > maxFileSize) continue;

                    const content = await vscode.workspace.fs.readFile(uri);
                    const text = Buffer.from(content).toString('utf8');
                    
                    files.push({
                        file: vscode.workspace.asRelativePath(uri),
                        content: text,
                        size: stat.size
                    });
                } catch (err) {
                    continue;
                }
            }
        } catch (error) {
            console.error(`Error finding file ${fileName}:`, error);
        }
    }

    return files;
}

async function gatherWorkspaceContext() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
    }

    const files = [];
    const maxFiles = 50; // Limit number of files
    const maxFileSize = 100 * 1024; // 100KB per file

    // Common patterns to ignore
    const ignorePatterns = [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/*.min.js',
        '**/*.map',
        '**/package-lock.json',
        '**/yarn.lock'
    ];

    try {
        // Find all code files
        const uris = await vscode.workspace.findFiles(
            '**/*.{js,ts,jsx,tsx,py,java,cpp,c,cs,go,rb,php,html,css,json}',
            `{${ignorePatterns.join(',')}}`,
            maxFiles
        );

        for (const uri of uris) {
            try {
                const stat = await vscode.workspace.fs.stat(uri);
                if (stat.size > maxFileSize) continue;

                const content = await vscode.workspace.fs.readFile(uri);
                const text = Buffer.from(content).toString('utf8');
                
                files.push({
                    file: vscode.workspace.asRelativePath(uri),
                    content: text,
                    size: stat.size
                });
            } catch (err) {
                // Skip files that can't be read
                continue;
            }
        }
    } catch (error) {
        console.error('Error gathering workspace context:', error);
    }

    return files;
}

module.exports = {
    getEditorContext,
    gatherWorkspaceContext,
    findFilesByName
};
