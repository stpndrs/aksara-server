// Import axios
const axios = require('axios');
const { cleanLLMOutput, validateQuizSchema, tryParseJSON } = require('../helpers/promptHelpers');

// PENTING: Gunakan URL internal server Python
// Karena keduanya ada di VPS yang sama, panggil 'localhost'
// dan port Gunicorn (5000). Ini jauh lebih cepat
// daripada memanggil 'https://ai.leksigo.com'
const AI_API_URL = process.env.AI_API_URL;
// const AI_API_URL = 'https://ai.leksigo.com';

/**
 * Meneruskan permintaan Image-to-Text (OCR) ke server AI
 */
async function processImageToText(base64Content, keyAnswer) {
    try {
        // Panggil endpoint /image-processing di server AI (FastAPI)
        // Kirim JSON body yang diharapkan oleh FastAPI: { "image": "..." }
        const response = await axios.post(`${AI_API_URL}/image-processing`, {
            image: base64Content,
            correct: keyAnswer
        });

        // Kembalikan data dari server AI
        console.log(response.data)
        return response.data;

    } catch (error) {
        console.log(error)
        console.error("Error memanggil AI (OCR):", error.message);
        throw new Error("Gagal memproses gambar.");
    }
}

/**
 * Meneruskan permintaan Audio-to-Text (STT) ke server AI
 */
async function processAudioToText(base64Content, keyAnswer) {
    try {
        // Panggil endpoint /speech-to-text di server AI (FastAPI)
        // Kirim JSON body yang diharapkan: { "audio": "..." }
        const response = await axios.post(`${AI_API_URL}/speech-to-text`, {
            audio: base64Content,
            correct: keyAnswer
        });

        // Kembalikan data dari server AI

        console.log("Dari AUdio : " + response.data)
        return response.data;

    } catch (error) {
        console.error("Error memanggil AI (STT):", error.message);
        throw new Error("Gagal memproses audio.");
    }
}

async function processLLM(model, prompt) {
    try {
        // Panggil API LLM
        const response = await axios.post(`${AI_API_URL}/llm-quiz/api/generate`, {
            model: model,
            prompt: prompt,
            stream: false
        });

        return response.data.response;

    } catch (error) {
        console.error("Gagal memanggil LLM:", error.message);
        throw error; // Lempar error agar generateLLM tahu ada masalah
    }
}

async function generateLLM({
    prompt,
    model = "gpt-oss:20b-cloud", // Default model jika tidak dikirim
    retries = 3
}) {
    console.log("GENERATING USING MODEL ", model);

    for (let i = 0; i < retries; i++) {
        try {
            // Panggil fungsi processLLM yang sudah diperbaiki
            const raw = await processLLM(model, prompt);

            const cleaned = cleanLLMOutput(raw);

            console.log("RAW OUTPUT:", raw);
            console.log("CLEANED:", cleaned);

            console.log("PARSING");
            const parsed = tryParseJSON(cleaned);

            return parsed;
        } catch (err) {
            console.log(err)
            console.warn(`Retry ${i + 1}: Error calling LLM - ${err.message}`);
            // Lanjut ke retry berikutnya jika API error
        }
    }
    throw new Error(`Model failed to produce valid JSON after ${retries} retries`);
}

module.exports = {
    processImageToText,
    processAudioToText,
    processLLM,
    generateLLM
};