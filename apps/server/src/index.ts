import Fastify from "fastify";

import {
  createDefaultJourneyApiDependencies,
  registerJourneyApi,
  type JourneyApiDependencies,
} from "./api/journey-api.js";

export interface BuildServerOptions {
  journeyApi?: JourneyApiDependencies;
  logger?: boolean;
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = buildServer();
  const port = Number(process.env.PORT ?? 3000);

  await server.listen({
    host: "0.0.0.0",
    port,
  });
}
