#!/bin/sh
set -e

WORKDIR="${AGENT_WORKSPACE_ROOT:-/workspace}"
export AGENT_WORKSPACE_ROOT="$WORKDIR"

if [ -z "$REPO_URL" ]; then
    echo "[entrypoint] REPO_URL is required (public Git HTTPS URL)" >&2
    exit 1
fi

mkdir -p "$WORKDIR"

clear_workspace() {
    echo "[entrypoint] FORCE_REPO_REFRESH: clearing ${WORKDIR}"
    find "$WORKDIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
}

if [ -d "$WORKDIR/.git" ]; then
    if [ "$FORCE_REPO_REFRESH" = "true" ]; then
        clear_workspace
    else
        echo "[entrypoint] Repo already present in ${WORKDIR}; skipping clone (set FORCE_REPO_REFRESH=true to reclonar)"
        exec "$@"
    fi
fi

CLONE_ARGS="--depth 1"
if [ -n "$REPO_REF" ]; then
    CLONE_ARGS="$CLONE_ARGS --branch ${REPO_REF}"
fi

echo "[entrypoint] Cloning ${REPO_URL} into ${WORKDIR} ..."
# shellcheck disable=SC2086
git clone ${CLONE_ARGS} "$REPO_URL" "$WORKDIR"

echo "[entrypoint] AGENT_WORKSPACE_ROOT=${WORKDIR}"
exec "$@"
