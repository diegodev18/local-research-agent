import path from "node:path";

const isWin = process.platform === "win32";

function normalizeKey(p: string): string {
    const n = path.normalize(path.resolve(p));
    return isWin ? n.toLowerCase() : n;
}

/**
 * Resolves `relativeOrAbsolute` against `workspaceRoot` and ensures the result stays inside the workspace.
 */
export function resolveWorkspacePath(
    workspaceRoot: string,
    relativeOrAbsolute: string,
): { ok: true; absolutePath: string } | { ok: false; error: string } {
    const root = path.resolve(workspaceRoot);
    const rootKey = normalizeKey(root);

    const raw = relativeOrAbsolute.trim();
    if (!raw) {
        return { ok: false, error: "Path is empty" };
    }

    const candidate = path.isAbsolute(raw)
        ? path.resolve(raw)
        : path.resolve(root, raw);

    const candKey = normalizeKey(candidate);
    if (!candKey.startsWith(rootKey)) {
        return {
            ok: false,
            error: "Path escapes workspace sandbox",
        };
    }

    return { ok: true, absolutePath: candidate };
}
