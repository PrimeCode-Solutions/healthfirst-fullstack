"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Clock, Loader2, LogIn, UserPlus, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ptBR } from "react-day-picker/locale";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const consultationTypes = [
  { id: "GENERAL", name: "Consulta Geral", price: 150.00 },
  { id: "URGENT", name: "Consulta Especializada", price: 250.00 },
  { id: "FOLLOWUP", name: "Retorno", price: 100.00 },
];

function formatTime(time: string) {
  const [hours, minutes] = time.split(":");
  return `${hours.padStart(2, '0')}:${minutes}`;
}

export default function AppointmentBooking() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedConsultationType, setSelectedConsultationType] = useState<string>("");
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  // 1. Buscar Médicos da API
  const { data: doctorsList, error: doctorsError } = useQuery({
    queryKey: ["public-doctors"],
    queryFn: async () => {
      const res = await api.get("/users?role=DOCTOR"); 
      return res.data.data.users;
    },
  });

  if (doctorsError) 
    throw doctorsError;

  // 2. Buscar Slots Disponíveis
  const { data: availableTimes, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["slots", selectedDoctor, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDoctor || !selectedDate) return [];
      const res = await api.get(`/business-hours/available-slots?date=${selectedDate.toISOString()}&doctorId=${selectedDoctor}`);
      return res.data;
    },
    enabled: !!selectedDoctor && !!selectedDate,
  });

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedConsultationType || !selectedDoctor) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (status === "unauthenticated") {
      setIsLoginDialogOpen(true);
      return;
    }

    setIsProcessing(true);

    try {
      const startTime24h = formatTime(selectedTime);
      const [startHour, startMinute] = startTime24h.split(":").map(Number);
      const endHour = startMinute === 30 ? startHour + 1 : startHour;
      const endMinute = startMinute === 30 ? 0 : 30;
      const endTime24h = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

      const typeData = consultationTypes.find(t => t.id === selectedConsultationType);
      const doctorData = doctorsList?.find((d: any) => d.id === selectedDoctor);
      
      const { data } = await api.post("/appointments", {
        date: selectedDate.toISOString(),
        startTime: startTime24h,
        endTime: endTime24h,
        type: selectedConsultationType,
        amount: typeData?.price || 150,
        description: `Agendamento: ${typeData?.name} com ${doctorData?.name}`,
        patientName: session?.user?.name,
        doctorId: selectedDoctor
      });
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("Link de pagamento não gerado.");
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Agende sua Consulta
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Cuidado e atenção especializada ao seu alcance.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Coluna Esquerda: Formulário */}
          <div className="space-y-6">
            
            {/* Passo 1: Profissional e Tipo */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="h-8 w-1 bg-primary rounded-full"/>
                        Dados da Consulta
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                         {/* Seletor de Médico */}
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Especialista</label>
                            <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={doctorOpen}
                                className="w-full justify-between h-11 border-gray-300 hover:border-primary/50 hover:bg-white transition-colors"
                                >
                                {selectedDoctor
                                    ? doctorsList?.find((doctor: any) => doctor.id === selectedDoctor)?.name
                                    : "Selecione o Médico"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                <CommandInput placeholder="Buscar médico..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                                    <CommandGroup>
                                    {doctorsList?.map((doctor: any) => (
                                        <CommandItem
                                        key={doctor.id}
                                        value={doctor.id}
                                        onSelect={() => {
                                            setSelectedDoctor(selectedDoctor === doctor.id ? "" : doctor.id);
                                            setDoctorOpen(false);
                                            setSelectedTime("");
                                        }}
                                        className="cursor-pointer"
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4 text-primary",
                                            selectedDoctor === doctor.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {doctor.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                        </div>

                        {/* Seletor de Tipo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tipo de Atendimento</label>
                            <Popover open={consultationOpen} onOpenChange={setConsultationOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={consultationOpen}
                                className="w-full justify-between h-11 border-gray-300 hover:border-primary/50 hover:bg-white transition-colors"
                                >
                                {selectedConsultationType
                                    ? consultationTypes.find((type) => type.id === selectedConsultationType)?.name
                                    : "Selecione o tipo"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                <CommandList>
                                    <CommandGroup>
                                    {consultationTypes.map((type) => (
                                        <CommandItem
                                        key={type.id}
                                        value={type.id}
                                        onSelect={() => {
                                            setSelectedConsultationType(selectedConsultationType === type.id ? "" : type.id);
                                            setConsultationOpen(false);
                                        }}
                                        className="cursor-pointer"
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4 text-primary",
                                            selectedConsultationType === type.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{type.name}</span>
                                            <span className="text-xs text-muted-foreground font-medium text-emerald-600">
                                                R$ {type.price.toFixed(2)}
                                            </span>
                                        </div>
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Passo 2: Horários */}
            {selectedDate && selectedDoctor && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Horários para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h2>
                    
                    {isLoadingSlots ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground bg-white rounded-lg border border-dashed">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Verificando agenda...</p>
                        </div>
                    ) : availableTimes && availableTimes.length > 0 ? (
                        <ToggleGroup
                            type="single"
                            value={selectedTime}
                            onValueChange={setSelectedTime}
                            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
                        >
                            {availableTimes.map((time: string) => (
                                <ToggleGroupItem
                                    key={time}
                                    value={time}
                                    className="h-12 w-full rounded-xl border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-white transition-all duration-200 font-medium shadow-sm"
                                >
                                    {time}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    ) : (
                        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-100 text-red-600">
                            Nenhum horário disponível para esta data.
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Coluna Direita: Calendário e Resumo */}
          <div className="space-y-6">
            <Card className="border-0 shadow-md overflow-hidden">
                <div className="bg-primary/5 p-4 border-b border-primary/10">
                    <h3 className="font-semibold text-primary flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Selecione a Data
                    </h3>
                </div>
                <CardContent className="p-0">
                    <Calendar
                        locale={ptBR}
                        mode="single"
                        defaultMonth={new Date()}
                        numberOfMonths={1}
                        selected={selectedDate}
                        onSelect={(date) => {
                            setSelectedDate(date);
                            setSelectedTime("");
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        className="w-full flex justify-center p-4"
                        classNames={{
                            head_cell: "text-muted-foreground font-normal text-[0.8rem] uppercase",
                            cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-full transition-colors",
                            day_selected: "!bg-primary !text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white shadow-md",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_hidden: "invisible",
                        }}
                    />
                </CardContent>
            </Card>

            <div className="sticky top-8">
                 <Button
                    className="w-full h-14 text-lg font-semibold shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02]"
                    size="lg"
                    disabled={!selectedDoctor || !selectedConsultationType || !selectedTime || !selectedDate || isProcessing}
                    onClick={handleBooking}
                >
                    {isProcessing ? (
                        <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
                        </>
                    ) : (
                        "Confirmar Agendamento"
                    )}
                </Button>
                
                <p className="mt-4 text-center text-xs text-muted-foreground">
                    Pagamento seguro processado via Mercado Pago.
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de Login/Cadastro */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-0 shadow-2xl">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <LogIn className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Identifique-se</DialogTitle>
            <DialogDescription>
              Para finalizar seu agendamento, faça login ou crie sua conta gratuitamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
             <Link href="/login?callbackUrl=/agendar-consulta" className="w-full">
                <Button className="w-full h-11" variant="default">
                   Fazer Login
                </Button>
             </Link>
             
             <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    ou
                  </span>
                </div>
              </div>
             
             <Link href="/register?callbackUrl=/agendar-consulta" className="w-full">
                <Button className="w-full h-11 border-primary/20 hover:bg-primary/5 text-primary" variant="outline">
                   <UserPlus className="mr-2 h-4 w-4" /> Criar Conta
                </Button>
             </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}