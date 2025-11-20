import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState } from "react";

type UpdatePaymentInput = {
    id: string;
    amount: number;
    method: string;
};

export function useUpdatePaymentMutation() {
    const [isLoading, setIsLoading] = useState(false);
        async function mutate(payload: UpdatePaymentInput) {
            setIsLoading(true);
            try {
              const response = await fetch("/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              
              return await response.json();

            }catch (error) {
                throw new Error(Error.arguments);
            } finally {
                setIsLoading(false);
            }
            
        }

        return { mutate, isLoading };
        
}