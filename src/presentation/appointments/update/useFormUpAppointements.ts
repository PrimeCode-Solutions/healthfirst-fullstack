import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateAppointmentStatusMutation } from "../mutations/useAppointmentMutations";
import DOMPurify from "dompurify";

export const AppointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

const UpdateAppointmentSchema = z.object({
  id: z.string(),
  status: AppointmentStatusSchema,
});

type UpdateAppointmentType = z.infer<typeof UpdateAppointmentSchema>;

export function UpdateAppointmentForm() {
  const form = useForm<UpdateAppointmentType>({
    resolver: zodResolver(UpdateAppointmentSchema),
    defaultValues: {
      id: "",
      status: "PENDING",
    },
  });

  const updateAppointment = useUpdateAppointmentStatusMutation();

  const onSubmit = form.handleSubmit((data: UpdateAppointmentType) => {
    const sanitizedData = {
      ...data,
      id:
        typeof window !== "undefined"
          ? DOMPurify.sanitize(data.id).trim()
          : data.id.trim(),
    };
    updateAppointment.mutate(sanitizedData, {
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
