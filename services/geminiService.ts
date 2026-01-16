
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = (process.env.API_KEY as string);

export const generateReimaginedImage = async (
  base64Image: string, 
  stylePrompt: string, 
  userRefinement?: string
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = 'gemini-2.5-flash-image';

  const prompt = userRefinement 
    ? `Apply these changes to this interior design image: ${userRefinement}. Maintain the overall structure of the room but transform it into a ${stylePrompt}.`
    : `Reimagine this room using the ${stylePrompt} style. Maintain the architectural layout and windows, but replace all furniture and decor to match the style perfectly. High resolution, professional interior photography.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

export const chatWithAssistant = async (
  message: string, 
  history: { role: 'user' | 'assistant', content: string }[]
): Promise<{ text: string, links: { title: string, uri: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: history.map(h => ({ role: h.role, parts: [{ text: h.content }] })).concat([{ role: 'user', parts: [{ text: message }] }]),
      config: {
        systemInstruction: "You are Lumina, a world-class interior designer. You help users refine their room designs. Be helpful, professional, and descriptive. Use Google Search to find real shoppable links for furniture or decor items mentioned in the conversation.",
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "I'm sorry, I couldn't process that request.";
    const links: { title: string, uri: string }[] = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        links.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });

    return { text, links };
  } catch (error) {
    console.error("Chat failed:", error);
    return { text: "Error connecting to AI assistant.", links: [] };
  }
};
