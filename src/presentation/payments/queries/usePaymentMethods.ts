import { useQuery } from "@tanstack/react-query";
import type { Payment } from "@/modules/payments/domain/payment.interface"
import api from "@/lib/api";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      const { data } = await api.get("/payments/methods");
      return data as Payment[];
    }
  });
}