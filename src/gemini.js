const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// Try to load dotenv if available, for local development
try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
    // dotenv might not be installed or needed in production
}

async function callGemini(userPrompt, context, workspaceFiles = []) {
    // Priority: 1. .env file (for dev), 2. VS Code Settings
    let apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        const config = vscode.workspace.getConfiguration('aibot');
        apiKey = config.get('geminiApiKey');
    }

    if (!apiKey) {
        throw new Error('Gemini API Key is not set. Please set it in VS Code settings or .env file.');
    }

    const systemPrompt = `
You are an expert software engineer.
Analyze the provided code and the user's request.
Return fixes as structured JSON patches.
Do not rewrite entire files.
Only modify provided code.
Explain reasoning briefly.

RESPONSE FORMAT:
{
  "explanation": "Brief explanation",
  "changes": [
    {
      "file": "relative/path/to/file.js",
      "startLine": 12,
      "endLine": 14,
      "replacement": "corrected code"
    }
  ]
}

- startLine and endLine are 1-based.
- replacement should be the new content for those lines.
- If inserting, startLine can be same as endLine (or logical cursor position).
- If deleting, replacement is empty string.
`;

    // Construct the full prompt
    let fullPrompt;
    
    if (context && context.content) {
        fullPrompt = `
CURRENT FILE:
File: ${context.file}
Language: ${context.language}
Code:
\`\`\`${context.language}
${context.content}
\`\`\`
`;
    } else {
        fullPrompt = `
CURRENT FILE:
No file is currently open.
`;
    }

    // Add workspace context if available
    if (workspaceFiles && workspaceFiles.length > 0) {
        fullPrompt += `

WORKSPACE FILES (${workspaceFiles.length} files):
`;
        workspaceFiles.forEach(file => {
            fullPrompt += `
--- ${file.file} ---
${file.content.substring(0, 2000)}${file.content.length > 2000 ? '\n... (truncated)' : ''}
`;
        });
    }

    fullPrompt += `

USER REQUEST:
${userPrompt}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
        contents: [{
            role: "user",
            parts: [{ text: systemPrompt + "\n" + fullPrompt }]
        }]
    };

    try {
        console.log('Sending request to Gemini API...');
        
        // Use global fetch (available in Node 18+ / VS Code recent versions)
        // If fetch is not available, we need to use axios or node-fetch
        if (typeof fetch === 'undefined') {
            throw new Error('fetch is not available. Please ensure you are using Node 18+ or VS Code 1.80+');
        }
        
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        // Retry once if rate limited
        if (response.status === 429) {
            console.log('Rate limited, waiting 6 seconds and retrying...');
            await new Promise(resolve => setTimeout(resolve, 6000));
            
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
        }

        console.log('Response status:', response.status);

        if (!response.ok) {
            const err = await response.json();
            console.error('API Error:', err);
            
            // Provide helpful error message for rate limits
            if (response.status === 429) {
                throw new Error('API rate limit exceeded. Please wait a moment and try again. Free tier allows 20 requests per minute.');
            }
            
            throw new Error(`Gemini API Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('Gemini response received');
        
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidate) {
            console.error('No candidate in response:', JSON.stringify(data, null, 2));
            throw new Error('No response from Gemini.');
        }

        // Clean up markdown code blocks if present in response
        let cleaned = candidate.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        try {
            const parsed = JSON.parse(cleaned);
            console.log('Successfully parsed response');
            return parsed;
        } catch (e) {
            console.error('JSON Parse Error:', e.message);
            console.error('Response text:', cleaned);
            throw new Error('Failed to parse Gemini response as JSON. Response: ' + cleaned.substring(0, 200));
        }

    } catch (error) {
        console.error('callGemini error:', error);
        throw error;
    }
}

module.exports = {
    callGemini
};
