// AQUI BASICAMENTE VAMO SUBSTITUIR A CHAMADA DO PRISMA PELO app/api COM AXIOS
import axios from 'axios'
import type { Appointment, CreateAppointmentDTO, UpdateAppointmentStatusDTO } from "../domain/appointment.interface";
import type { AppointmentRepositoryDomain } from "../domain/appointments.repository";


export class AppointmentRepository implements AppointmentRepositoryDomain {
    async findAll(): Promise<Appointment> {
        const response = await axios.get('/api/appointments')
        return response.data
    }

    async findById(id: string): Promise<Appointment> {
        const response = await axios.get(`/api/appointments/${id}`);
        return response.data
    }

    async findByUser(userId: string): Promise<Appointment> {
        const response = await axios.get(`/api/appointments/user/${userId}`);
        return response.data
    }

    async create(data: CreateAppointmentDTO): Promise<Appointment> {
        const response = await axios.post(`/api/appointments`, data)
        return response.data
    }

    async update(data: UpdateAppointmentStatusDTO): Promise<Appointment> {
        const { id, status } = data
        const response = await axios.put(`/api/appointments/${id}`, status)
        return response.data
    }

    async delete(id: string): Promise<Appointment> {
        const response = await axios.delete(`/api/appointments/${id}`);
        return response.data
    }
}
