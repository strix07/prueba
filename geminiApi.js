// geminiApi.js (versión corregida para Netlify Functions)

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

// La función generateFlashcardDeck con su contenido correctamente anidado
async function generateFlashcardDeck(topic, numCards = 10) {
    const prompt = `Genera un mazo de ${numCards} flashcards de inglés sobre el tema "${topic}". Cada flashcard debe tener un término en inglés y su traducción al español, y opcionalmente un ejemplo de uso en inglés. Formato:
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
        // ... más flashcards
    ]
    Asegúrate de que la respuesta sea un JSON válido y solo contenga el array de flashcards.`;

    // ¡Este bloque try...catch debe ir AQUÍ DENTRO de las llaves de generateFlashcardDeck!
    try {
        const geminiResponse = await callGeminiApi(prompt);
        // La respuesta de la función proxy ya debería ser la respuesta "pura" de Gemini
        const responseText = geminiResponse.candidates[0].content.parts[0].text; // Asegúrate de que esta ruta sea correcta para tu proxy

        const deck = JSON.parse(responseText);
        return deck;
    } catch (error) {
        console.error("Error generating flashcard deck in geminiApi.js:", error);
        return null; // Devuelve null o propaga el error como prefieras
    }
} // <--- Esta es la ÚNICA llave de cierre para generateFlashcardDeck

// Exporta las funciones para que puedan ser importadas en index.html
export { callGeminiApi, generateFlashcardDeck };