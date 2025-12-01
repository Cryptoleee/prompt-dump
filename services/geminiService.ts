import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Category } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePrompt = async (promptText: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following AI image generation prompt. Categorize it, extract up to 5 relevant tags (keywords), and determine the mood.
      
      Prompt: "${promptText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Up to 5 keywords describing the style, subject, or medium."
            },
            category: {
              type: Type.STRING,
              enum: [
                "Photorealistic",
                "Illustration",
                "3D Render",
                "Vector",
                "Painting",
                "Other"
              ],
              description: "The best fitting art category."
            },
            mood: {
              type: Type.STRING,
              description: "A single adjective describing the mood (e.g., Dark, Cheerful, Serene)."
            }
          },
          required: ["tags", "category", "mood"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Validate mapping to our internal enum
    let category = Category.OTHER;
    const catStr = result.category as string;
    
    if (Object.values(Category).includes(catStr as Category)) {
        category = catStr as Category;
    }

    return {
      tags: result.tags || [],
      category: category,
      mood: result.mood || 'Neutral'
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback if AI fails
    return {
      tags: [],
      category: Category.UNSORTED,
      mood: 'Unknown'
    };
  }
};

export const extractTweetInfo = async (url: string): Promise<{prompt?: string, imageUrl?: string}> => {
  if (!url) return {};
  
  try {
    // We use the search tool to "view" the tweet content indirectly
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search for this specific tweet or social media post: ${url}.
      
      I need you to extract two things:
      1. The AI image generation prompt text contained in the post (usually describing a subject, style, lighting, etc).
      2. The direct URL of the main image attached to the post.
         - Look for High Quality image links.
         - Often these look like "https://pbs.twimg.com/media/..." or similar.
         - Do NOT return generic profile pictures or icon URLs.

      Format your response exactly like this:
      PROMPT_FOUND: [The extracted prompt text here]
      IMAGE_FOUND: [The direct image url here]
      
      If you can't find one of them, leave that field empty after the label.`,
      config: {
        tools: [{ googleSearch: {} }],
        // responseSchema is NOT allowed with googleSearch
      }
    });

    const text = response.text || '';
    
    // Simple parsing of the structured text response
    let prompt = '';
    let imageUrl = '';

    const promptMatch = text.match(/PROMPT_FOUND:\s*(.*)/i);
    if (promptMatch && promptMatch[1]) {
        prompt = promptMatch[1].trim();
    }

    const imageMatch = text.match(/IMAGE_FOUND:\s*(.*)/i);
    if (imageMatch && imageMatch[1]) {
        // extract first http link found in the line
        const urlMatch = imageMatch[1].match(/https?:\/\/[^\s"']+/);
        if (urlMatch) {
            imageUrl = urlMatch[0];
        }
    }

    return { prompt, imageUrl };

  } catch (error) {
    console.error("Tweet extraction failed:", error);
    return {};
  }
}