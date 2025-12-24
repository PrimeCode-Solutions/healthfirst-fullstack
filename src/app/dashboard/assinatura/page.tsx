import { authOptions } from "@/lib/auth-config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TransparentSubscriptionForm } from "@/presentation/subscriptions/create/TransparentSubscriptionForm";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const PLAN_DATA = {
    name: "Plano Premium HealthFirst",
    price: 29.90, 
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Assinar Premium</h1>
          <p className="text-muted-foreground">
            Desbloqueie todos os recursos com nosso plano mensal.
          </p>
        </div>

        <TransparentSubscriptionForm 
           userId={session.user.id}
           userEmail={session.user.email || ""}
           planName={PLAN_DATA.name}
           amount={PLAN_DATA.price}
        />
      </div>
    </div>
  );
}