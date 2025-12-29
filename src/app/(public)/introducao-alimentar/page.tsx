"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransparentSubscriptionForm } from "@/presentation/subscriptions/create/TransparentSubscriptionForm";

export default function IntroducaoAlimentar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasAccess } = usePremiumAccess(session?.user?.id);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetch("/api/ebooks?category=Introdução Alimentar")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setEbooks(res.data);
      });
  }, []);

  const handleDownload = (ebook: any) => {
    if (ebook.isPremium && !hasAccess) {
      if (status === "unauthenticated") {
        toast.error("Faça login para assinar.");
        router.push("/login?callbackUrl=/introducao-alimentar");
        return;
      }
      setSelectedPlan({ title: "Premium Introdução Alimentar", price: 29.90 });
    } else {
      window.open(ebook.downloadUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-manrope">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="font-bold text-4xl sm:text-5xl text-[#0D1C14] mb-4">
            Introdução aos alimentos
          </h1>
          <p className="font-normal text-base sm:text-lg text-[#598c75] max-w-4xl mx-auto sm:mx-0">
            Explore nossos recursos sobre como introduzir alimentos sólidos na alimentação do seu bebê, desde guias básicos até planos alimentares detalhados.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#0D1C14] mb-8 text-center sm:text-left">
            E-books de Introdução Alimentar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {ebooks.length > 0 ? (
              ebooks.map((eb) => (
                <div key={eb.id} className="w-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-gray-100">
                  <div className="h-[250px] w-full relative">
                    <Image
                      src={eb.coverUrl || "/images/intro-alimento/pote-alimento.png"}
                      alt={eb.title}
                      fill
                      className="object-cover"
                    />
                    {eb.isPremium && (
                      <Badge className="absolute top-4 right-4 bg-emerald-600 py-1 px-3">Premium</Badge>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-[#0D1C14] text-xl mb-2">{eb.title}</h3>
                    <p className="text-[#598c75] text-sm mb-6 flex-1">{eb.description}</p>
                    <Button
                      onClick={() => handleDownload(eb)}
                      className={`w-full font-bold h-12 rounded-full transition-all ${
                        eb.isPremium && !hasAccess 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {eb.isPremium && !hasAccess ? "Assinar para Baixar" : "Baixar Agora"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic">Novos e-books sendo preparados.</p>
            )}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#0D1C14] mb-8 text-center sm:text-left">
            Outros Recursos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="w-full">
              <div className="h-[301px] w-full relative rounded-lg overflow-hidden">
                <Image src="/images/intro-alimento/guia-alergenos.png" alt="Alergenos" fill className="object-cover" />
              </div>
              <div className="mt-4">
                <h3 className="font-medium text-[#0D1C14] text-lg mb-2">Guia de introdução aos alérgenos</h3>
                <p className="text-[#598c75] text-sm">Aprenda como introduzir com segurança os principais alérgenos.</p>
              </div>
            </div>
            <div className="w-full">
              <div className="h-[301px] w-full relative rounded-lg overflow-hidden">
                <Image src="/images/intro-alimento/bebe-comendo.png" alt="Desmame" fill className="object-cover" />
              </div>
              <div className="mt-4">
                <h3 className="font-medium text-[#0D1C14] text-lg mb-2">Noções básicas sobre o desmame</h3>
                <p className="text-[#598c75] text-sm">Explore a abordagem de desmame conduzido pelo bebê.</p>
              </div>
            </div>
            <div className="w-full">
              <div className="h-[301px] w-full relative rounded-lg overflow-hidden">
                <Image src="/images/intro-alimento/pai-filho.png" alt="Suporte" fill className="object-cover" />
              </div>
              <div className="mt-4">
                <h3 className="font-medium text-[#0D1C14] text-lg mb-2">Suporte personalizado</h3>
                <p className="text-[#598c75] text-sm">Obtenha suporte de nossos especialistas.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/agendar-consulta">
            <Button size="lg" className="bg-primary text-white font-bold h-14 px-10 rounded-full hover:scale-105 transition-transform">
              Agende uma consulta
            </Button>
          </Link>
        </div>

        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Acesso Premium HealthFirst</DialogTitle>
            </DialogHeader>
            {selectedPlan && session?.user && (
              <div className="pt-4">
                <p className="mb-6 text-gray-600 font-manrope">
                  Assine o plano mensal para desbloquear todos os e-books e planos alimentares exclusivos.
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