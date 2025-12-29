"use client";

import { useSession } from "next-auth/react";
import { useGeUsertSubscription } from "@/presentation/subscriptions/queries/useSubscriptionQueries";
import { useSubscriptionManage } from "@/presentation/subscriptions/hooks/useSubscriptionManage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";

export default function MySubscriptionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: subscription, isLoading } = useGeUsertSubscription(session?.user?.id || "");
  const { cancelSubscription } = useSubscriptionManage();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card className="max-w-md mx-auto mt-10 text-center">
        <CardHeader>
          <CardTitle>Nenhuma assinatura ativa</CardTitle>
          <CardDescription>Você ainda não possui um plano premium.</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/dashboard/assinatura")}>
            Ver Planos Disponíveis
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <h1 className="text-3xl font-bold">Minha Assinatura</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{subscription.planName}</CardTitle>
                <CardDescription>Gerencie seu acesso premium à plataforma.</CardDescription>
              </div>
              <Badge 
                variant={subscription.status === "ACTIVE" ? "default" : "secondary"}
                className={subscription.status === "ACTIVE" ? "bg-green-500 h-6" : "h-6"}
              >
                {subscription.status === "ACTIVE" ? (
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Ativa</span>
                ) : (
                  <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> {subscription.status}</span>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Mensal</p>
                <p className="text-lg font-bold">R$ {Number(subscription.amount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Início da Assinatura</p>
                <p className="text-lg">
                  {format(new Date(subscription.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
          {subscription.status === "ACTIVE" && (
            <CardFooter className="border-t pt-6">
              <div className="flex flex-col space-y-4 w-full">
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-100">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Ao cancelar, seu acesso premium será mantido apenas até o fim do período atual.</span>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-fit"
                  onClick={() => {
                    if(confirm("Tem certeza que deseja cancelar sua assinatura?")) {
                      cancelSubscription.mutate();
                    }
                  }}
                  disabled={cancelSubscription.isPending}
                >
                  {cancelSubscription.isPending ? "Cancelando..." : "Cancelar Assinatura"}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Benefícios Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Acesso a todos os e-books
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Consultas exclusivas
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Suporte prioritário
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}