async function getJSON<TResponse>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
  init?: RequestInit,
): Promise<TResponse> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      qs.set(k, String(v));
    }
  }
  const href = qs.toString() ? `${url}?${qs.toString()}` : url;

  const resp = await fetch(href, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `GET ${href} failed ${resp.status}: ${text || resp.statusText}`,
    );
  }
  return (await resp.json()) as TResponse;
}

export type WebhookEventDTO = {
  id: string;
  action: string;
  apiVersion: string;
  dataId: string;
  dateCreated: string; 
  type: string;
  processed: boolean;
  createdAt: string; 
  rawData?: unknown; 
};

export type PageMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type WebhookEventsResponse = {
  ok: boolean;
  items: WebhookEventDTO[];
  page: PageMeta;
};

export async function getWebhookEvents(opts?: {
  processed?: boolean;
  type?: string;
  action?: string;
  dataId?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
  endpoint?: string; 
  signal?: AbortSignal;
}): Promise<WebhookEventsResponse> {
  const {
    processed,
    type,
    action,
    dataId,
    since,
    until,
    limit = 20,
    offset = 0,
    endpoint = "/api/webhooks/events",
    signal,
  } = opts ?? {};

  return await getJSON<WebhookEventsResponse>(
    endpoint,
    {
      processed,
      type,
      action,
      dataId,
      since: since ? since.toISOString() : undefined,
      until: until ? until.toISOString() : undefined,
      limit,
      offset,
    },
    { signal },
  );
}

export async function getFailedWebhooks(opts?: {
  since?: Date; 
  limit?: number;
  offset?: number; 
  endpoint?: string; 
  signal?: AbortSignal;
}): Promise<WebhookEventsResponse> {
  const {
    since = new Date(Date.now() - 30 * 60 * 1000),
    limit = 50,
    offset = 0,
    endpoint = "/api/webhooks/failed",
    signal,
  } = opts ?? {};

  return await getJSON<WebhookEventsResponse>(
    endpoint,
    {
      since: since.toISOString(),
      limit,
      offset,
    },
    { signal },
  );
}
