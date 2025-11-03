import { z } from "zod"

const appointmentSchema = z.object({
    date: z.string().min(1, "Data é obrigatória"),
    startTime: z.string().min(1, "Horário inicial é obrigatório"),
    endTime: z.string().min(1, "Horário final é obrigatório"),
    patientName: z.string().min(1, "Nome é obrigatório"),
    patientEmail: z.string().email("Email invalido"),
    patientPhone: z.string().regex(/^\d{10,11}$/, "Apenas números são aceitos").optional(),
    notes: z.string().optional(),
});



