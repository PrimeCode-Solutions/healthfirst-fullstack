import Link from "next/link";
import { CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyId } from "@/components/copy-id";

interface SuccessPageProps {
  searchParams: Promise<{
    payment_id?: string;
    collection_id?: string;
    status?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const paymentId = params.payment_id || params.collection_id;

  return (
    <div className="container min-h-[70vh] flex items-center justify-center py-10">
      <Card className="w-full max-w-lg border-green-100 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Pagamento Confirmado!
          </CardTitle>
          <p className="text-gray-500">
            A sua transação foi processada com sucesso.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">
              ID da Transação
            </p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-mono font-medium text-gray-700 break-all">
                {paymentId || "Pendente de sincronização"}
              </p>
              {paymentId && <CopyId id={paymentId} />}
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
              <Link href="/dashboard">
                Acessar meu Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full py-6 text-lg border-gray-200 hover:bg-gray-50">
              <Link href="/contato" className="flex items-center justify-center">
                <MessageCircle className="mr-2 w-5 h-5 text-blue-500" />
                Precisa de ajuda? Fale conosco
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-gray-400">
            Um e-mail de confirmação foi enviado com os detalhes do seu pedido.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}