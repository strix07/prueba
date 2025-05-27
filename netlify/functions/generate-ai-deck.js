// netlify/functions/generate-ai-deck.js
exports.handler = async function(event, context) {
    // Solo permite peticiones POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { topic, wordCount, deckName } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY; // Accede a la API key desde las variables de entorno de Netlify

        if (!apiKey) {
            console.error("GEMINI_API_KEY no está configurada en las variables de entorno de Netlify.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Error de configuración del servidor: API key no encontrada." })
            };
        }

        const prompt = `Genera una lista de ${wordCount} pares de palabras para un mazo de flashcards sobre el tema '${topic}'. Cada par debe tener una palabra en inglés ('question') y su traducción al español ('answer'). Devuelve el resultado como un JSON que se ajuste al siguiente esquema. Asegúrate de que las palabras sean relevantes para el tema y variadas. No incluyas números o viñetas al inicio de las palabras.`;

        const schema = {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    "question": { "type": "STRING", description: "La palabra o frase corta en Inglés." },
                    "answer": { "type": "STRING", description: "La traducción al Español." }
                },
                required: ["question", "answer"]
            }
        };

        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        };

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json();
            console.error("Gemini API Error:", errorBody);
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ error: `Error de la API de Gemini: ${errorBody.error?.message || geminiResponse.statusText}` })
            };
        }

        const geminiResult = await geminiResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify(geminiResult) // Devuelve la respuesta de Gemini al cliente
        };

    } catch (error) {
        console.error('Error en la Netlify Function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Error interno del servidor: ${error.message}` })
        };
    }
};