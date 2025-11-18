import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { appointmentService } from "../services/appointmentsServices";
import {
  CreateAppointmentDTO,
  UpdateAppointmentStatusDTO,
} from "@/modules/appointments/domain/appointment.interface";

export const useCreateAppointmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentDTO) =>
      appointmentService.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar agendamento!");
    },
  });
};

export const useUpdateAppointmentStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAppointmentStatusDTO) =>
      appointmentService.updateAppointmentStatus(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({
        queryKey: ["appointments", variables.id],
      });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar status do agendamento!");
    },
  });
};

export const useCancelAppointmentMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento cancelado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar agendamento!");
    },
  });
}
