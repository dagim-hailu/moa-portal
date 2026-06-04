export function getServerHttpBaseUrl() {
  // Server-side route handlers need an internal URL that works inside Docker.
  // Prefer MOA_SERVER_GRAPHQL_URL (already set in docker-compose) and strip /graphql.
  const graphql = process.env.MOA_SERVER_GRAPHQL_URL;
  if (graphql) {
    return graphql.replace(/\/graphql\/?$/, "");
  }

  // Fallbacks (local dev / non-docker).
  return process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
}

