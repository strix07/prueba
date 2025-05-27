// geminiApi.js

// La API Key será gestionada por el entorno de Canvas.
// Para despliegues fuera de Canvas, considera usar Netlify Functions para proteger tu API Key.
const API_KEY = ""; // NO CAMBIES ESTO SI ESTÁS EN EL ENTORNO DE CANVAS

/**
 * Genera un mazo de flashcards utilizando la API de Gemini.
 * @param {string} topic El tema para el mazo de flashcards.
 * @param {number} numCards El número de flashcards a generar.
 * @returns {Promise<Array<{question: string, answer: string}>>} Una promesa que resuelve a un array de objetos de flashcards.
 * @throws {Error} Si ocurre un error durante la llamada a la API o el procesamiento de la respuesta.
 */
export async function generateFlashcardDeck(topic, numCards) {
    console.log(`Solicitando ${numCards} flashcards sobre "${topic}" a la API de Gemini.`);

    // Instrucción detallada para la IA, solicitando un formato JSON específico.
    const prompt = `Genera una lista de ${numCards} flashcards (tarjetas de memoria) para aprender inglés sobre el tema "${topic}".
Cada flashcard debe consistir en una palabra o frase corta en inglés y su traducción directa y más común al español.
La palabra/frase en inglés será la "pregunta" (question) y la traducción al español será la "respuesta" (answer).
Evita explicaciones adicionales o notas, solo entrega los pares de pregunta y respuesta.

Por favor, proporciona la respuesta estructurada como un array de objetos JSON. Cada objeto debe tener exactamente dos claves:
1. "question": una cadena de texto con la palabra/frase en inglés.
2. "answer": una cadena de texto con la traducción al español.

Ejemplo del formato de respuesta JSON esperado:
[
  {"question": "Book", "answer": "Libro"},
  {"question": "To run", "answer": "Correr"},
  {"question": "Good morning", "answer": "Buenos días"}
]

Asegúrate de que la respuesta sea únicamente el array JSON, sin ningún texto adicional antes o después.`;

    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
        contents: chatHistory,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "question": { "type": "STRING" },
                        "answer": { "type": "STRING" }
                    },
                    required: ["question", "answer"] // Ambas propiedades son obligatorias
                }
            },
            // Ajustes adicionales opcionales para la generación:
            // temperature: 0.7, // Controla la creatividad (0.0 - 1.0)
            // topK: 40,
            // topP: 0.95,
            // maxOutputTokens: 1024, // Límite de tokens en la respuesta
        }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text(); // Intenta obtener más detalles del error
            console.error("Error en la respuesta de la API de Gemini:", response.status, errorBody);
            throw new Error(`Error de la API de Gemini: ${response.status}. Detalles: ${errorBody}`);
        }

        const result = await response.json();
        console.log("Respuesta cruda de la API de Gemini:", JSON.stringify(result, null, 2));

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            
            const part = result.candidates[0].content.parts[0];
            if (part.text) {
                const jsonText = part.text;
                console.log("Texto JSON recibido de Gemini:", jsonText);
                try {
                    const parsedJson = JSON.parse(jsonText);
                    // Validación adicional del formato
                    if (Array.isArray(parsedJson) && parsedJson.every(item => typeof item.question === 'string' && typeof item.answer === 'string')) {
                        console.log("Flashcards parseadas exitosamente:", parsedJson);
                        return parsedJson.slice(0, numCards); // Asegura no exceder el número solicitado
                    } else {
                        console.error("El JSON de Gemini no es un array de flashcards válidas:", parsedJson);
                        throw new Error("La respuesta de la IA no tiene el formato esperado (array de objetos con question/answer).");
                    }
                } catch (e) {
                    console.error("Error al parsear el JSON de la respuesta de Gemini:", e);
                    console.error("Texto JSON problemático:", jsonText);
                    throw new Error("Error al procesar la respuesta de la IA (formato JSON incorrecto).");
                }
            } else {
                 console.error("La parte de la respuesta de Gemini no contiene texto:", part);
                 throw new Error("La respuesta de la IA no contiene datos de texto para las flashcards.");
            }
        } else {
            // Manejo de casos donde la estructura de la respuesta no es la esperada,
            // o si hay un promptFeedback con blockReason.
            if (result.promptFeedback && result.promptFeedback.blockReason) {
                console.error("La solicitud fue bloqueada por Gemini:", result.promptFeedback.blockReason, result.promptFeedback.safetyRatings);
                throw new Error(`La generación de contenido fue bloqueada por Gemini debido a: ${result.promptFeedback.blockReason}. Revisa el tema e intenta de nuevo.`);
            }
            console.error("Respuesta inesperada o vacía de la API de Gemini:", result);
            throw new Error("No se recibieron flashcards válidas de la IA. La respuesta podría estar vacía o tener un formato inesperado.");
        }
    } catch (error) {
        console.error("Error detallado en generateFlashcardDeck:", error);
        // Si el error ya es uno de los que lanzamos, no lo envolvemos de nuevo.
        if (error.message.startsWith("Error de la API de Gemini") || error.message.startsWith("La respuesta de la IA") || error.message.startsWith("Error al procesar la respuesta") || error.message.startsWith("No se recibieron flashcards válidas") || error.message.startsWith("La generación de contenido fue bloqueada")) {
            throw error;
        }
        throw new Error(`Error de conexión o configuración al llamar a la API de Gemini: ${error.message}`);
    }
}
