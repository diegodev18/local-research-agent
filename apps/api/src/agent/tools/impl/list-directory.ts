import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { resolveWorkspacePath } from "../../../lib/path-sandbox";
import { truncateForModel, type ToolContext } from "../context";

const DEFAULT_MAX_DEPTH = 2;
const HARD_MAX_DEPTH = 6;

type DirEntry = { name: string; type: "file" | "directory"; path: string };

async function walk(
    absDir: string,
    relDir: string,
    depth: number,
    maxDepth: number,
    out: DirEntry[],
): Promise<void> {
    if (depth > maxDepth) return;
    const entries = await readdir(absDir, { withFileTypes: true });
    for (const ent of entries) {
        const rel = path.join(relDir, ent.name);
        const abs = path.join(absDir, ent.name);
        if (ent.isDirectory()) {
            out.push({ name: ent.name, type: "directory", path: rel });
            if (depth < maxDepth) {
                await walk(abs, rel, depth + 1, maxDepth, out);
            }
        } else if (ent.isFile()) {
            out.push({ name: ent.name, type: "file", path: rel });
        }
    }
}

export async function executeListDirectory(
    ctx: ToolContext,
    args: Record<string, unknown>,
): Promise<object> {
    const rel =
        typeof args.path === "string" && args.path.length > 0 ? args.path : ".";
    let maxDepth =
        typeof args.maxDepth === "number" && Number.isFinite(args.maxDepth)
            ? Math.floor(args.maxDepth)
            : DEFAULT_MAX_DEPTH;
    maxDepth = Math.min(Math.max(0, maxDepth), HARD_MAX_DEPTH);

    const resolved = resolveWorkspacePath(ctx.workspaceRoot, rel);
    if (!resolved.ok) {
        return { ok: false, error: resolved.error };
    }

    try {
        const st = await stat(resolved.absolutePath);
        if (!st.isDirectory()) {
            return { ok: false, error: "Path is not a directory" };
        }
        const entries: DirEntry[] = [];
        await walk(
            resolved.absolutePath,
            rel === "." ? "" : rel,
            0,
            maxDepth,
            entries,
        );
        const lines = entries.map(
            (e) => `${e.type === "directory" ? "dir " : "file"} ${e.path}`,
        );
        const text = lines.join("\n");
        return {
            ok: true,
            listing: truncateForModel(text, ctx.maxOutputChars),
            entryCount: entries.length,
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, error: msg };
    }
}
