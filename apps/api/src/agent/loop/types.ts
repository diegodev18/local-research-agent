import type { Content } from "@google/generative-ai";
import type { GoogleGenerativeAI } from "@google/generative-ai";

import type { StepEvent } from "../session/types";
import type { ToolContext } from "../tools/context";

export type AgentLoopParams = {
    genAI: GoogleGenerativeAI;
    modelName: string;
    userMessage: string;
    history: Content[];
    systemInstruction: string;
    toolContext: ToolContext;
    maxSteps: number;
    transcriptPush: (e: StepEvent) => void;
};

export type AgentLoopResult =
    | { ok: true; reply: string }
    | { ok: false; error: string };
