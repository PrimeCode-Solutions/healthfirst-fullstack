"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransparentSubscriptionForm } from "@/presentation/subscriptions/create/TransparentSubscriptionForm";

export default function GeneralConsultation() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasAccess } = usePremiumAccess(session?.user?.id);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetch("/api/ebooks?category=Geral")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setEbooks(res.data);
      });
  }, []);

  const handleDownload = (ebook: any) => {
    if (ebook.isPremium && !hasAccess) {
      if (status === "unauthenticated") {
        toast.error("Faça login para assinar e acessar o conteúdo.");
        router.push("/login?callbackUrl=/consulta-geral");
        return;
      }
      setSelectedPlan({ title: "Assinatura Premium HealthFirst", price: 29.90 });
    } else {
      window.open(ebook.downloadUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fcfa] p-4">
      <div className="mx-auto max-w-[930px]">
        <h1 className="pb-4 text-3xl font-bold">
          Serviços de consultoria geral
        </h1>
        <p className="text-md text-[#4F9678] md:text-sm">
          A HealthWise oferece consultas gerais abrangentes para tratar de uma
          ampla gama de questões de saúde. Nossa experiente equipe de
          profissionais de saúde oferece atendimento personalizado e orientação
          para ajudá-lo a alcançar o bem-estar ideal. Se você precisa de um
          check-up de rotina, tem dúvidas específicas sobre saúde ou precisa de
          apoio contínuo, estamos aqui para ajudá-lo em cada etapa do processo.
        </p>

        <h2 className="pt-9 pb-5 text-xl font-bold md:pt-8 md:pb-7 md:text-2xl md:font-semibold">
          Biblioteca de E-books (Grátis e Premium)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {ebooks.length > 0 ? (
            ebooks.map((eb) => (
              <div key={eb.id} className="w-full">
                <div className="relative h-[200px] w-full overflow-hidden rounded-lg shadow-sm">
                  <Image
                    className="object-cover"
                    src={eb.coverUrl || "/images/consulta-geral/example-1.png"}
                    alt={eb.title}
                    fill
                  />
                  {eb.isPremium && (
                    <Badge className="absolute top-2 right-2 bg-emerald-600">Premium</Badge>
                  )}
                </div>
                <h3 className="pt-3 pb-1 text-lg font-bold line-clamp-1">{eb.title}</h3>
                <p className="text-sm text-[#4F9678] mb-3 line-clamp-2">{eb.description}</p>
                <Button 
                  className={`w-full font-bold transition-all ${
                    eb.isPremium && !hasAccess 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                  }`}
                  onClick={() => handleDownload(eb)}
                >
                  {eb.isPremium && !hasAccess ? "Assinar para Baixar" : "Baixar Agora"}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic col-span-3">Nenhum e-book disponível nesta categoria.</p>
          )}
        </div>

        <h2 className="pt-6 pb-5 text-xl font-bold md:pt-0 md:pb-7 md:text-2xl md:font-semibold">
          Recursos Educativos
        </h2>
        <div className="flex flex-col justify-between md:flex-row mb-12">
          <div className="w-full md:w-[301px]">
            <Image className="w-full rounded-lg" src="/images/consulta-geral/example-1.png" alt="ex1" width={301} height={301} />
            <h3 className="pt-3 pb-1 text-xl md:text-lg">Compreendendo problemas comuns</h3>
            <p className="text-md pb-12 text-[#4F9678] md:text-sm">Saiba mais sobre as doenças mais comuns e seus sintomas.</p>
          </div>
          <div className="w-full md:w-[301px]">
            <Image className="w-full rounded-lg" src="/images/consulta-geral/example-2.png" alt="ex2" width={301} height={301} />
            <h3 className="pt-3 pb-1 text-xl md:text-lg">Dicas de bem-estar</h3>
            <p className="text-md pb-12 text-[#4F9678] md:text-sm">Incorpore práticas simples à sua rotina diária.</p>
          </div>
          <div className="w-full md:w-[301px]">
            <Image className="w-full rounded-lg" src="/images/consulta-geral/example-3.png" alt="ex3" width={301} height={301} />
            <h3 className="pt-3 pb-1 text-xl md:text-lg">Navegando pelas opções</h3>
            <p className="text-md pb-12 text-[#4F9678] md:text-sm">Obtenha informações sobre diferentes serviços de saúde.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            className="h-10 w-45 bg-[var(--primary)] font-bold text-black border-none"
            onClick={() => router.push("/agendar-consulta")}
          >
            Agende uma consulta
          </Button>
        </div>

        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Acesso Premium HealthFirst</DialogTitle>
            </DialogHeader>
            {selectedPlan && session?.user && (
              <div className="pt-4">
                <p className="mb-6 text-gray-600 italic">
                  Assine agora para desbloquear todo o conteúdo exclusivo da nossa plataforma.
                </p>
                <TransparentSubscriptionForm 
                  userId={session.user.id} 
                  userEmail={session.user.email!} 
                  planName={selectedPlan.title} 
                  amount={selectedPlan.price} 
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}