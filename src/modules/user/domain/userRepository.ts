import type { SubscriptionStatus } from "./user.interface";

export interface UserRepository {
  // GET - Verificar se usuário tem acesso premium
  hasAccessToPremiumContent: (userId: string) => Promise<boolean>;


}
