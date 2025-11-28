import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { CreateBusinessHoursDTO } from "@/modules/business-hours/domain/businessHours.interface";

// Schema de validação com Zod
export const BusinessHoursSchema = z.object({
  startTime: z.string().min(5, "Horário inicial obrigatório"),
  endTime: z.string().min(5, "Horário final obrigatório"),

  // Adicionado .optional() para corresponder ao DTO
  lunchBreakEnabled: z.boolean().optional(),

  lunchStartTime: z.string().optional().or(z.literal("")),
  lunchEndTime: z.string().optional().or(z.literal("")),

  // Adicionado .optional() para corresponder ao DTO
  mondayEnabled: z.boolean().optional(),
  tuesdayEnabled: z.boolean().optional(),
  wednesdayEnabled: z.boolean().optional(),
  thursdayEnabled: z.boolean().optional(),
  fridayEnabled: z.boolean().optional(),
  saturdayEnabled: z.boolean().optional(),
  sundayEnabled: z.boolean().optional(),

  appointmentDuration: z.number().min(5, "Duração mínima de 5 minutos"),
});

// Hook principal do formulário de business hours
export const useUpdateBusinessHoursForm = (
  defaultValues?: Partial<CreateBusinessHoursDTO>
) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
    watch,
  } = useForm<CreateBusinessHoursDTO>({
    resolver: zodResolver(BusinessHoursSchema),
    defaultValues,
  });
  return {
    register,
    handleSubmit,
    errors,
    reset,
    isSubmitting,
    control,
    setValue,
    watch,
  };
};