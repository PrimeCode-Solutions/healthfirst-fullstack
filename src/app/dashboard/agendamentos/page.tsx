"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ptBR } from "react-day-picker/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCreateAppointmentMutation as CreateAppointmentForm } from "@/presentation/appointments/create/useCreateAppointmentMutation";
import { EditAppointmentForm } from "@/presentation/appointments/update/EditAppointmentForm";
import { useAppointments } from "@/presentation/appointments/queries/useAppointmentQueries";
import { useDeleteAppointmentMutation, useCompleteAppointmentMutation } from "@/presentation/appointments/mutations/useAppointmentMutations";
import { startOfDay, endOfDay, format } from "date-fns";
import { Loader2, Clock, User, Trash2, Edit2, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppointmentStatus } from "@/modules/user/domain/user.interface";

function AppointmentItem({
  appointment,
  onEdit,
  onDelete,
  onComplete,
  currentUser
}: {
  appointment: any,
  onEdit: (apt: any) => void,
  onDelete: (id: string) => void,
  onComplete: (apt: any) => void;
  currentUser: any
}) {

  // Lógica de Permissão
  const isOwner = currentUser?.id === appointment.userId;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAssignedDoctor = appointment.doctorId === currentUser?.id;
  const canDelete = isOwner || isAdmin || isAssignedDoctor;
  const authorizedComplete = isAdmin || isAssignedDoctor;

  let canCompleted = false;
  const now = new Date();
  const appointmentDate = new Date(appointment.date);

  if (
    authorizedComplete &&
    (appointment.status === AppointmentStatus.CONFIRMED ||
    appointment.status === AppointmentStatus.COMPLETED) &&
    now >= appointmentDate
  ) {
    canCompleted = true;
  }

  const handleDeleteClick = () => {
    if (!canDelete) {
      toast.error("Você não tem permissão para excluir este agendamento.");
      return;
    }
    onDelete(appointment.id);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-2 bg-card hover:bg-accent/5 transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{appointment.startTime} - {appointment.endTime}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{appointment.patientName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : 'secondary'}>
           {appointment.status}
         </Badge>

         <Button variant="outline" size="icon" onClick={() => onEdit(appointment)}>
            <Edit2 className="h-4 w-4" />
         </Button>

         {/* Botão de Exclusão com Feedback */}
         <Button
            variant="destructive"
            size="icon"
            onClick={handleDeleteClick}
            className={!canDelete ? "opacity-50 cursor-not-allowed hover:bg-destructive" : ""}
            title={!canDelete ? "Permissão negada" : "Excluir agendamento"}
         >
            {canDelete ? <Trash2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
         </Button>

            {canCompleted && (
              appointment.status === AppointmentStatus.COMPLETED ? (
                <Button
                  variant="ghost"
                  disabled={true}
                  onClick={() => onComplete(appointment)}
                >
                  Concluído
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => onComplete(appointment)}
                >
                  Finalizar atendimento
                </Button>
              )
            )}

      </div>
    </div>
  );
}

export default function AgendamentosPage() {
  const { data: session } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completeAppointment, setCompletingAppointment] = useState<any | null>(null);

  const deleteMutation = useDeleteAppointmentMutation();
  const completeMutation = useCompleteAppointmentMutation();

  const filters = date ? {
    dateStart: startOfDay(date).toISOString(),
    dateEnd: endOfDay(date).toISOString(),
    pageSize: 100
  } : undefined;

  const { data: appointmentsData, isLoading } = useAppointments(filters);
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData as any)?.items || [];

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null)
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Agendamentos</h1>
        <p className="text-muted-foreground">Gerencie sua agenda diária.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
            </CardTitle>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Novo Agendamento</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Agendamento</DialogTitle>
                </DialogHeader>
                <CreateAppointmentForm />
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-2">
                {appointments.map((apt: any) => (
                  <AppointmentItem
                    key={apt.id}
                    appointment={apt}
                    currentUser={session?.user}
                    onEdit={(apt) => setEditingAppointment(apt)}
                    onDelete={(id) => setDeletingId(id)}
                    onComplete={(apt) =>
                      setCompletingAppointment({
                        id: apt.id,
                        status: AppointmentStatus.COMPLETED,
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Nenhum agendamento encontrado para este dia.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
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

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O agendamento será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
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
            <AlertDialogTitle>
              Você realmente deseja finalizar esse agendamento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              className="bg-primary text-destructive-foreground hover:bg-primary/90"
            >
              {completeMutation.isPending ? "Finalizando..." : "Finalizar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
