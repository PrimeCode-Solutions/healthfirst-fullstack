"use client";

import React from "react";
import { useCreateUserForm } from "./useCreateUserForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/modules/user/domain/user.interface";
import { Save, Lock } from "lucide-react";

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export function CreateUserForm() {
  const { form, handleSubmit, isPending } = useCreateUserForm();

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Campo Nome */}
        <FormField
          control={form.control as any}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Dr. João Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Email */}
        <FormField
          control={form.control as any}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail de Acesso</FormLabel>
              <FormControl>
                <Input placeholder="medico@healthfirst.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Senha (NOVO) */}
        <FormField
          control={form.control as any}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha de Acesso</FormLabel>
              <FormControl>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="******" className="pl-9" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Telefone */}
        <FormField
          control={form.control as any}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(82) 00000-0000"
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    field.onChange(formatted);
                  }}
                  maxLength={15}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Role */}
        <FormField
          control={form.control as any}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Usuário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.DOCTOR}>Médico</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                  <SelectItem value={UserRole.USER}>Paciente</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full mt-4">
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Salvando..." : "Criar Usuário"}
        </Button>
      </form>
    </Form>
  );
}