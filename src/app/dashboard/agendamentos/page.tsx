"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ptBR } from "react-day-picker/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCreateAppointmentMutation as CreateAppointmentForm } from "@/presentation/appointments/create/useCreateAppointmentMutation";
import { EditAppointmentForm } from "@/presentation/appointments/update/EditAppointmentForm";
import { useAppointments } from "@/presentation/appointments/queries/useAppointmentQueries";
import { useDeleteAppointmentMutation, useCompleteAppointmentMutation } from "@/presentation/appointments/mutations/useAppointmentMutations";
import AppointmentCard from "@/components/appointment-card";
import { 
  startOfDay, 
  endOfDay, 
  format } from "date-fns";
import { 
  CalendarDays, 
  Loader2, 
  Plus } from "lucide-react";

export default function AgendamentosPage() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completeAppointment, setCompletingAppointment] = useState<any | null>(null);

  const deleteMutation = useDeleteAppointmentMutation();
  const completeMutation = useCompleteAppointmentMutation();

  const filters = date
    ? {
        dateStart: startOfDay(date).toISOString(),
        dateEnd: endOfDay(date).toISOString(),
        pageSize: 100,
      }
    : undefined;

  const { data: appointmentsData, isLoading } = useAppointments(filters);
  const appointments = Array.isArray(appointmentsData)
    ? appointmentsData
    : (appointmentsData as any)?.items || [];

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  const handleComplete = () => {
    if (completeAppointment) {
      completeMutation.mutate(completeAppointment, {
        onSuccess: () => setCompletingAppointment(null),
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 p-2">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Gestão de Agendamentos</h1>
          <p className="text-emerald-600/80">Gerencie sua agenda e pacientes do dia.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200">
              <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Criar Novo Agendamento</DialogTitle>
            </DialogHeader>
            <CreateAppointmentForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Coluna do Calendário */}
        <div className="space-y-6">
            <Card className="border-emerald-100 shadow-lg shadow-emerald-50 overflow-hidden">
            <div className="bg-emerald-50/50 p-4 border-b border-emerald-100">
                <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Calendário
                </h3>
            </div>
            <CardContent className="p-4 flex justify-center">
                <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="p-0"
                classNames={{
                    head_cell: "text-emerald-600/70 font-medium text-[0.8rem] uppercase w-10",
                    cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-emerald-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-emerald-100 hover:text-emerald-900 rounded-full transition-colors",
                    day_selected: "!bg-emerald-600 !text-white hover:bg-emerald-700 hover:text-white shadow-md shadow-emerald-200",
                    day_today: "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200",
                    caption_label: "text-emerald-900 font-bold text-sm"
                }}
                />
            </CardContent>
            </Card>
        </div>

        {/* Coluna da Lista */}
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-6">
             <div className="flex items-center gap-3">
                <div className="h-10 w-1 bg-emerald-500 rounded-full"></div>
                <div>
                    <CardTitle className="text-xl text-emerald-950">
                    {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {appointments.length} agendamento{appointments.length !== 1 && 's'} listados
                    </p>
                </div>
             </div>
          </CardHeader>

          <CardContent className="px-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-emerald-600">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p>Carregando agenda...</p>
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((apt: any) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    currentUser={session?.user}
                    onEdit={(apt) => setEditingAppointment(apt)}
                    onDelete={(id) => setDeletingId(id)}
                    onComplete={(apt) =>
                      setCompletingAppointment({
                        id: apt.id,
                        status: "COMPLETED",
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-emerald-100 rounded-xl bg-emerald-50/30">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CalendarDays className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-900">Agenda Livre</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  Nenhum agendamento encontrado para este dia. Aproveite para organizar outras tarefas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modais (Mantidos iguais na lógica, apenas o conteúdo visual interno se adapta se os forms usarem componentes padrão) */}
      <Dialog
        open={!!editingAppointment}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <EditAppointmentForm
              appointment={editingAppointment}
              onSuccess={() => setEditingAppointment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação cancelará a consulta permanentemente. O horário ficará disponível novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!completeAppointment}
        onOpenChange={(open) => !open && setCompletingAppointment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-900">
              Finalizar Atendimento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Marcar esta consulta como concluída? Isso atualizará o histórico do paciente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {completeMutation.isPending ? "Finalizando..." : "Concluir Consulta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}