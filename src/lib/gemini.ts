export const GEMINI_API_KEY = "AIzaSyBCrcMX3-_J56nDk_ML_tV7D535tUhmyOE";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function translateContent(
    content: string,
    targetLanguage: 'zh' | 'jp' | 'ko' | 'en'
) {
    if (!content) return "";

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompts = {
        'zh': "Translate the following text to Traditional Chinese (Taiwan). Keep the tone poetic, premium, and mysterious. Only return the translation, no explanations.",
        'jp': "Translate the following text to Japanese. Keep the tone poetic, premium, and mysterious (using subtle/aesthetic kanji). Only return the translation, no explanations.",
        'ko': "Translate the following text to Korean. Keep the tone poetic, premium, and mysterious. Only return the translation, no explanations.",
        'en': "Translate the following text to English. Keep the tone poetic, premium, and mysterious. Only return the translation, no explanations."
    };

    const prompt = `${prompts[targetLanguage]}:\n\n"${content}"`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim().replace(/^"|"$/g, '');
    } catch (error) {
        console.error("Gemini Translation Error:", error);
        return `[Auto-Translate Failed] ${content}`;
    }
}
