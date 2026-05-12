import { GoogleGenerativeAI } from '@google/generative-ai';

// Tenta ler de várias formas possíveis
const API_KEY = 
  import.meta.env.VITE_GEMINI_API_KEY || 
  import.meta.env.GEMINI_API_KEY || 
  (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null) ||
  '';

if (!API_KEY) {
  console.error('❌ Gemini API key não encontrada. Configure GEMINI_API_KEY no Vercel.');
}

export const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function generateText(prompt: string) {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in environment variables.');
  }
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}
