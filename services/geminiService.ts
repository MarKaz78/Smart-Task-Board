
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const organizeTasksWithAI = async (tasks: Task[]): Promise<string[]> => {
  const ai = getAI();
  const taskData = tasks.map(t => ({ id: t.id, title: t.title, desc: t.description }));
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these tasks and return a JSON array of task IDs sorted by logical priority (most urgent/important first).
    Tasks: ${JSON.stringify(taskData)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return tasks.map(t => t.id);
  }
};

export const enhanceTaskDescription = async (title: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a short, professional, action-oriented description (max 2 sentences) for a task titled: "${title}"`,
  });
  return response.text?.trim() || "";
};
