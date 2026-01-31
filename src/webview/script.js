const vscode = acquireVsCodeApi();

const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn');
const attachedFilesContainer = document.getElementById('attached-files');

let attachedFiles = [];

sendBtn.addEventListener('click', sendMessage);
attachBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'selectFiles' });
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'botMessage':
            addMessage(message.text, 'bot');
            if (message.patch) {
                renderPatch(message.patch);
            }
            break;
        case 'filesSelected':
            handleFilesSelected(message.files);
            break;
    }
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text && attachedFiles.length === 0) return;

    const displayText = text || 'Attached files';
    addMessage(displayText, 'user');
    
    vscode.postMessage({ 
        command: 'sendMessage', 
        text: text, 
        attachedFiles: attachedFiles 
    });
    
    messageInput.value = '';
    attachedFiles = [];
    attachedFilesContainer.innerHTML = '';
}

function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderPatch(patch) {
    if (!patch || patch.length === 0) return;

    const div = document.createElement('div');
    div.className = 'message bot patch-container';

    const header = document.createElement('div');
    header.innerText = 'Suggested Changes:';
    header.style.marginBottom = '5px';
    div.appendChild(header);

    patch.forEach(change => {
        const item = document.createElement('div');
        item.className = 'patch-proposal';
        item.innerHTML = `
            <div class="patch-file">${change.file} (Lines ${change.startLine}-${change.endLine})</div>
            <pre>${escapeHtml(change.replacement)}</pre>
        `;
        div.appendChild(item);
    });

    const applyBtn = document.createElement('button');
    applyBtn.className = 'apply-btn';
    applyBtn.innerText = 'Apply Changes';
    applyBtn.onclick = () => {
        vscode.postMessage({ command: 'approveEdit', patch: patch });
        applyBtn.disabled = true;
        applyBtn.innerText = 'Applied';
    };
    div.appendChild(applyBtn);

    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleFilesSelected(files) {
    attachedFiles = files;
    renderAttachedFiles();
}

function renderAttachedFiles() {
    attachedFilesContainer.innerHTML = '';
    if (attachedFiles.length === 0) return;

    const container = document.createElement('div');
    container.className = 'attached-files-list';
    container.innerHTML = '<div class="attached-label">Attached files:</div>';
    
    attachedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'attached-file-item';
        fileItem.innerHTML = `
            <span class="file-name">📄 ${file.name}</span>
            <button class="remove-file" data-index="${index}">✕</button>
        `;
        container.appendChild(fileItem);
    });
    
    attachedFilesContainer.appendChild(container);
    
    // Add remove handlers
    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            attachedFiles.splice(index, 1);
            renderAttachedFiles();
        });
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}
