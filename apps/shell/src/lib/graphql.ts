type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? process.env.SERVER_URL ?? "http://localhost:4000";
const GRAPHQL_ENDPOINT = process.env.MOA_SERVER_GRAPHQL_URL ?? `${SERVER_URL}/graphql`;

export async function runGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<TData> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphqlResponse<TData>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((entry) => entry.message).join(", "));
  }

  if (!payload.data) {
    throw new Error("GraphQL response did not include data");
  }

  return payload.data;
}
