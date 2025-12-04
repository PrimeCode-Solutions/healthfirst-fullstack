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