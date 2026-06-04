import { resolve, win32 } from "node:path";
import { fileURLToPath } from "node:url";

import Fastify, { type FastifyServerOptions } from "fastify";

import {
  createDefaultJourneyApiDependencies,
  registerJourneyApi,
  type JourneyApiDependencies,
} from "./api/journey-api.js";

export interface BuildServerOptions {
  journeyApi?: JourneyApiDependencies;
  logger?: FastifyServerOptions["logger"];
}

export function buildServer(options: BuildServerOptions = {}) {
  const server = Fastify({
    logger: options.logger ?? true,
  });

  server.get("/health", async () => ({
    ok: true,
    service: "@idop/server",
  }));

  registerJourneyApi(server, options.journeyApi ?? createDefaultJourneyApiDependencies());

  return server;
}

export function isEntrypointModule(importMetaUrl: string, argvPath: string | undefined): boolean {
  if (argvPath === undefined) {
    return false;
  }

  const modulePath = fileURLToPath(importMetaUrl);

  if (isWindowsPath(argvPath)) {
    return normalizeWindowsPath(modulePath) === normalizeWindowsPath(argvPath);
  }

  return resolve(modulePath) === resolve(argvPath);
}

function isWindowsPath(path: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(path);
}

function normalizeWindowsPath(path: string): string {
  return win32.resolve(path.replace(/^\/([A-Za-z]:[\\/])/, "$1"));
}

if (isEntrypointModule(import.meta.url, process.argv[1])) {
  const server = buildServer();
  const port = Number(process.env.PORT ?? 3000);

  await server.listen({
    host: "0.0.0.0",
    port,
  });
}
