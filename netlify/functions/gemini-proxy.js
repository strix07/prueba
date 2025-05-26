// netlify/functions/gemini-proxy.js
const fetch = require('node-fetch'); // Importa node-fetch para hacer solicitudes HTTP

exports.handler = async function(event, context) {
    // Asegúrate de que solo las solicitudes POST sean aceptadas
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    // Obtén la clave de la API de las variables de entorno de Netlify
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY no está configurada en las variables de entorno de Netlify.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: API key not set.' }),
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body' }),
        };
    }

    // Extrae el prompt del cuerpo de la solicitud
    const prompt = requestBody.prompt;
    if (!prompt) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing prompt in request body.' }),
        };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            }),
        });

        const data = await response.json();

        // Si la API de Gemini devuelve un error, propaga el estado HTTP
        if (!response.ok) {
            console.error("Error from Gemini API:", data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error.message || 'Gemini API error', details: data }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error("Error calling Gemini API from Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to communicate with Gemini API', details: error.message }),
        };
    }
};