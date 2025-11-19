import { appointmentService } from '../services/appointmentsServices';
import { useQuery } from '@tanstack/react-query';

export const findAllAppointmentsQuery = () => {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentService.findAllAppointments(),
  });
}

export const findAppointmentByIdQuery = (id: string) => {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentService.findAppointmentById(id),
    enabled: !!id,
  });
}

export const findAppointmentsByUserQuery = (userId: string) => {
  return useQuery({
    queryKey: ['appointments', 'user', userId],
    queryFn: () => appointmentService.findAppointmentsByUser(userId),
    enabled: !!userId,
  });
}




