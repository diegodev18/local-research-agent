import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { resolveWorkspacePath } from "../../../lib/path-sandbox";
import { truncateForModel, type ToolContext } from "../context";

const SKIP_DIR_NAMES = new Set([
    "node_modules",
    ".git",
    ".svn",
    "dist",
    "build",
    ".next",
    "coverage",
    ".turbo",
]);

type Match = { path: string; line: number; snippet: string };

function normalizeExtensions(raw: unknown): string[] | null {
    if (!Array.isArray(raw)) return null;
    const out: string[] = [];
    for (const x of raw) {
        if (typeof x !== "string") continue;
        let e = x.trim().toLowerCase();
        if (e.startsWith(".")) e = e.slice(1);
        if (e) out.push(e);
    }
    return out.length ? out : null;
}

async function searchInFile(
    absPath: string,
    relPath: string,
    pattern: string,
    useRegex: boolean,
    maxMatches: number,
    collected: Match[],
): Promise<void> {
    if (collected.length >= maxMatches) return;
    let re: RegExp;
    try {
        re = useRegex
            ? new RegExp(pattern, "mi")
            : new RegExp(
                  pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                  "mi",
              );
    } catch {
        return;
    }

    let content: string;
    try {
        const buf = await readFile(absPath);
        if (buf.length > 512_000) return;
        if (buf.includes(0)) return;
        content = buf.toString("utf8");
    } catch {
        return;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length && collected.length < maxMatches; i++) {
        const line = lines[i] ?? "";
        if (re.test(line)) {
            const snippet =
                line.length > 240 ? `${line.slice(0, 237)}...` : line;
            collected.push({ path: relPath, line: i + 1, snippet });
            re.lastIndex = 0;
        }
    }
}

async function walkSearch(
    absDir: string,
    relDir: string,
    ctx: ToolContext,
    pattern: string,
    useRegex: boolean,
    extensions: string[] | null,
    filesTouched: { n: number },
    matches: Match[],
): Promise<void> {
    if (filesTouched.n >= ctx.searchMaxFiles || matches.length >= ctx.searchMaxMatches) {
        return;
    }

    let entries;
    try {
        entries = await readdir(absDir, { withFileTypes: true });
    } catch {
        return;
    }

    for (const ent of entries) {
        if (matches.length >= ctx.searchMaxMatches) break;
        if (ent.isDirectory()) {
            if (SKIP_DIR_NAMES.has(ent.name)) continue;
            const nextAbs = path.join(absDir, ent.name);
            const nextRel = relDir ? path.join(relDir, ent.name) : ent.name;
            await walkSearch(
                nextAbs,
                nextRel,
                ctx,
                pattern,
                useRegex,
                extensions,
                filesTouched,
                matches,
            );
        } else if (ent.isFile()) {
            const ext = path.extname(ent.name).slice(1).toLowerCase();
            if (extensions && !extensions.includes(ext)) continue;
            const absFile = path.join(absDir, ent.name);
            const relFile = relDir ? path.join(relDir, ent.name) : ent.name;
            filesTouched.n += 1;
            if (filesTouched.n > ctx.searchMaxFiles) break;
            await searchInFile(
                absFile,
                relFile,
                pattern,
                useRegex,
                ctx.searchMaxMatches,
                matches,
            );
        }
    }
}

export async function executeSearchFiles(
    ctx: ToolContext,
    args: Record<string, unknown>,
): Promise<object> {
    const pattern = typeof args.pattern === "string" ? args.pattern : "";
    if (!pattern.trim()) {
        return { ok: false, error: "pattern is required" };
    }

    const useRegex = args.useRegex === true;
    const extensions = normalizeExtensions(args.extensions);
    const baseRel =
        typeof args.path === "string" && args.path.length > 0 ? args.path : ".";

    const resolved = resolveWorkspacePath(ctx.workspaceRoot, baseRel);
    if (!resolved.ok) {
        return { ok: false, error: resolved.error };
    }

    try {
        const st = await stat(resolved.absolutePath);
        if (!st.isDirectory()) {
            return { ok: false, error: "path must be a directory to search under" };
        }

        const matches: Match[] = [];
        const filesTouched = { n: 0 };
        await walkSearch(
            resolved.absolutePath,
            baseRel === "." ? "" : baseRel,
            ctx,
            pattern,
            useRegex,
            extensions,
            filesTouched,
            matches,
        );

        const lines = matches.map(
            (m) => `${m.path}:${m.line}: ${m.snippet}`,
        );
        const text = lines.join("\n");
        return {
            ok: true,
            pattern,
            filesScanned: filesTouched.n,
            matchCount: matches.length,
            results: truncateForModel(text, ctx.maxOutputChars),
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, error: msg };
    }
}
