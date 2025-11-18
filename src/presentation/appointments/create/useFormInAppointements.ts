import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAppointmentMutation } from "../mutations/useAppointmentMutations";

export const ConsultationTypeSchema = z.enum(["GENERAL", "URGENT", "FOLLOWUP"]);

const CreateAppointmentSchema = z.object({
  userId: z.string(),
  date: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  type: ConsultationTypeSchema,
  patientName: z.string(),
  patientEmail: z.email().optional(),
  patientPhone: z.string().optional(),
  notes: z.string().optional(),
});

type CreateAppointmentType = z.infer<typeof CreateAppointmentSchema>;

export function CreateAppointmentForm() {
  const form = useForm<CreateAppointmentType>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues: {
      userId: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      type: "GENERAL",
      patientName: "",
      patientEmail: "",
      patientPhone: "",
      notes: "",
    },
  });

  const createAppointment = useCreateAppointmentMutation();

  const onSubmit = form.handleSubmit((data: CreateAppointmentType) => {
    createAppointment.mutate(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  });

  return {
    form,
    onSubmit,
  };
}
