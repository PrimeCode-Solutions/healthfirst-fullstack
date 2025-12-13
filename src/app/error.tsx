"use client";

import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-destructive/20 text-center shadow-lg">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl font-bold text-destructive">
            Algo deu errado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Encontramos um erro inesperado ao processar sua solicitação. Tente
            novamente ou contate o suporte.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => reset()}
              className="w-full bg-destructive text-white hover:bg-destructive/90"
            >
              Tentar Novamente
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Ir para o Início</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/contato">Suporte</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}