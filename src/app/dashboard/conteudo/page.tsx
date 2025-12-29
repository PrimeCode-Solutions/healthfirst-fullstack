"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";

import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Gift,
  FileText,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Ebook {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  isPremium: boolean;
  price?: number;
  coverImage?: string;
  fileUrl: string;
  downloads: number;
  status: "published" | "draft";
  createdAt: string;
}

const ebookFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  status: z.enum(["published", "draft"]),
  isPaid: z.boolean(), 
  coverFile: z.any().optional(),
  ebookFile: z.any().optional(),
});

type EbookFormData = z.infer<typeof ebookFormSchema>;

export default function ConteudoPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";

  const { hasAccess, loading } = usePremiumAccess(userId);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);

  const form = useForm<EbookFormData>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      status: "draft",
      isPaid: false,
      coverFile: undefined,
      ebookFile: undefined,
    },
  });

  const { watch, setValue, reset } = form;
  const isPaid = watch("isPaid");

  const loadData = async () => {
    setIsFetching(true);
    try {
      const [ebRes, catRes] = await Promise.all([
        fetch("/api/ebooks"),
        fetch("/api/ebook-categories")
      ]);
      const ebJson = await ebRes.json();
      const catJson = await catRes.json();

      if (ebJson.success) setEbooks(ebJson.data);
      if (catJson.success) setDbCategories(catJson.data);
    } catch (error) {
      toast.error("Erro ao carregar dados do servidor");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    reset({
      title: "",
      description: "",
      categoryId: "",
      status: "draft",
      isPaid: false,
      price: undefined,
      coverFile: undefined,
      ebookFile: undefined,
    });
    setEditingEbook(null);
  };

  const handleSubmit = async (data: EbookFormData) => {
    if (!editingEbook && !data.ebookFile) {
      toast.error("Arquivo do ebook é obrigatório para novos ebooks");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("categoryId", data.categoryId);
      formData.append("status", data.status);
      formData.append("isPremium", String(data.isPaid));
      formData.append("author", "Equipe HealthFirst");


      if (data.coverFile instanceof File) {
        formData.append("coverFile", data.coverFile);
      }

      if (data.ebookFile instanceof File) {
        formData.append("ebookFile", data.ebookFile);
      }

      const method = editingEbook ? "PUT" : "POST";
      const url = editingEbook ? `/api/ebooks/${editingEbook.id}` : "/api/ebooks";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar e-book");
      }

      toast.success(editingEbook ? "Ebook atualizado!" : "Ebook adicionado!");
      loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar requisição");
    }
  };

  const handleEdit = (ebook: Ebook) => {
    setEditingEbook(ebook);
    setValue("title", ebook.title);
    setValue("description", ebook.description);
    setValue("categoryId", ebook.categoryId);
    setValue("isPaid", ebook.isPremium);
    setValue("price", ebook.price);
    setValue("status", ebook.status);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este e-book?")) return;

    try {
      const res = await fetch(`/api/ebooks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Ebook removido com sucesso!");
        loadData();
      }
    } catch (error) {
      toast.error("Erro ao remover e-book");
    }
  };

  if (loading || isFetching) {
    return (
      <div className="p-4">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin && !hasAccess) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Sua assinatura não está ativa no momento. Atualize o pagamento para continuar usando o painel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <div>
              <h1 className="mb-2 font-bold text-gray-900 sm:text-3xl">
                {isAdmin ? "Gerenciar Conteúdo" : "Meus E-books"}
              </h1>
              <p className="text-gray-600">
                {isAdmin
                  ? "Faça upload e gerencie ebooks gratuitos e pagos"
                  : "Acesse seus materiais educativos e guias de saúde"}
              </p>
            </div>

            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 sm:w-auto"
                    onClick={resetForm}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Ebook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEbook ? "Editar Ebook" : "Adicionar Novo Ebook"}
                    </DialogTitle>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Título *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Digite o título do ebook"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Descreva o conteúdo do ebook"
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoria *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {dbCategories.length > 0 ? (
                                      dbCategories
                                        .filter((cat) => cat.id && cat.id.trim() !== "")
                                        .map((cat) => (
                                          <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                          </SelectItem>
                                        ))
                                    ) : (
                                      <div className="p-2 text-center text-sm text-gray-500">
                                        Nenhuma categoria cadastrada
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="draft">
                                      Rascunho
                                    </SelectItem>
                                    <SelectItem value="published">
                                      Publicado
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="isPaid"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Tipo de Conteúdo</FormLabel>
                                <p className="text-sm text-gray-500">
                                  {isPaid
                                    ? "Conteúdo pago (assinatura)"
                                    : "Conteúdo gratuito"}
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="coverFile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Imagem de Capa</FormLabel>
                              <div className="mt-2 flex items-center gap-4">
                                <div className="flex-1">
                                  <FormControl>
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        field.onChange(e.target.files?.[0])
                                      }
                                    />
                                  </FormControl>
                                </div>
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="ebookFile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Arquivo do Ebook {!editingEbook && "*"}
                              </FormLabel>
                              <div className="mt-2 flex items-center gap-4">
                                <div className="flex-1">
                                  <FormControl>
                                    <Input
                                      type="file"
                                      accept=".pdf,.epub,.mobi"
                                      onChange={(e) =>
                                        field.onChange(e.target.files?.[0])
                                      }
                                    />
                                  </FormControl>
                                </div>
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                Formatos aceitos: PDF, EPUB, MOBI (máx. 50MB)
                                {editingEbook &&
                                  " • Deixe em branco para manter o arquivo atual"}
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {editingEbook ? "Atualizar" : "Salvar"} Ebook
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="my-4 grid grid-cols-3 gap-3 sm:my-8 sm:gap-6 md:grid-cols-3">
            <Card className="!h-fit p-2 sm:p-6">
              <CardContent className="!h-fit p-0 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total de Ebooks
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {ebooks.length}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="!h-fit p-2 sm:p-6">
              <CardContent className="!h-fit p-0 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Conteúdo Gratuito
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {ebooks.filter((e) => !e.isPremium).length}
                    </p>
                  </div>
                  <Gift className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="!h-fit p-2 sm:p-6">
              <CardContent className="!h-fit p-0 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Conteúdo Pago
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {ebooks.filter((e) => e.isPremium).length}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 p-0 shadow-none sm:border sm:p-4 sm:shadow">
            <CardHeader className="p-0 sm:p-2">
              <CardTitle>Ebooks Cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="border-0 p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ebooks.map((ebook) => (
                      <TableRow key={ebook.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={ebook.coverImage || "/placeholder.svg"}
                              alt={ebook.title}
                              className="h-12 w-10 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium">{ebook.title}</p>
                              <p className="max-w-xs truncate text-sm text-gray-500">
                                {ebook.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{ebook.category.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ebook.status === "published"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {ebook.status === "published"
                              ? "Publicado"
                              : "Rascunho"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(ebook)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(ebook.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(ebook.fileUrl, "_blank")}
                              >
                                <FileText className="mr-2 h-4 w-4" /> Ver
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-4 md:hidden">
                {ebooks.map((ebook) => (
                  <Card
                    key={ebook.id}
                    className="border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-1 items-start gap-3">
                          <img
                            src={ebook.coverImage || "/placeholder.svg"}
                            alt={ebook.title}
                            className="h-16 w-12 flex-shrink-0 rounded object-cover shadow-sm"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 text-sm leading-tight font-semibold text-gray-900">
                              {ebook.title}
                            </h3>
                            <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">
                              {ebook.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 gap-1">
                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(ebook)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(ebook.id)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Categoria
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {ebook.category.name}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Status
                          </span>
                          <Badge
                            variant={
                              ebook.status === "published"
                                ? "default"
                                : "secondary"
                            }
                            className="w-fit text-xs"
                          >
                            {ebook.status === "published"
                              ? "Publicado"
                              : "Rascunho"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}