import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { CreateAppointmentDTO } from "@/modules/appointments/domain/appointment.interface";

export const schema = z.object({
    userId: z.string().min(1, "Id do usuário é necessário"),
    date: z.date().min(1, "Data é necessária"),
    startTime: z.string().min(1, "Horário inicial é obrigatório"),
    endTime: z.string().min(1, "Horário final é obrigatório"),
    patientName: z.string().min(1, "Nome é obrigatório"),
    type: z.enum(["GENERAL", "URGENT", "FOLLOWUP"]),
    patientEmail: z.string().email("Email invalido").optional(),
    patientPhone: z.string().regex(/^\d{10,11}$/, "Apenas números são aceitos").optional(),
    notes: z.string().optional(),
});

export const useAppointmentForm = (
    defaultValues?: Partial<CreateAppointmentDTO>,
) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        control,
    } = useForm<CreateAppointmentDTO>({ resolver: zodResolver(schema), defaultValues, });

    return {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        reset,
        control,
    };
}



