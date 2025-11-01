async function postJSON<TResponse>(
  url: string,
  body?: unknown,
  init?: RequestInit,
): Promise<TResponse> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Request failed ${resp.status}: ${text || resp.statusText}`,
    );
  }
  return (await resp.json()) as TResponse;
}

export type WebhookProcessSummary = {
  ok: boolean;
  processed: number;
  errors: number;
  items?: Array<{
    id: string;
    type?: string;
    processed: boolean;
    error?: string;
  }>;
};

export async function processWebhook(opts?: {
  batchSize?: number;
  endpoint?: string; 
  signal?: AbortSignal;
}): Promise<WebhookProcessSummary> {
  const {
    batchSize = 50,
    endpoint = "/api/webhooks/process",
    signal,
  } = opts ?? {};
  return await postJSON<WebhookProcessSummary>(
    endpoint,
    { batchSize },
    { signal },
  );
}

export async function reprocessFailedWebhooks(opts?: {
  since?: Date;
  limit?: number;
  endpoint?: string; 
  signal?: AbortSignal;
}): Promise<WebhookProcessSummary> {
  const {
    since = new Date(Date.now() - 30 * 60 * 1000),
    limit = 100,
    endpoint = "/api/webhooks/reprocess-failed",
    signal,
  } = opts ?? {};

  return await postJSON<WebhookProcessSummary>(
    endpoint,
    {
      since: since.toISOString(),
      limit,
    },
    { signal },
  );
}
