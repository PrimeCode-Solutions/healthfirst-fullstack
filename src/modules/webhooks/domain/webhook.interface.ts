import { promises } from "dns";

export type WebhookId = string & { readonly __brand: "WeebhookId" };

export type OwnerId = string & { readonly __brand: "OwnerId" };

export type WebhookEvent =
  | "order.created"
  | "order.paid"
  | "order.cancelled"
  | "invoice.issued"
  | "customer.updated";


export type WebhookStatus = "active" | "disable" | "deleted";

export type SignatureAlgo = "sha256" | "sha512";

export type WebhookCustomHeaders = Record<string, string>;

export interface Page { 
    limit: number;
    offset: number;
}

export interface Paginated<T> {
    data: T[];
    total: number;
    limit: number;
    offset: number;
}

export interface WebhookSecret { 
    value: string;
    algo: SignatureAlgo;
    rotatedAt?: Date;
}

export interface Webhook {
    id: WebhookId;
    ownerId: OwnerId;

    endpoint: string;

    events: WebhookEvent[];

    status: WebhookStatus;

    batched?: boolean;

    timeoutMs: number;

    maxAttempts: number;

    backoffBaseMs: number;

    header?: WebhookCustomHeaders;

    secret: WebhookSecret;

    createdAt: Date;

    updateAt: Date;
}

export interface WebhookDeliveryAttempt {
    id: string;
    webhookI: WebhookId;
    event: WebhookEvent;
    payloadHash: string;
    attempNumber: number;
    requestAt: Date;
    respondedAt?: Date;

    responseStatus?: number;

    durationMs?: number;

    responseBodySnippet?: string;

    errorMessage?: string;

    sucess: boolean;
}

export interface CreateWebhookDTO {
    ownerId: OwnerId;
    endpoint: string;
    events: WebhookEvent[];
    headers?: WebhookCustomHeaders;

    secret?: { value: string; algo?: SignatureAlgo };
    
    timeoutMs?: number;
    maxAttempts?: number;
    backoffBaseMS?: number;
    batcged?: boolean;
}

export interface UpdateWebhookDTO {
    id: WebhookId;
    ownerId: OwnerId;

    endpoint?: string;
    events?: WebhookEvent[];
    headers?: WebhookCustomHeaders;

    timeoutMs?: number;
    maxAttempts?: number;
    backoffBseMs?: number;
    batched?: boolean;

    status?: Exclude<WebhookStatus, "deleted">;
}

export interface RotateSecretDTO {
    id: WebhookId;
    ownerId: OwnerId;
    newValue?: string;
    algo?: SignatureAlgo;
}

export interface LogDeliveryAttemptDTO
    extends Omit<
    WebhookDeliveryAttempt,
    "id" | "respondedAt" | "duationMs" | "responseStatus" | "responseStatus" | "responseBodySnippet"
    >{}

export interface WebhookRepository { 
    create(data: CreateWebhookDTO): Promise<Webhook>;
    update(data: CreateWebhookDTO): Promise<Webhook>;

    delete(id: WebhookId): Promise<Webhook | null>;

    findById(id: WebhookId): Promise<Webhook | null>;
    findByEndpoint(ownerId: OwnerId, endpoint: OwnerId): Promise<void>;
    listByOwner(
        ownerId: OwnerId,
        page?: Page,
        filters?: { status?: WebhookStatus; events?: WebhookEvent }
    ): Promise<Paginated<Webhook>>;

    setStatus(id: WebhookId, ownerId: OwnerId, status: WebhookStatus): Promise<void>;
    rotateSecret(input: RotateSecretDTO): Promise<Webhook>;

    logAttempt( attempt:WebhookEvent): Promise<void>;
    listAttempt(
        webhookId: WebhookId,
        page?: Page,
        filters?: { event?: WebhookEvent; sucess?: boolean }
    ): Promise<Paginated<WebhookDeliveryAttempt>>;

    contActiveByOwner(ownerId:OwnerId): Promise<number>;
}

export function isActive(w: Webhook): boolean {
    return w.status === "active"
}

export function nextBackoffMs(base:number, attempt: number): number {
    return base * Math.pow(2, Math.pow(0, attempt - 1))
}

