import { readFile } from "node:fs/promises";

import { resolveWorkspacePath } from "../../../lib/path-sandbox";
import { truncateForModel, type ToolContext } from "../context";

export async function executeReadFile(
    ctx: ToolContext,
    args: Record<string, unknown>,
): Promise<object> {
    const rel = typeof args.path === "string" ? args.path : "";
    const resolved = resolveWorkspacePath(ctx.workspaceRoot, rel);
    if (!resolved.ok) {
        return { ok: false, error: resolved.error };
    }

    try {
        const buf = await readFile(resolved.absolutePath);
        if (buf.length > ctx.maxFileBytes) {
            return {
                ok: false,
                error: `File too large (${buf.length} bytes; max ${ctx.maxFileBytes})`,
            };
        }
        const text = buf.toString("utf8");
        const content = truncateForModel(text, ctx.maxOutputChars);
        return {
            ok: true,
            path: rel,
            content,
            byteLength: buf.length,
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, error: msg };
    }
}
