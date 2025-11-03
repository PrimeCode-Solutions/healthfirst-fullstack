import { AppointmentRepository } from "../infrastructure/appointmentRepository"

const repository = new AppointmentRepository()

export function getAppointments() {
    repository.findAll();
}

export function getAppointmentById(id: string) {
    repository.findById(id);
}

export function getUserAppointments(userId: string) {
    repository.findByUser(userId);
}




