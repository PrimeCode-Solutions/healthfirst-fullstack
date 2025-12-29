"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransparentSubscriptionForm } from "@/presentation/subscriptions/create/TransparentSubscriptionForm";

export default function ConsultaNutricionalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasAccess } = usePremiumAccess(session?.user?.id);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetch("/api/ebooks?category=Nutrição")
      .then(res => res.json())
      .then(res => {
        if (res.success) setEbooks(res.data);
      });
  }, []);

  const handleDownload = (ebook: any) => {
    if (ebook.isPremium && !hasAccess) {
      if (status === "unauthenticated") {
        toast.error("Faça login para assinar e acessar o conteúdo.");
        router.push("/login?callbackUrl=/consulta-nutricional");
        return;
      }
      setSelectedPlan({ 
        title: "Assinatura Premium HealthFirst", 
        price: 29.90 
      });
    } else {
      window.open(ebook.downloadUrl, "_blank");
    }
  };

  const gratuitos = ebooks.filter(e => !e.isPremium);
  const premium = ebooks.filter(e => e.isPremium);

  return (
    <div className="flex flex-col bg-gray-50">
      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center px-6 py-8">
        <section className="w-full">
          <div className="relative h-[200px] w-full overflow-hidden rounded-xl shadow-lg">
            <Image
              src="/imagens/pagina_nutricional/foto1.webp"
              alt="Consulta Nutricional"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <p className="mt-8 text-lg leading-relaxed text-gray-700">
            Na HealthFirst, acreditamos que a nutrição é a base da saúde geral. Nossos
            serviços são projetados para ajudá-lo a atingir seus objetivos com embasamento científico e suporte contínuo.
          </p>
        </section>

        <section className="mt-12 w-full">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0D1C14]">Materiais Educativos Gratuitos</h2>
            <Badge variant="outline" className="text-green-600 border-green-200">Acesso Livre</Badge>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {gratuitos.length > 0 ? (
              gratuitos.map((ebook) => (
                <Card key={ebook.id} className="overflow-hidden transition-all hover:shadow-md border-gray-200">
                  <div className="relative h-44 bg-gray-100">
                    <Image 
                      src={ebook.coverUrl || "/imagens/pagina_nutricional/mini1.webp"} 
                      alt={ebook.title} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-1">{ebook.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{ebook.description}</p>
                    <Button 
                      variant="ghost" 
                      className="mt-4 w-full text-green-600 hover:text-green-700 hover:bg-green-50 p-0 h-auto font-semibold"
                      onClick={() => handleDownload(ebook)}
                    >
                      Baixar Agora Gratuitamente →
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-3 text-center text-gray-500 py-8 italic">Novos materiais gratuitos em breve.</p>
            )}
          </div>
        </section>

        <section className="mt-16 w-full">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[#0D1C14]">Guias Premium e Planos Exclusivos</h2>
            <p className="text-gray-600">Conteúdo aprofundado para quem busca resultados de alta performance.</p>
          </div>

          <div className="space-y-6">
            {premium.length > 0 ? (
              premium.map((ebook) => (
                <div
                  key={ebook.id}
                  className="group flex flex-col items-center justify-between gap-6 rounded-2xl border border-gray-200 bg-white p-6 md:flex-row transition-all hover:border-emerald-200 hover:shadow-lg"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        Premium
                      </span>
                      {hasAccess && <Badge className="bg-blue-500 text-white">Acesso Ativo</Badge>}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{ebook.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{ebook.description}</p>
                    
                    <Button
                      onClick={() => handleDownload(ebook)}
                      className={`mt-4 px-8 h-12 rounded-full font-bold transition-all shadow-sm ${
                        hasAccess 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {hasAccess ? (
                        "Baixar Conteúdo Premium"
                      ) : (
                        "Assinar Plano Premium - R$ 29,90/mês"
                      )}
                    </Button>
                  </div>
                  <div className="relative h-[180px] w-full md:w-[320px] flex-shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={ebook.coverUrl || "/imagens/pagina_nutricional/premium1.webp"}
                      alt={ebook.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-12 border-2 border-dashed rounded-xl">
                Nossos guias premium estão sendo atualizados por nossos nutricionistas.
              </p>
            )}
          </div>
        </section>

        <section className="mt-20 flex w-full flex-col items-center rounded-3xl bg-emerald-900 py-12 px-6 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold">Deseja um plano personalizado para você?</h2>
          <p className="mt-4 max-w-lg text-emerald-100">
            Agende uma consulta com nossos especialistas e receba um acompanhamento direto e individualizado.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="mt-8 h-14 px-10 text-lg font-bold hover:scale-105 transition-transform bg-white text-emerald-900 hover:bg-emerald-50"
            onClick={() => router.push("/agendar-consulta")}
          >
            Agendar Consulta Agora
          </Button>
        </section>

        <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Finalizar Assinatura Premium</DialogTitle>
                </DialogHeader>
                
                {selectedPlan && session?.user && (
                    <div className="pt-4">
                        <div className="mb-6 rounded-lg bg-emerald-50 p-4 border border-emerald-100">
                          <p className="text-sm text-emerald-600 uppercase font-bold">E-book Selecionado:</p>
                          <p className="text-lg font-bold text-gray-900">{selectedPlan.title}</p>
                        </div>
                        <TransparentSubscriptionForm 
                            userId={session.user.id}
                            userEmail={session.user.email || ""}
                            planName={selectedPlan.title}
                            amount={selectedPlan.price}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}