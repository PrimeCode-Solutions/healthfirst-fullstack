"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Tag, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ConsultationTypesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    duration: "30",
    isActive: true
  });

  // Buscar todos os tipos (passando mode=admin para ver inativos também)
  const { data: types, isLoading } = useQuery({
    queryKey: ["admin-consultation-types"],
    queryFn: async () => {
      const res = await api.get("/admin/consultation-types?mode=admin");
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        return api.put(`/admin/consultation-types/${editingItem.id}`, data);
      }
      return api.post("/admin/consultation-types", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-consultation-types"] });
      toast.success(editingItem ? "Atualizado com sucesso!" : "Criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar.")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/consultation-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-consultation-types"] });
      toast.success("Item removido.");
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.error || "Erro ao deletar.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ name: "", price: "", description: "", duration: "30", isActive: true });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      description: item.description || "",
      duration: item.duration,
      isActive: item.isActive
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Tipos de Consulta</h1>
            <p className="text-muted-foreground">Defina os serviços e preços disponíveis para agendamento.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Nova Consulta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Serviço</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Ex: Consulta Nutricional" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      placeholder="0.00" 
                      required 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Duração (min)</Label>
                    <Input 
                      type="number" 
                      value={formData.duration} 
                      onChange={e => setFormData({...formData, duration: e.target.value})} 
                      placeholder="30" 
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição Curta</Label>
                <Input 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Ex: Inclui retorno em 15 dias..."
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                  <Switch 
                    id="active-mode"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label htmlFor="active-mode">Disponível para agendamento</Label>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
         <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {types?.map((type: any) => (
            <Card key={type.id} className={`group relative transition-all hover:shadow-md ${!type.isActive ? 'opacity-70 border-dashed' : ''}`}>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <Badge variant={type.isActive ? "default" : "secondary"} className="mb-2">
                            {type.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl flex flex-col gap-1">
                        <span>{type.name}</span>
                        <span className="text-2xl font-bold text-emerald-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(type.price)}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center text-sm text-gray-500 gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{type.duration} minutos de duração</span>
                        </div>
                        <p className="text-sm text-muted-foreground min-h-[40px] line-clamp-2">
                            {type.description || "Sem descrição definida."}
                        </p>
                        
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(type)}>
                                <Pencil className="h-3 w-3 mr-2" /> Editar
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    if(confirm("Tem certeza? Isso pode falhar se já houver agendamentos.")) deleteMutation.mutate(type.id)
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}