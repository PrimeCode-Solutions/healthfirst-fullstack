import { useQuery } from "@tanstack/react-query";
import { createPaymentRepository } from "@/modules/payments/infrastrutucture/paymentRepository";

const paymentRepository = createPaymentRepository();

export function usePaymentTransactions(paymentId: string) {
    return useQuery({
        queryKey: ["paymentTransations", paymentId],
        queryFn: async () => {
            return paymentRepository.findByAppointmentId(paymentId);

        },
            
        enabled: !!paymentId,

    });
}