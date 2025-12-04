"use client";

import * as React from "react";
import {
  IconCalendarUser,
  IconLogout,
  IconNotebook,
  IconSettings,
  IconUsers,
  IconClock,
  IconCalendarTime,
  IconHome, 
} from "@tabler/icons-react";
import { signOut, useSession } from "next-auth/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Menu PACIENTE
  const patientNav = [
    { title: "Minhas Consultas", url: "/dashboard", icon: IconCalendarUser },
    { title: "Meus E-books", url: "/dashboard/conteudo", icon: IconNotebook }, 
    { title: "Configurações", url: "/dashboard/config", icon: IconSettings },
  ];

  // Menu MÉDICO
  const doctorNav = [
    { title: "Visão Geral", url: "/dashboard", icon: IconCalendarUser }, 
    { title: "Agendamentos", url: "/dashboard/agendamentos", icon: IconCalendarTime }, 
    { title: "Pacientes", url: "/dashboard/clientes", icon: IconUsers },
    { title: "Horários", url: "/dashboard/config", icon: IconClock },
  ];

  // Menu ADMIN
  const adminNav = [
    { title: "Visão Geral", url: "/dashboard", icon: IconCalendarUser },
    { title: "Agendamentos", url: "/dashboard/agendamentos", icon: IconCalendarTime }, 
    { title: "Gerenciar Usuários", url: "/dashboard/clientes", icon: IconUsers },
    { title: "Gerenciar Médicos", url: "/dashboard/medicos", icon: IconUsers },
    { title: "Gestão de Conteúdo", url: "/dashboard/conteudo", icon: IconNotebook }, 
    { title: "Configurações", url: "/dashboard/config", icon: IconSettings },
  ];

  let navItems = patientNav;
  if (role === "ADMIN") navItems = adminNav;
  else if (role === "DOCTOR") navItems = doctorNav;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/", redirect: true });
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex justify-center py-2">
               <Image
                width={140}
                height={70}
                src="/images/home/logo-principal.svg" 
                alt="HealthFirst Logo"
                className="object-contain"
                priority
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      
      <SidebarFooter className="flex flex-col gap-2"> 
        
        <Button 
          variant="outline" 
          asChild
          className="w-full justify-start gap-2"
        >
          <Link href="/">
            <IconHome className="size-4" /> 
            Voltar para o Início
          </Link>
        </Button>

        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full flex items-center justify-start gap-2"
        >
          <IconLogout className="size-4" /> 
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}