import {
    FunctionCallingMode,
    type Content,
    type Part,
    type TextPart,
} from "@google/generative-ai";

import { getGeminiFunctionDeclarations } from "../tools/declarations";
import { runReadOnlyTool } from "../tools/runner";
import type { AgentLoopParams, AgentLoopResult } from "./types";

function isTextPart(p: Part): p is TextPart {
    return "text" in p && typeof (p as TextPart).text === "string";
}

function textFromContent(content: Content | undefined): string {
    if (!content?.parts?.length) return "";
    return content.parts.filter(isTextPart).map((p) => p.text).join("");
}

function summarizeToolOut(out: object): string {
    try {
        const j = JSON.stringify(out);
        return j.length > 220 ? `${j.slice(0, 217)}...` : j;
    } catch {
        return "[unserializable]";
    }
}

export async function runAgentLoop(
    params: AgentLoopParams,
): Promise<AgentLoopResult> {
    const {
        genAI,
        modelName,
        userMessage,
        history,
        systemInstruction,
        toolContext,
        maxSteps,
        transcriptPush,
    } = params;

    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        tools: [{ functionDeclarations: getGeminiFunctionDeclarations() }],
        toolConfig: {
            functionCallingConfig: { mode: FunctionCallingMode.AUTO },
        },
    });

    const contents: Content[] = [...history];
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    let step = 0;
    while (step < maxSteps) {
        step += 1;
        let result;
        try {
            result = await model.generateContent({ contents });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            transcriptPush({ type: "error", message: msg });
            return { ok: false, error: msg };
        }

        const resp = result.response;
        const block = resp.promptFeedback?.blockReason;
        if (block) {
            const msg = `Prompt blocked: ${block}`;
            transcriptPush({ type: "error", message: msg });
            return { ok: false, error: msg };
        }

        const candidate = resp.candidates?.[0];
        if (!candidate?.content) {
            const msg = "Empty model response";
            transcriptPush({ type: "error", message: msg });
            return { ok: false, error: msg };
        }

        const modelContent = candidate.content;
        contents.push(modelContent);

        const calls = resp.functionCalls();
        if (calls?.length) {
            const frParts: Part[] = [];
            for (const call of calls) {
                const name = call.name;
                const args =
                    call.args &&
                    typeof call.args === "object" &&
                    !Array.isArray(call.args)
                        ? (call.args as Record<string, unknown>)
                        : {};
                transcriptPush({ type: "tool_call", name, args });
                const out = await runReadOnlyTool(name, args, toolContext);
                const ok = (out as { ok?: boolean }).ok !== false;
                transcriptPush({
                    type: "tool_result",
                    name,
                    ok,
                    summary: summarizeToolOut(out),
                });
                frParts.push({
                    functionResponse: {
                        name,
                        response: out as object,
                    },
                });
            }
            contents.push({ role: "function", parts: frParts });
            continue;
        }

        let reply = textFromContent(modelContent);
        if (!reply) {
            try {
                reply = resp.text();
            } catch {
                reply = "";
            }
        }

        if (reply) {
            transcriptPush({ type: "assistant_text", text: reply });
        }
        transcriptPush({ type: "final", reply });
        return { ok: true, reply };
    }

    const msg = `Agent stopped: maximum steps (${maxSteps}) exceeded`;
    transcriptPush({ type: "error", message: msg });
    return { ok: false, error: msg };
}
