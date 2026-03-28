type LogMeta = Record<string, unknown>;

function timestamp(): string {
    return new Date().toISOString();
}

function serialize(meta: LogMeta): string {
    try {
        return JSON.stringify(meta);
    } catch {
        return "{}";
    }
}

/** Registro de actividad del servidor (HTTP, agente). No registrar secretos ni cuerpos completos. */
export const log = {
    info(message: string, meta?: LogMeta): void {
        if (meta === undefined) {
            console.log(`${timestamp()} [api] ${message}`);
        } else {
            console.log(`${timestamp()} [api] ${message} ${serialize(meta)}`);
        }
    },

    warn(message: string, meta?: LogMeta): void {
        if (meta === undefined) {
            console.warn(`${timestamp()} [api] ${message}`);
        } else {
            console.warn(`${timestamp()} [api] ${message} ${serialize(meta)}`);
        }
    },
};
