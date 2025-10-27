import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEbookCategoryRepository } from "@/modules/ebook-category/infrastructure/ebookCategoryRepository";
import { toast } from "sonner";
import type { CreateEbookCategoryDTO } from "@/modules/ebook-category/domain/ebookCategory.interface";
import { AxiosError } from "axios";

const ebookCategoryRepository = createEbookCategoryRepository();

export function useCreateEbookCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEbookCategoryDTO) =>
      ebookCategoryRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebookCategories"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error: AxiosError) => {
      console.error("Erro ao criar categoria:", error);
      toast.error(error.message || "Erro ao criar categoria");
    },
  });
}
