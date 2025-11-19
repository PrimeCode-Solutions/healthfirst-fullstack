import { UpdateAppointmentForm } from "./useFormUpAppointements";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";

export function useCreateAppointmentMutation() {
  const { form, onSubmit } = UpdateAppointmentForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atualizar Status da Consulta</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID da Consulta</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: 12345" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full rounded-md border p-2">
                      <option value="PENDING">Pendente</option>
                      <option value="CONFIRMED">Confirmada</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="flex items-center gap-2">
              <Save size={16} />
              Atualizar
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
