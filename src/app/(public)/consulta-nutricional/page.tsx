"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

const conteudoGratuito = [
  {
    img: "/imagens/pagina_nutricional/mini1.webp",
    title: "O poder de uma dieta equilibrada",
  },
  {
    img: "/imagens/pagina_nutricional/mini2.webp",
    title: "Receitas para uma alimentação saudável",
  },
  {
    img: "/imagens/pagina_nutricional/mini3.webp",
    title: "Dicas para um estilo de vida mais saudável",
  },
];

const conteudoPremium = [
  {
    badge: "Exclusivo",
    title: "Planos alimentares personalizados",
    desc: "Desbloqueie o acesso a planos alimentares personalizados, adaptados às suas necessidades específicas e objetivos de saúde.",
    img: "/imagens/pagina_nutricional/premium1.webp",
    price: 29.90,
  },
  {
    badge: "Premium",
    title: "Guias nutricionais",
    desc: "Acesse guias completos sobre diversos temas de nutrição, desde controle de doenças até fortalecimento da imunidade.",
    img: "/imagens/pagina_nutricional/premium2.webp",
    price: 19.90,
  },
];

export default function ConsultaNutricionalPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loadingTitle, setLoadingTitle] = useState<string | null>(null);

  const handleSubscribe = async (title: string, price: number) => {
    if (status === "unauthenticated") {
      toast.error("Faça login para continuar.");
      router.push("/login?callbackUrl=/consulta-nutricional");
      return;
    }

    setLoadingTitle(title);

    try {
      const { data } = await api.post("/subscriptions/checkout", {
        title: title,
        price: price,
        reason: `Assinatura: ${title}`
      });

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        toast.error("Erro ao gerar link.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar assinatura.");
    } finally {
      setLoadingTitle(null);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50">
      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center px-6 py-8">
        {/* Hero */}
        <section className="w-full">
          <Image
            src="/imagens/pagina_nutricional/foto1.webp"
            alt="Consulta Nutricional"
            width={928}
            height={180}
            className="max-h-[180px] w-full rounded-lg object-cover"
            priority
          />
          <p className="mt-8 text-[18px] leading-relaxed text-gray-700">
            Na HealthFirst, acreditamos que a nutrição é a base da saúde geral. Nossos
            serviços de consultoria nutricional são projetados para ajudá-lo a
            atingir seus objetivos.
          </p>
        </section>

        {/* Conteúdo gratuito */}
        <section className="mt-10 w-full">
          <h2 className="mb-5 text-[25px] font-semibold text-[#0D1C14]">
            Conteúdo gratuito
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {conteudoGratuito.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-gray-300 bg-white p-3 transition-shadow duration-300 hover:shadow-md"
              >
                <Image
                  src={item.img}
                  alt={item.title}
                  width={48}
                  height={38}
                  className="rounded object-cover"
                />
                <span className="text-[16px] font-semibold text-[#0D1C14]">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Conteúdo Premium */}
        <section className="mt-12 w-full">
          <h2 className="mb-6 text-[25px] font-semibold text-[#0D1C14]">
            Conteúdo Premium
          </h2>
          <div className="space-y-5">
            {conteudoPremium.map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-between gap-6 rounded-md border border-gray-300 bg-gray-50 p-4 md:flex-row"
              >
                <div className="flex-1 space-y-2">
                  <span className="px- inline-block rounded py-1 text-[18px] text-[#4F9678]">
                    {item.badge}
                  </span>
                  <h3 className="text-[19px] font-semibold text-[#0D1C14]">
                    {item.title}
                  </h3>
                  <p className="text-[17px] leading-relaxed text-[#4F9678]">
                    {item.desc}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleSubscribe(item.title, item.price)}
                    disabled={loadingTitle === item.title}
                    className="mt-2 h-9 border border-[#E8F2ED] px-4 text-[14px] font-semibold text-gray-800"
                  >
                    {loadingTitle === item.title ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Inscreva-se agora"
                    )}
                  </Button>
                </div>
                <div className="flex-shrink-0">
                  <Image
                    src={item.img}
                    alt={item.title}
                    width={309}
                    height={165}
                    className="rounded-[10px] object-cover opacity-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Botão de agendamento */}
        <section className="mt-12 flex w-full justify-center">
          <Button size="lg" onClick={() => router.push("/agendar-consulta")}>
            Agende uma consulta
          </Button>
        </section>
      </main>
    </div>
  );
}