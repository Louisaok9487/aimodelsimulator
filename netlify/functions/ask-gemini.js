// netlify/functions/ask-gemini.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    console.log("Function invoked!"); // Log start of function
    if (event.httpMethod !== "POST") {
        console.log("Method not POST:", event.httpMethod);
        return {
            statusCode: 405,
            body: "Method Not Allowed",
        };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    console.log("API Key present:", !!GEMINI_API_KEY); // Check if key is defined

    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Gemini API key not configured." }),
        };
    }

    try {
        const parsedBody = JSON.parse(event.body);
        const { query } = parsedBody;
        console.log("Received query:", query); // Log the received query

        if (!query) {
            console.log("Query is missing.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Query parameter is missing." }),
            };
        }

        const chatHistory = [{ role: "user", parts: [{ text: query }] }];
        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        console.log("Making fetch request to Gemini API..."); // Log before fetch

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log("Gemini API response status:", response.status); // Log response status

        const result = await response.json();
        console.log("Gemini API raw result:", JSON.stringify(result, null, 2)); // Log full raw result

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const aiResponse = result.candidates[0].content.parts[0].text;
            console.log("AI Response extracted successfully.");
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
        console.error("Function error caught:", error); // Log any caught errors
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Server error: ${error.message}` }),
        };
    }
};
