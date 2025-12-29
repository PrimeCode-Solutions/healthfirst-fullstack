"use client";

import React, { useEffect, useState, useRef } from "react";
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export function TransparentSubscriptionForm({ userId, userEmail, planName, amount }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const brickControllerRef = useRef<any>(null);
  const containerId = useRef(`payment-brick-container-${Math.floor(Math.random() * 10000)}`);

  useEffect(() => {
    let isMounted = true;

    const initMP = async () => {
      await new Promise(r => setTimeout(r, 400));
      if (!isMounted) return;

      await loadMercadoPago();
      const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
      if (!mpPublicKey) return;

      const safeEmail = userEmail;

      const mp = new (window as any).MercadoPago(mpPublicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();

      try {
        if (brickControllerRef.current) await brickControllerRef.current.unmount();
        
        const controller = await bricksBuilder.create("cardPayment", containerId.current, {
          initialization: {
            amount: Number(amount),
            payer: { email: safeEmail },
          },
          customization: {
            paymentMethods: { creditCard: "all", maxInstallments: 1 },
          },
          callbacks: {
            onReady: () => console.log("Formulário carregado"),
            onSubmit: async (cardFormData: any) => {
              if (!isMounted) return;
              setLoading(true);
              try {
                const res = await api.post("/subscriptions/checkout", {
                  token: cardFormData.token,
                  payer: { email: cardFormData.payer.email || safeEmail },
                  planName,
                  price: amount,
                  userId
                });
                

                if (res.data.status === "authorized") {
                  toast.success("Assinatura confirmada!");
                  router.push(`/success?payment_id=${res.data.id}`);
                } else {
                  toast.error("Cartão recusado.");
                  setLoading(false);
                }

              } catch (err: any) {
                const msg = err.response?.data?.details || "Verifique os dados do cartão.";
                toast.error(`Erro: ${msg}`);
                setLoading(false);
              }
            },
            onError: (err: any) => console.error("Erro no Brick:", err),
          },
        });
        
        if (isMounted) brickControllerRef.current = controller;
      } catch (e) { console.error(e); }
    };

    initMP();

    return () => {
      isMounted = false;
      if (brickControllerRef.current) {
        const controller = brickControllerRef.current;
        brickControllerRef.current = null;
        try { controller.unmount(); } catch (e) {}
      }
    };
  }, [amount, userEmail, planName, userId, router]);

  return (
    <Card className="w-full max-w-lg mx-auto border-0 shadow-none relative">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
           <Lock className="w-5 h-5 text-green-600" /> Pagamento Seguro
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            Plano: <strong>{planName}</strong> <br/>
            Valor: <strong>R$ {amount?.toFixed(2)}</strong>/mês
        </div>
        <div id={containerId.current}></div>
        {loading && (
          <div className="flex flex-col items-center justify-center absolute inset-0 z-50 bg-white/95">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
            <span className="font-medium text-gray-700">Validando Assinatura...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}