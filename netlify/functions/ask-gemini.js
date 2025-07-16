// netlify/functions/ask-gemini.js
const fetch = require('node-fetch'); // Ensure node-fetch is in your package.json dependencies

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed",
        };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server Error: Gemini API key not configured in Netlify environment variables." }),
        };
    }

    try {
        const { query } = JSON.parse(event.body);

        if (!query) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Bad Request: Query parameter is missing." }),
            };
        }

        const chatHistory = [{ role: "user", parts: [{ text: query }] }];
        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // IMPORTANT: Check for non-200 OK responses from Gemini API
        if (!response.ok) {
            const errorText = await response.text(); // Get raw error response from Google
            let errorMessage = `Gemini API Error: Status ${response.status}.`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = `Gemini API Error: ${errorJson.error.message || errorText}`;
            } catch {
                errorMessage = `Gemini API Error: ${errorText}`;
            }
            return {
                statusCode: response.status, // Return Google's status code if it's an error
                body: JSON.stringify({ error: errorMessage }),
            };
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const aiResponse = result.candidates[0].content.parts[0].text;
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response: aiResponse }),
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Gemini API Response Error: Unexpected structure or empty content." }),
            };
        }

    } catch (error) {
        // Catch any network errors or unhandled exceptions within the function
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Server Error: Unhandled exception during API call: ${error.message}` }),
        };
    }
};
