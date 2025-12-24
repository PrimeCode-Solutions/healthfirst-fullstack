import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
    Mail, 
    MapPin, 
    MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const whatsappNumber = "5582999532934";
  const message = encodeURIComponent(
    "Olá, gostaria de falar com o suporte da HealthFirst."
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-primary">Fale Conosco</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha a melhor forma de entrar em contato com nossa equipe.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
        <Card className="border-primary/10 shadow-md">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Suporte via WhatsApp</CardTitle>
            <CardDescription>
              Nosso canal de atendimento prioritário. Ideal para dúvidas sobre agendamentos,
              dúvidas rápidas e suporte técnico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-green-600 font-semibold text-white hover:bg-green-700"
              size="lg"
            >
              <Link href={whatsappLink} target="_blank">
                Conversar no WhatsApp
              </Link>
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Disponível em horário comercial
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted shadow-sm">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Outras Informações</CardTitle>
            <CardDescription>
              Dados para contato institucional e localização.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
              <Mail className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                  E-mail
                </span>
                <span className="text-sm">contato@healthfirst.com.br</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                  Localização
                </span>
                <span className="text-sm">Arapiraca - Alagoas, Brasil</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}