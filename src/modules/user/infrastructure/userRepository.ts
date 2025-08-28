import { UserRepository } from "../domain/userRepository";
import api from "@/lib/api";

export function createUserRepository(): UserRepository {
  return {
    hasAccessToPremiumContent,
  };
}

async function hasAccessToPremiumContent(userId: string): Promise<boolean> {
  const response = await api.get<{ hasAccess: boolean }>(
    `/users/${userId}/premium-access`,
  );
  return response.data.hasAccess;
}
