// src/lib/gemini-stub.ts
export class GoogleGenAI {
  constructor(_config: { apiKey: string }) {
    console.log('Gemini stub - No API key required');
  }
  
  async generateContent() {
    return { text: '{}' };
  }
}
