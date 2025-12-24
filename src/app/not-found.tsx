import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl font-bold">
            Página não encontrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O endereço que você tentou acessar não existe ou foi movido.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href="/">
                Voltar ao Início
              </Link>
            </Button>
            
            <Button variant="ghost" asChild className="w-full">
              <Link href="/contato">
              Precisa de ajuda?
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}