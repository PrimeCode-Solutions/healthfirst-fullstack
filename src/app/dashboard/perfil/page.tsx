"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useGetUserById } from "@/presentation/user/queries/useUserQueries";
import { ProfileForm } from "@/components/profile/profile-form";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? "";

  const { data: user, isLoading, refetch } = useGetUserById(userId);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !session.user || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <p className="text-muted-foreground mb-2">
          Não foi possível carregar os dados.
        </p>
        <button
          onClick={() => refetch()}
          className="text-primary hover:underline text-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meus dados</h1>
        <p className="text-muted-foreground">
          Visualize e atualize seus dados pessoais.
        </p>
      </div>

      <ProfileForm user={user} onRefetch={refetch} />
    </div>
  );
}
