import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default async function FailurePage({
  searchParams,
}: {
  searchParams: Promise<{
    collection_id?: string;
    collection_status?: string;
    payment_id?: string;
  }>;
}) {
  const params = await searchParams;
  const paymentId = params.payment_id ?? "indefinido";

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <Card className="m-6 p-6 text-center">
        <CardHeader className="flex flex-col items-center">
          <XCircle className="mb-2 h-16 w-16 text-red-500" />
          <CardTitle>Houve um problema com seu pagamento</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <Alert variant="destructive" className="text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pagamento não processado</AlertTitle>
            <AlertDescription>
              O sistema encontrou uma falha. Nenhuma cobrança foi efetuada.
            </AlertDescription>
          </Alert>

          <p className="mt-5 text-sm text-gray-500">
            ID do pagamento: <strong className="bg-muted">{paymentId}</strong>
          </p>

          <Link href="/agendar-consulta">
            <Button
              variant="default"
              className="mt-4 w-full bg-black hover:cursor-pointer"
            >
              Tentar Novamente
            </Button>
          </Link>

          <Link href="/contato">
            <Button
              variant="outline"
              className="mt-4 w-full hover:cursor-pointer"
            >
              Falar com o Suporte
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
