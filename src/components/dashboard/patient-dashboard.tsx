"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, XCircle, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { FormattedAppointments } from "@/app/api/dashboard/stats/route";
import { 
  useCompleteAppointmentMutation, 
  useDeleteAppointmentMutation 
} from "@/presentation/appointments/mutations/useAppointmentMutations";
import { isAfter } from "date-fns";
import { cn } from "@/lib/utils";

export function PatientDashboard() {
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["patient-dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data;
    },
  });

  const completeMutation = useCompleteAppointmentMutation();
  const deleteMutation = useDeleteAppointmentMutation();

  const handleComplete = (id: string) => {
    completeMutation.mutate({ id, status: "COMPLETED" }, {
      onSuccess: () => refetch()
    });
  };

  const handleCancel = () => {
    if (cancelId) {
      deleteMutation.mutate(cancelId, {
        onSuccess: () => {
          setCancelId(null);
          refetch();
        }
      });
    }
  };

  const nextAppointment = data?.nextAppointment;
  const completedCount = data?.completedAppointmentsCount || 0;
  const cancelledCount = data?.cancelledAppointmentsCount || 0;
  const recentAppointments = data?.recentAppointments || [];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950">Meu Painel</h2>
        <p className="text-emerald-600/80 text-sm sm:text-base">Acompanhe seus agendamentos e histórico.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 uppercase tracking-wider">Próxima Consulta</CardTitle>
            <CalendarDays className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="text-xl sm:text-2xl font-bold text-emerald-950">
            {nextAppointment
              ? `${nextAppointment.formattedDate} às ${nextAppointment.rawStartTime}`
              : "Nenhuma"}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 uppercase tracking-wider">Consultas Realizadas</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="text-3xl font-bold text-emerald-950">{completedCount}</CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 uppercase tracking-wider">Cancelamentos</CardTitle>
            <XCircle className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent className="text-3xl font-bold text-emerald-950">{cancelledCount}</CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-emerald-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
          <CardTitle className="text-emerald-900 text-lg">Últimos Agendamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {recentAppointments.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground bg-slate-50/30">
              Nenhum agendamento registrado até o momento.
            </div>
          ) : (
            <Table className="w-full">
              <TableHeader className="bg-emerald-50/30">
                <TableRow>
                  <TableHead className="text-emerald-800 font-semibold py-4">Data</TableHead>
                  <TableHead className="text-emerald-800 font-semibold py-4">Horário</TableHead>
                  <TableHead className="text-emerald-800 font-semibold py-4">Status</TableHead>
                  <TableHead className="text-emerald-800 font-semibold py-4 text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.map((item: FormattedAppointments) => {
                  const hasPassed = (() => {
                    if (!item.rawDate || !item.rawStartTime) return false;
                    const baseDate = new Date(item.rawDate);
                    const [h, m] = item.rawStartTime.split(":").map(Number);
                    const appTime = new Date(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), h, m);
                    return isAfter(new Date(), appTime);
                  })();

                  const canConfirm = item.status === "CONFIRMED" && hasPassed;
                  const canCancel = (item.status === "CONFIRMED" || item.status === "PENDING") && !hasPassed;

                  return (
                    <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors border-emerald-50/50">
                      <TableCell className="font-medium py-4">{item.formattedDate}</TableCell>
                      <TableCell className="py-4">{item.formattedTime}</TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={cn(
                            "font-medium",
                            item.status === "COMPLETED" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
                            item.status === "CANCELLED" && "bg-red-50 text-red-600 hover:bg-red-50 border-red-100",
                            item.status === "CONFIRMED" && "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100",
                            item.status === "PENDING" && "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100"
                          )}
                          variant="outline"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4 space-x-2">
                        {canConfirm && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8"
                            onClick={() => handleComplete(item.id)}
                            disabled={completeMutation.isPending}
                          >
                            {completeMutation.isPending && completeMutation.variables?.id === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Confirmar Realização"
                            )}
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                            onClick={() => setCancelId(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 flex justify-center sm:justify-start">
        <Link href="/agendar-consulta" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 px-8 py-6 rounded-xl font-semibold transition-all hover:scale-[1.02]">
            Agendar Nova Consulta
          </Button>
        </Link>
      </div>

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancelar Agendamento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita e o horário ficará disponível para outros pacientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {deleteMutation.isPending ? "Cancelando..." : "Sim, Cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}