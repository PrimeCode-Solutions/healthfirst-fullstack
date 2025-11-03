import { CreateAppointmentDTO, UpdateAppointmentStatusDTO } from "../domain/appointment.interface"
import { AppointmentRepository } from "../infrastructure/appointmentRepository"

const repository = new AppointmentRepository()

export function createAppointment(data: CreateAppointmentDTO) {
    repository.create(data)
}

export function updateAppointmentStatus(data: UpdateAppointmentStatusDTO) {
    repository.update(data)
}

export function cancelAppointment(id: string) {
    repository.delete(id)
}




