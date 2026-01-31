# Gemini Coder VS Code Extension

An AI-powered coding assistant for VS Code using Google's Gemini API. This intelligent extension integrates Google's Gemini AI directly into the development environment, providing developers with an interactive AI coding assistant. The extension enables real-time code analysis, bug detection, automated code fixes, and intelligent suggestions through a seamless chat interface.

## Features

- **Chat Interface**: Interact with Gemini directly within VS Code with a beautiful webview interface.
- **File Attachment**: Use the 📎 button to attach files via Quick Pick - search and select multiple files instantly.
- **Context Awareness**: Automatically reads the active file and can load files mentioned by name in chat.
- **Workspace Scanning**: Analyze entire project (up to 50 files) when you use keywords like "analyze project".
- **Auto-Apply Changes**: AI suggests fixes as structured JSON patches with "Apply Changes" button.
- **Multi-File Support**: Apply changes to any file in workspace, not just open ones.
- **Rate Limit Handling**: Automatic retry with 6-second delay for API rate limits.
- **Safe Edits**: All changes require user approval before being applied.

## Setup

1.  **Get an API Key**: Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2.  **Configure**: Go to VS Code Settings (`Ctrl+,`), search for "Gemini Coder", and paste your API Key.
    - Or create a `.env` file with `GEMINI_API_KEY=your_key_here`
3.  **Run**: Press `Ctrl+Shift+P` and select "Gemini Coder: Open Chat".

## Usage

### Opening the Chat
- Press `Ctrl+Shift+P`
- Type "Gemini Coder: Open Chat"
- Chat panel opens on the right side

### Attaching Files
1. Click the **📎 button** in the chat
2. Quick Pick opens with all workspace files
3. Type to search, press Space to select, Enter to confirm
4. Files appear below input with remove buttons (✕)
5. Type your question and send

### Examples
- "Fix the bug in line 15"
- "Add error handling to this function"
- Attach multiple files: "Compare these files and find differences"
- "Analyze my entire project structure"

## Requirements

- VS Code 1.80.0 or higher
- Node.js 18+ (for fetch API)
- Internet connection for API calls
- Google Gemini API key

## Extension Settings

This extension contributes the following settings:

*   `aibot.geminiApiKey`: Your Google Gemini API key

## Project Structure

```
gemini-coder/
├── extension.js          # Main extension entry point
├── package.json          # Extension manifest
├── src/
│   ├── context.js        # File reading & workspace scanning
│   ├── gemini.js         # Gemini API integration
│   ├── patch.js          # Code modification logic
│   └── webview/
│       ├── index.html    # Chat UI structure
│       ├── script.js     # Frontend logic
│       └── style.css     # VS Code theme-matched styling
```

## Technologies Used

- **Node.js 18+** - Runtime with fetch API
- **VS Code Extension API 1.80+** - Editor integration
- **Google Gemini API (v1beta)** - AI model (gemini-2.5-flash)
- **HTML/CSS/JavaScript** - Webview interface
- **VS Code Webview API** - Secure communication

## Known Issues

- Large files (>200KB) are skipped to preserve context window
- Free tier API: 20 requests per minute limit
- Binary files (images, PDFs) not supported

## Release Notes

### 0.0.1

Initial release of Gemini Coder with:
- AI chat interface
- File attachment via Quick Pick
- Auto-apply code changes
- Multi-file support
- Rate limit handling
- Workspace scanning

## Contributing

Feel free to submit issues and pull requests!

## License

MIT

## Author

Prakhar Bisen (@prakharbisen-coder)
