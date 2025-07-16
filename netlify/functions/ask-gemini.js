// netlify/functions/ask-gemini.js
const fetch = require('node-fetch'); // Node.js built-in fetch or npm install node-fetch if older Node.js

exports.handler = async function(event, context) {
    // Ensure this function only responds to POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed",
        };
    }

    // Get the API key from Netlify Environment Variables
    // This variable must be set in your Netlify site settings (see Step 5)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Gemini API key not configured." }),
        };
    }

    try {
        const { query } = JSON.parse(event.body); // Parse the query sent from your frontend

        if (!query) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Query parameter is missing." }),
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
            console.error('AI API response structure unexpected:', result);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Could not get a valid response from the AI model." }),
            };
        }

    } catch (error) {
        console.error("Function error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Server error: ${error.message}` }),
        };
    }
};
