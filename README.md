# Gemini Coder VS Code Extension

An AI-powered coding assistant for VS Code using Google's Gemini API.

## Features

- **Chat Interface**: Interact with Gemini directly within VS Code.
- **Context Awareness**: Can read the active file to provide relevant suggestions.
- **Safe Edits**: Proposals are returned as JSON patches and require user approval before applying.
- **Workspace Security**: Asks for permission before scanning workspace files.

## Setup

1.  **Get an API Key**: Obtain a Gemini API key from Google AI Studio.
2.  **Configure**: Go to VS Code Settings (`Ctrl+,`), search for "Gemini Coder", and paste your API Key.
3.  **Run**: Press `Ctrl+Shift+P` and request "Gemini Coder: Open Chat".

## Requirements

- VS Code 1.80.0 or higher.
- Internet connection for API calls.

## Extension Settings

This extension contributes the following settings:

*   `aibot.geminiApiKey`: Your Google Gemini API key.

## Known Issues

- Large files (>200KB) are skipped to preserve context window.

## Release Notes

### 0.0.1

Initial release of Gemini Coder.
