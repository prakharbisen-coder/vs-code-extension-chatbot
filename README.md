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

### Opening the Chatbot - Complete Guide

#### **Method 1: Using Command Palette (Recommended)**

1. **Open Command Palette**
   - **Windows/Linux**: Press `Ctrl+Shift+P`
   - **Mac**: Press `Cmd+Shift+P`
   - This opens VS Code's command search bar at the top

2. **Search for the Command**
   - Type: `Gemini Coder` or just `Open Chat`
   - As you type, VS Code filters available commands
   - You'll see: **"Gemini Coder: Open Chat"** in the dropdown

3. **Execute the Command**
   - Click on "Gemini Coder: Open Chat" with your mouse
   - OR press `Enter` when it's highlighted
   - The command appears in the list because it's registered in the extension

4. **Chat Interface Opens**
   - A new panel appears on the **right side** of VS Code (Column Two)
   - The panel is titled **"AI Code Assistant"**
   - You'll see:
     - Welcome message: "Hello! I am your AI Code Assistant..."
     - Message history area (initially shows welcome message)
     - Text input box at the bottom with placeholder text
     - 📎 **Attach button** on the left of input
     - **Send button** on the right of input

#### **What Happens Behind the Scenes:**

When you execute "Gemini Coder: Open Chat":

1. **Extension Activation**
   ```
   extension.js → activate() function called
   ↓
   Command "aibot.openChat" is registered
   ↓
   VS Code listens for this command
   ```

2. **Webview Creation**
   ```
   vscode.window.createWebviewPanel() is called
   ↓
   Creates a new panel in Column Two (side panel)
   ↓
   Loads HTML/CSS/JS from src/webview/ folder
   ↓
   Establishes secure message passing between webview and extension
   ```

3. **Interface Initialization**
   ```
   index.html loaded → Chat container created
   ↓
   style.css applied → VS Code theme colors applied
   ↓
   script.js executes → Event listeners attached
   ↓
   Ready to receive user input
   ```

#### **Troubleshooting: If Chat Doesn't Open**

**Issue 1: Command Not Found**
- **Cause**: Extension not installed or not activated
- **Solution**: 
  1. Check if you're in the Extension Development Host window (when testing)
  2. Or ensure extension is installed from VSIX package
  3. Restart VS Code

**Issue 2: Extension Development Mode**
- **For Developers Testing the Extension**:
  1. Open the project folder in VS Code
  2. Press `F5` to start debugging
  3. A new VS Code window opens (titled "[Extension Development Host]")
  4. **IMPORTANT**: Use the NEW window, not your original one
  5. In the new window, press `Ctrl+Shift+P` and open the chat
  6. The extension only works in the Extension Development Host window

**Issue 3: Chat Opens But Shows Error**
- **Cause**: API key not configured
- **Solution**: See "Initial Setup" section below

#### **First Time Setup Requirements**

Before the chatbot can respond to your messages:

1. **Get Gemini API Key** (One-time setup)
   - Visit: https://aistudio.google.com/apikey
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the key (starts with `AIzaSy...`)

2. **Configure API Key** (Choose one method):

   **Option A: Via VS Code Settings (Recommended for regular use)**
   ```
   1. Press Ctrl+, to open Settings
   2. Type "Gemini Coder" in search box
   3. Find "Aibot: Gemini Api Key"
   4. Paste your API key
   5. Settings auto-save
   ```

   **Option B: Via .env File (Recommended for development)**
   ```
   1. Create a file named ".env" in the extension root folder
   2. Add this line: GEMINI_API_KEY=your_actual_key_here
   3. Save the file
   4. Extension reads this on startup
   ```

3. **Verify Setup**
   - Open the chat
   - Type "Hello" and press Enter
   - If configured correctly, AI responds within 2-3 seconds
   - If you see "API Key not set" error, revisit step 2

#### **Understanding the Chat Interface**

Once opened, here's what you see:

```
┌─────────────────────────────────────────────────┐
│ AI Code Assistant                          ✕    │ ← Title bar
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Hello! I am your AI Code Assistant...      │ │ ← Welcome message
│ │ Open a file and ask me to analyze or fix.  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Your Message                                │ │ ← Your messages
│ └─────────────────────────────────────────────┘ │   (right-aligned, blue)
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ AI Response with explanations...            │ │ ← Bot responses
│ └─────────────────────────────────────────────┘ │   (left-aligned, gray)
│                                                 │
├─────────────────────────────────────────────────┤
│ [📎] [Type your message here...        ] [Send] │ ← Input area
└─────────────────────────────────────────────────┘
     ↑                                         ↑
  Attach files                              Send message
```

#### **Panel Features:**

- **Resizable**: Drag the edge to resize
- **Movable**: Can be moved to different panel positions
- **Retains Context**: Chat history persists while panel is open
- **Auto-scroll**: Automatically scrolls to new messages
- **Theme Aware**: Colors match your VS Code theme (dark/light)

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
