"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, LogIn, UserPlus } from "lucide-react";
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
  
  // Estado para controlar o Dialog de Login
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  // 1. Buscar Médicos da API
  const { data: doctorsList } = useQuery({
    queryKey: ["public-doctors"],
    queryFn: async () => {
      // Agora a API permite role=DOCTOR sem autenticação
      const res = await api.get("/users?role=DOCTOR"); 
      return res.data.data.users;
    },
  });

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
    // Validação de campos ANTES de checar o login
    if (!selectedDate || !selectedTime || !selectedConsultationType || !selectedDoctor) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    // Se não estiver logado, abre o Pop-up
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
        doctorId: selectedDoctor // Envia o ID do médico selecionado
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
    <div className="bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Agende sua consulta
          </h1>
          <p className="leading-relaxed text-[#598C75]">
            Escolha o médico especialista e o horário ideal para você.
          </p>
        </div>

        <div className="">
          <section className="flex flex-col-reverse pb-20 md:flex-col md:pb-0">
            <div className="grid grid-cols-1 justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-medium text-gray-700">Detalhes da Consulta</p>
                </div>
                
                {/* Seletor de Médico */}
                <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={doctorOpen}
                      className="h-12 justify-between border-gray-200 bg-white"
                    >
                      {selectedDoctor
                        ? doctorsList?.find((doctor: any) => doctor.id === selectedDoctor)?.name
                        : "Selecione o Médico"}
                      <ChevronsUpDown className="opacity-50 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar médico..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                        <CommandGroup>
                          {doctorsList?.map((doctor: any) => (
                            <CommandItem
                              className="cursor-pointer"
                              key={doctor.id}
                              value={doctor.id}
                              onSelect={(currentValue) => {
                                setSelectedDoctor(currentValue === selectedDoctor ? "" : doctor.id);
                                setDoctorOpen(false);
                                setSelectedTime("");
                              }}
                            >
                              {doctor.name}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedDoctor === doctor.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Seletor de Tipo de Consulta */}
                <Popover open={consultationOpen} onOpenChange={setConsultationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={consultationOpen}
                      className="h-12 justify-between border-gray-200 bg-white"
                    >
                      {selectedConsultationType
                        ? consultationTypes.find((type) => type.id === selectedConsultationType)?.name
                        : "Selecione o tipo"}
                      <ChevronsUpDown className="opacity-50 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {consultationTypes.map((type) => (
                            <CommandItem
                              className="cursor-pointer"
                              key={type.id}
                              value={type.id}
                              onSelect={(currentValue) => {
                                setSelectedConsultationType(currentValue === selectedConsultationType ? "" : type.id);
                                setConsultationOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{type.name}</span>
                                <span className="text-xs text-muted-foreground">R$ {type.price.toFixed(2)}</span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedConsultationType === type.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <Calendar
                locale={ptBR}
                mode="single"
                defaultMonth={new Date()}
                numberOfMonths={isMobile ? 1 : 2}
                selected={selectedDate}
                onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime("");
                }}
                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                className="w-full rounded-lg p-0"
                classNames={{
                  day_button: "cursor-pointer hover:bg-accent rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                }}
              />
            </div>

            {/* Horários disponíveis */}
            {selectedDate && selectedDoctor && (
              <div className="mb-5 w-full md:mt-5 animate-in fade-in slide-in-from-bottom-2">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Horários disponíveis para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
                
                {isLoadingSlots ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando horários...
                    </div>
                ) : availableTimes && availableTimes.length > 0 ? (
                <ToggleGroup
                  type="single"
                  value={selectedTime}
                  onValueChange={setSelectedTime}
                  className="grid w-full grid-cols-2 justify-start gap-3 sm:grid-cols-4 md:flex md:flex-wrap"
                >
                  {availableTimes.map((time: string) => (
                    <ToggleGroupItem
                      key={time}
                      value={time}
                      className="data-[state=on]:bg-primary data-[state=on]:hover:bg-primary flex min-h-[44px] cursor-pointer items-center justify-center rounded-md px-4 py-3 text-sm font-medium hover:bg-gray-100 border border-gray-200 data-[state=on]:text-white transition-all"
                    >
                      {time}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                ) : (
                    <p className="text-red-500">Nenhum horário disponível para este médico nesta data.</p>
                )}
              </div>
            )}
          </section>

          <div className="fixed right-0 bottom-0 left-0 flex justify-end border-t border-gray-200 bg-white p-3 shadow-2xl drop-shadow-2xl md:sticky md:border-0 md:bg-transparent md:shadow-none md:drop-shadow-none md:mt-8">
            <Button
              className="w-full cursor-pointer md:w-auto min-w-[250px]"
              size="lg"
              disabled={
                !selectedDoctor ||
                !selectedConsultationType ||
                !selectedTime ||
                !selectedDate ||
                isProcessing
              }
              onClick={handleBooking}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                </>
              ) : (
                "Prosseguir para o pagamento"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de Login/Cadastro */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Identificação Necessária</DialogTitle>
            <DialogDescription>
              Para finalizar seu agendamento e realizar o pagamento, você precisa estar logado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <Link href="/login?callbackUrl=/agendar-consulta" className="w-full">
                <Button className="w-full" variant="default">
                   <LogIn className="mr-2 h-4 w-4" /> Fazer Login
                </Button>
             </Link>
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou
                  </span>
                </div>
              </div>
             <Link href="/register?callbackUrl=/agendar-consulta" className="w-full">
                <Button className="w-full" variant="outline">
                   <UserPlus className="mr-2 h-4 w-4" /> Criar Conta
                </Button>
             </Link>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsLoginDialogOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}