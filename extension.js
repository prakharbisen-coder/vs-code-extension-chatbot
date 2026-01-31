const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { callGemini } = require('./src/gemini');
const { getEditorContext, gatherWorkspaceContext, findFilesByName } = require('./src/context');
const { validatePatch, applyPatch } = require('./src/patch');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Gemini Coder is now active!');

    let currentPanel = undefined;

    let disposable = vscode.commands.registerCommand('aibot.openChat', () => {
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.Two);
        } else {
            currentPanel = vscode.window.createWebviewPanel(
                'geminiCoder',
                'AI Code Assistant',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))
                    ]
                }
            );

            currentPanel.webview.html = getWebviewContent(currentPanel.webview, context.extensionPath);

            // Handle messages from the webview
            currentPanel.webview.onDidReceiveMessage(async message => {
                switch (message.command) {
                    case 'sendMessage':
                        await handleUserMessage(currentPanel, message.text, message.attachedFiles || []);
                        return;
                    case 'approveEdit':
                        await handleApproveEdit(message.patch);
                        return;
                    case 'selectFiles':
                        await handleFileSelection(currentPanel);
                        return;
                }
            }, undefined, context.subscriptions);

            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            }, null, context.subscriptions);
        }
    });

    context.subscriptions.push(disposable);
}

async function handleUserMessage(panel, text, attachedFiles = []) {
    try {
        // 1. Get Context
        const editorContext = await getEditorContext();
        
        // 2. Send to Webview that we are processing
        panel.webview.postMessage({ command: 'botMessage', text: 'Thinking...' });

        // 3. Extract file names from the message
        const filePattern = /([\w.-]+\.(?:js|ts|jsx|tsx|py|java|cpp|c|cs|go|rb|php|html|css|json|md|txt|xml|yaml|yml))(?:\s|$|,|\.|\?|!)/gi;
        const matches = text.matchAll(filePattern);
        const mentionedFiles = [...new Set([...matches].map(m => m[1]))];
        
        let workspaceContext = [];
        
        console.log('Extracted file names:', mentionedFiles);
        console.log('Attached files:', attachedFiles);
        
        // 4. Load attached files from button
        if (attachedFiles.length > 0) {
            panel.webview.postMessage({ command: 'botMessage', text: `Reading ${attachedFiles.length} attached file(s)...` });
            for (const file of attachedFiles) {
                try {
                    const uri = vscode.Uri.file(file.path);
                    const stat = await vscode.workspace.fs.stat(uri);
                    
                    if (stat.size > 200 * 1024) {
                        console.log(`Skipping large file: ${file.name}`);
                        continue;
                    }
                    
                    const content = await vscode.workspace.fs.readFile(uri);
                    const textContent = Buffer.from(content).toString('utf8');
                    
                    workspaceContext.push({
                        file: file.name,
                        content: textContent,
                        size: stat.size
                    });
                    console.log(`Loaded attached file: ${file.name} (${stat.size} bytes)`);
                } catch (err) {
                    console.error(`Error reading attached file ${file.name}:`, err);
                }
            }
        }
        
        // 5. Load mentioned files
        if (mentionedFiles.length > 0) {
            panel.webview.postMessage({ command: 'botMessage', text: `Loading files: ${mentionedFiles.join(', ')}...` });
            const foundFiles = await findFilesByName(mentionedFiles);
            workspaceContext = [...workspaceContext, ...foundFiles];
            console.log(`Found ${foundFiles.length} files out of ${mentionedFiles.length} mentioned`);
        }
        
        // 6. Gather full workspace context if requested
        const needsWorkspace = /analyze|find|search|project|all files|entire|workspace/i.test(text);
        
        if (needsWorkspace && workspaceContext.length === 0) {
            panel.webview.postMessage({ command: 'botMessage', text: 'Scanning workspace files...' });
            workspaceContext = await gatherWorkspaceContext();
        }

        // 7. Call Gemini (always call, even without files)
        const response = await callGemini(text, editorContext, workspaceContext);

        // 8. Send response to Webview
        panel.webview.postMessage({ 
            command: 'botMessage', 
            text: response.explanation,
            patch: response.changes 
        });

    } catch (error) {
        console.error('handleUserMessage error:', error);
        panel.webview.postMessage({ 
            command: 'botMessage', 
            text: `Error: ${error.message}` 
        });
    }
}

async function handleFileSelection(panel) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('Please open a folder first.');
            return;
        }

        // Find all relevant files in the workspace
        const uris = await vscode.workspace.findFiles(
            '**/*.{js,ts,jsx,tsx,py,java,cpp,c,cs,go,rb,php,html,css,json,md,txt,xml,yaml,yml}',
            '**/node_modules/**',
            500
        );

        if (uris.length === 0) {
            vscode.window.showInformationMessage('No files found in workspace.');
            return;
        }

        // Create Quick Pick items
        const items = uris.map(uri => ({
            label: path.basename(uri.fsPath),
            description: vscode.workspace.asRelativePath(uri),
            uri: uri
        }));

        // Show Quick Pick with multi-select
        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select files to attach (you can select multiple)',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected || selected.length === 0) {
            return;
        }

        // Send selected files to webview
        const files = selected.map(item => ({
            name: item.label,
            path: item.uri.fsPath
        }));

        panel.webview.postMessage({
            command: 'filesSelected',
            files: files
        });

    } catch (error) {
        console.error('Error selecting files:', error);
        vscode.window.showErrorMessage(`Error selecting files: ${error.message}`);
    }
}

async function handleApproveEdit(patch) {
    try {
        const errors = validatePatch(patch);
        if (errors.length > 0) {
            vscode.window.showErrorMessage(`Invalid patch: ${errors.join(', ')}`);
            return;
        }

        const success = await applyPatch(patch);
        if (!success) {
            vscode.window.showErrorMessage('Failed to apply changes.');
        }
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(`Error applying patch: ${error.message}`);
    }
}

function getWebviewContent(webview, extensionPath) {
    const stylePath = vscode.Uri.file(path.join(extensionPath, 'src', 'webview', 'style.css'));
    const scriptPath = vscode.Uri.file(path.join(extensionPath, 'src', 'webview', 'script.js'));

    const styleUri = webview.asWebviewUri(stylePath);
    const scriptUri = webview.asWebviewUri(scriptPath);

    const htmlPath = path.join(extensionPath, 'src', 'webview', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Replace placeholders with URIs
    html = html.replace('{{styleUri}}', styleUri);
    html = html.replace('{{scriptUri}}', scriptUri);

    return html;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
