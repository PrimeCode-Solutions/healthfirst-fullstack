import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CreateEbookCategoryDTO } from "@/modules/ebook-category/domain/ebookCategory.interface";
import { CategoryStatus } from "@/modules/ebook-category/domain/ebookCategory.interface";

export const schema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres"),

  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),

  status: z.enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE]).optional(),
});

export const useEbookCategoryForm = (
  defaultValues?: Partial<CreateEbookCategoryDTO>,
) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<CreateEbookCategoryDTO>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return {
    register,
    handleSubmit,
    errors,
    reset,
    isSubmitting,
    control,
  };
};
