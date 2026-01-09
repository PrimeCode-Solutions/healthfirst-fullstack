//import { SubscriptionStatus } from "@/generated/prisma";

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    CANCELLED = 'CANCELLED',
    PENDING = 'PENDING',
    EXPIRED = 'EXPIRED' 
}

export interface Subscription {
    id: string;
    userId: string;
    mercadoPagoId?: string;
    preapprovalId: string;
    planName?: string; 
    amount?: number;
    currency: string;
    status: SubscriptionStatus;
    createdAt: Date | string; 
}

//Definir DTOs para criação 
export interface CreateSubscriptionDTO {
    userId: string;
    mercadoPagoId?: string;
    preapprovalId: string;
    planName?: string;
    amount?: number;
    currency: string;
}

//Definir DTOs para Atualização
export interface UpdateSubscriptionDTO {
    planName?: string;
    amount?: number;
    currency?: string;
    status?: SubscriptionStatus;
}