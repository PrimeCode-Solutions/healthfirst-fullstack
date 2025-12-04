import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/userService";
import { toast } from "sonner";
import { CreateUserDTO } from "@/modules/user/domain/user.interface";

interface UpdateUserParams {
  userId: string;
  data: any;
}

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserDTO) => {
      return await userService.createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao criar usuário:", error);
      toast.error(error.response?.data?.error || "Erro ao criar usuário.");
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: UpdateUserParams) => {
      return await userService.updateUser(userId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      
      toast.success("Dados atualizados com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro no update:", error);
      toast.error("Erro ao atualizar usuário.");
    },
  });
};