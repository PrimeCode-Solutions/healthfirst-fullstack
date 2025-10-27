import { useQuery } from "@tanstack/react-query";
import { createEbookCategoryRepository } from "@/modules/ebook-category/infrastructure/ebookCategoryRepository";

const ebookCategoryRepository = createEbookCategoryRepository();

export function useEbookCategories() {
  return useQuery({
    queryKey: ["ebookCategories"],
    queryFn: () => ebookCategoryRepository.findAll(),
  });
}

export function useEbookCategoryById(id: string) {
  return useQuery({
    queryKey: ["ebookCategory", id],
    queryFn: () => ebookCategoryRepository.findById(id),
    enabled: !!id,
  });
}
