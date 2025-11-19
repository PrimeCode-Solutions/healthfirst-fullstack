export {
  useCreateAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useCancelAppointmentMutation,
} from "./mutations/useAppointmentMutations";

export {
  findAllAppointmentsQuery,
  findAppointmentByIdQuery,
  findAppointmentsByUserQuery,
} from "./queries/useAppointmentQueries";
