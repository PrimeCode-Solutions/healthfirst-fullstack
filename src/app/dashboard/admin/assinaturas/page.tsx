"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminSubscriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions-list"],
    queryFn: async () => {
      const res = await api.get("/admin/subscriptions");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Assinantes</h1>
        <p className="text-muted-foreground">
          Monitore o status financeiro e planos dos usuários.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinaturas Ativas e Histórico
          </CardTitle>
          <CardDescription>
            Total de {data?.length || 0} assinaturas registradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((sub: any) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sub.user.name}</span>
                      <span className="text-xs text-muted-foreground">{sub.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{sub.planName}</TableCell>
                  <TableCell>R$ {Number(sub.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    {format(new Date(sub.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={sub.status === "ACTIVE" ? "default" : "destructive"}
                      className={sub.status === "ACTIVE" ? "bg-green-500" : ""}
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}