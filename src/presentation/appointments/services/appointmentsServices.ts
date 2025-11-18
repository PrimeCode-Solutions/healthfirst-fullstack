import api from "@/lib/api";
import {
  Appointment,
  CreateAppointmentDTO,
  UpdateAppointmentStatusDTO,
} from "@/modules/appointments/domain/appointment.interface";

async function createAppointment(
  data: CreateAppointmentDTO,
): Promise<Appointment> {
  const response = await api.post(`/appointments`, data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao criar agendamento!");
  }
  return response.data.data;
}

async function findAllAppointments(): Promise<Appointment[]> {
  const response = await api.get("/appointments");

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao obter todos agendamentos!");
  }
  return response.data.data;
}

async function findAppointmentById(id: string): Promise<Appointment> {
  const response = await api.get(`/appointments/${id}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.error || "Erro ao obter agendamentos por id!",
    );
  }
  return response.data.data;
}

async function findAppointmentsByUser(userId: string): Promise<Appointment[]> {
  const response = await api.get(`/appointments/user/${userId}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(
      response.data.error || "Erro ao obter agendamentos por usuário!",
    );
  }
  return response.data.data;
}

async function updateAppointmentStatus(
  data: UpdateAppointmentStatusDTO,
): Promise<Appointment> {
  const { id, status } = data;
  const response = await api.put(`/appointments/${id}`, { status });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao atualizar agendamento!");
  }
  return response.data.data;
}

async function deleteAppointment(id: string): Promise<Appointment> {
  const response = await api.delete(`/appointments/${id}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "Erro ao deletar agendamento!");
  }
  return response.data.data;
}

export const appointmentService = {
    createAppointment,
    findAllAppointments,
    findAppointmentById,
    findAppointmentsByUser,
    updateAppointmentStatus,
    deleteAppointment,
};
