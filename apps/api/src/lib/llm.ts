import { GoogleGenerativeAI } from "@google/generative-ai";
import { GOOGLE_API_KEY, MAIN_AGENT_MODEL } from "../config";

let llm: GoogleGenerativeAI | null;
try {
    llm = new GoogleGenerativeAI(GOOGLE_API_KEY || "");
} catch (error) {
    console.error("Error initializing LLM", error);
    llm = null;
}

export default llm;