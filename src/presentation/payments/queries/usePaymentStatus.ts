import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function usePaymentStatus(paymentId: string) {
    return useQuery({
        queryKey: ["paymentStatus", paymentId],
        queryFn: async () => {
            const { data } = await api.get(`/payments/${paymentId}/status`);
            return data;
        },

        enabled: !!paymentId,
    });
}