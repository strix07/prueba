// geminiApi.js (versión para Netlify Functions)

async function callGeminiApi(prompt) {
    // Llama a tu Netlify Function, no directamente a la API de Gemini
    const url = '/api/gemini-proxy'; // Esto coincidirá con tu redirección en netlify.toml

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }), // Envía el prompt en el cuerpo
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error calling Netlify Function:", errorData);
            throw new Error(`Error ${response.status}: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to call Netlify Function for Gemini API:", error);
        throw error;
    }
}

// Dentro de geminiApi.js, en la función generateFlashcardDeck
async function generateFlashcardDeck(topic, numCards = 10) {
    const prompt = `Genera un mazo de <span class="math-inline">\{numCards\} flashcards de inglés sobre el tema "</span>{topic}". Cada flashcard debe tener un término en inglés y su traducción al español, y opcionalmente un ejemplo de uso en inglés. Formato:
[
    {
        "english": "término en inglés 1",
        "spanish": "traducción en español 1",
        "example": "ejemplo de uso 1 (opcional)"
    },
    {
        "english": "término en inglés 2",
        "spanish": "traducción en español 2",
        "example": "ejemplo de uso 2 (opcional)"
    }
    ...
]
Asegúrate de que la respuesta sea un JSON válido y solo contenga el array de flashcards.`;
}

    try {
        const geminiResponse = await callGeminiApi(prompt);
        // La respuesta de la función proxy ya debería ser la respuesta "pura" de Gemini
        const responseText = geminiResponse.candidates[0].content.parts[0].text;

        const deck = JSON.parse(responseText);
        return deck;
    } catch (error) {
        console.error("Error generating flashcard deck:", error);
        return null;
    }
}

export { callGeminiApi, generateFlashcardDeck };