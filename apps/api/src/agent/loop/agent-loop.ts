import {
    FunctionCallingMode,
    type Content,
    type Part,
    type TextPart,
} from "@google/generative-ai";

import { log } from "../../lib/logger";
import { getGeminiFunctionDeclarations } from "../tools/declarations";
import { runReadOnlyTool } from "../tools/runner";
import type { AgentLoopParams, AgentLoopResult } from "./types";

function sanitizeToolArgs(args: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
        if (typeof value === "string") {
            out[key] =
                value.length > 120 ? `${value.slice(0, 117)}...` : value;
        } else {
            out[key] = value;
        }
    }
    return out;
}

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
        runId,
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
        log.info("agent.llm.round", { runId, round: step });
        let result;
        try {
            result = await model.generateContent({ contents });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            log.warn("agent.llm.error", { runId, round: step, error: msg });
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
            log.info("agent.llm.tool_calls", {
                runId,
                round: step,
                count: calls.length,
                tools: calls.map((c) => c.name),
            });
            const frParts: Part[] = [];
            for (const call of calls) {
                const name = call.name;
                const args =
                    call.args &&
                    typeof call.args === "object" &&
                    !Array.isArray(call.args)
                        ? (call.args as Record<string, unknown>)
                        : {};
                log.info("agent.tool.execute", {
                    runId,
                    tool: name,
                    args: sanitizeToolArgs(args),
                });
                transcriptPush({ type: "tool_call", name, args });
                const out = await runReadOnlyTool(name, args, toolContext);
                const ok = (out as { ok?: boolean }).ok !== false;
                log.info("agent.tool.result", {
                    runId,
                    tool: name,
                    ok,
                });
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
