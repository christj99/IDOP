import Fastify from "fastify";

export function buildServer() {
  const server = Fastify({
    logger: true,
  });

  server.get("/health", async () => ({
    ok: true,
    service: "@idop/server",
  }));

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
