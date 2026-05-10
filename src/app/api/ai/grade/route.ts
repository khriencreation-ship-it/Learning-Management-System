import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { assignmentTitle, assignmentInstructions, submissionText, maxPoints, studentName } = body;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key not configured. Please add GEMINI_API_KEY to your .env.local file." }, { status: 500 });
        }

        if (!submissionText) {
            return NextResponse.json({ error: "No submission text provided to analyze." }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest"
        });

        const prompt = `
            You are a professional academic tutor. Your task is to grade a student's assignment submission.
            
            ASSIGNMENT CONTEXT:
            Title: ${assignmentTitle}
            Instructions: ${assignmentInstructions}
            Maximum Points: ${maxPoints}
            
            STUDENT SUBMISSION:
            ${submissionText}
            
            Based on the instructions provided, evaluate the student's work.
            - Provide a suggested score (number) strictly between 0 and ${maxPoints}. 
            - DO NOT exceed ${maxPoints} points.
            
            FEEDBACK STRUCTURE:
            1. Start with a warm greeting: "Dear ${studentName || 'Student'}," followed by a sincere appreciation of their effort in this specific assignment.
            2. Provide the main analysis: Detailed, constructive feedback in HTML format (using <p>, <strong>, <ul>, <li> tags). Be specific about what they did well and where they can improve.
            3. End with a supportive closing: Express appreciation again and provide a sentence or two of high-energy motivation for their future studies.
            
            The feedback should be professional, encouraging, and feel personal.
            
            RETURN YOUR RESPONSE STRICTLY IN THE FOLLOWING JSON FORMAT:
            {
                "score": number,
                "feedback": "string (HTML content)"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (parseError) {
            // Fallback for non-json response if flash fails mime type
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const data = JSON.parse(cleanedText);
            return NextResponse.json(data);
        }

    } catch (error: any) {
        console.error("AI Grading Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate AI grading" }, { status: 500 });
    }
}
