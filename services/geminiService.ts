
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

// Bezpośrednia inicjalizacja zgodnie z wytycznymi
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhanceTaskDescription = async (title: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a short, professional, action-oriented description (max 2 sentences) for a task titled: "${title}"`,
  });
  return response.text?.trim() || "";
};
