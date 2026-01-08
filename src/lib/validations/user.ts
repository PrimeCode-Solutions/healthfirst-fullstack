import { z } from "zod";
import { UserRole } from "@/modules/user/domain/user.interface";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z
    .string()
    .email("Por favor, insira um e-mail válido"),
  phone: z
    .string()
    .min(1, "O telefone é obrigatório")
    .min(10, "Telefone incompleto"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.nativeEnum(UserRole), 
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres")
    .optional(),
  email: z
    .string()
    .email("Por favor, insira um e-mail válido")
    .optional(),
  phone: z
    .string()
    .min(14, "Telefone incompleto")
    .optional(), 
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Informe sua senha atual"),
    newPassword: z
      .string()
      .min(8, "A nova senha deve conter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[#$@!%*?])[A-Za-z\d#$@!%*?]{8,}$/,
      "A nova senha deve conter pelo menos um caractere especial"
    ),
    confirmNewPassword: z 
    .string()
    .min(1, "Confirme sua nova senha"),
})
.refine((data)=> data.newPassword === data.confirmNewPassword, {
  message: "As senhas não coincidem",
  path: ["confirmNewPassword"],
})