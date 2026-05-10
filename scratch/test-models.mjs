import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    try {
        console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "FOUND" : "NOT FOUND");
        
        // This is a direct fetch to the listModels endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("\n--- AVAILABLE MODELS ---");
            data.models.forEach(m => {
                console.log(`- ${m.name.split('/').pop()} (${m.supportedGenerationMethods.join(', ')})`);
            });
            console.log("------------------------\n");
        } else {
            console.error("Error Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Connection Error:", error);
    }
}

listModels();
