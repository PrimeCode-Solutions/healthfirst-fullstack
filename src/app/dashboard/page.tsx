"use client";

import { useSession } from "next-auth/react";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { Loader2 } from "lucide-react";

// Importe seus componentes de Paciente/Médico existentes aqui, se houver
// import PatientDashboard from "@/components/dashboard/patient-dashboard"; 

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  // Renderiza o Dashboard conforme o cargo
  if (session.user.role === "ADMIN") {
    return <AdminDashboard />;
  }

  // Fallback para Pacientes/Médicos (pode manter o código antigo aqui ou criar componentes separados)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bem-vindo, {session.user.name}</h1>
      <p className="text-muted-foreground">
        {session.user.role === "DOCTOR" 
          ? "Acesse a aba 'Agendamentos' para gerenciar suas consultas."
          : "Utilize o menu lateral para agendar consultas ou visualizar seus exames."}
      </p>
    </div>
  );
}