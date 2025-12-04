"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ptBR } from "react-day-picker/locale";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";


const doctors = [
  { id: "1", name: "Dr. João Silva" },
  { id: "2", name: "Dra. Maria Santos" },
  { id: "3", name: "Dr. Pedro Costa" },
];

const consultationTypes = [
  { id: "GENERAL", name: "Consulta Geral", price: 150.00 },
  { id: "URGENT", name: "Consulta Especializada", price: 250.00 },
  { id: "FOLLOWUP", name: "Retorno", price: 100.00 },
];

const availableTimes = [
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
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

  const handleBooking = async () => {
    if (status === "unauthenticated") {
      toast.error("Faça login para continuar o agendamento.");
      router.push("/login?callbackUrl=/agendar-consulta");
      return;
    }

    if (!selectedDate || !selectedTime || !selectedConsultationType || !selectedDoctor) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsProcessing(true);

    try {
      const startTime24h = formatTime(selectedTime);
      
      const [startHour, startMinute] = startTime24h.split(":").map(Number);
      const endHour = startHour + 1;
      const endTime24h = `${String(endHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

      const typeData = consultationTypes.find(t => t.id === selectedConsultationType);
      const doctorData = doctors.find(d => d.id === selectedDoctor);
      
      // 3. Enviar para API
      const { data } = await api.post("/appointments", {
        date: selectedDate.toISOString(),
        startTime: startTime24h,
        endTime: endTime24h,
        type: selectedConsultationType,
        amount: typeData?.price || 150,
        description: `Agendamento: ${typeData?.name} com ${doctorData?.name}`,
        patientName: session?.user?.name
      });

      // 4. Redirecionar
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
            Escolha a data e o horário que melhor lhe convir. Selecione o médico
            e o tipo de consulta de sua preferência para ver os horários
            disponíveis.
          </p>
        </div>

        <div className="">
          <section className="flex flex-col-reverse pb-20 md:flex-col md:pb-0">
            <div className="grid grid-cols-1 justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-medium text-gray-700">Escolha o médico e o tipo de consulta</p>
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
                        ? doctors.find((doctor) => doctor.id === selectedDoctor)?.name
                        : "Selecione Médico"}
                      <ChevronsUpDown className="opacity-50 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar médico..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                        <CommandGroup>
                          {doctors.map((doctor) => (
                            <CommandItem
                              className="cursor-pointer"
                              key={doctor.id}
                              value={doctor.id}
                              onSelect={(currentValue) => {
                                setSelectedDoctor(currentValue === selectedDoctor ? "" : currentValue);
                                setDoctorOpen(false);
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
                        : "Selecione o tipo de consulta"}
                      <ChevronsUpDown className="opacity-50 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tipo de consulta..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                        <CommandGroup>
                          {consultationTypes.map((type) => (
                            <CommandItem
                              className="cursor-pointer"
                              key={type.id}
                              value={type.id}
                              onSelect={(currentValue) => {
                                setSelectedConsultationType(currentValue === selectedConsultationType ? "" : currentValue);
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
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="w-full rounded-lg p-0"
                classNames={{
                  day_button: "cursor-pointer hover:bg-accent rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                }}
              />
            </div>

            {/* Horários disponíveis */}
            {selectedDate && (
              <div className="mb-5 w-full md:mt-5 animate-in fade-in slide-in-from-bottom-2">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Horários disponíveis para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <ToggleGroup
                  type="single"
                  value={selectedTime}
                  onValueChange={setSelectedTime}
                  className="grid w-full grid-cols-2 justify-start gap-3 sm:grid-cols-4 md:flex md:flex-wrap"
                >
                  {availableTimes.map((time) => (
                    <ToggleGroupItem
                      key={time}
                      value={time}
                      className="data-[state=on]:bg-primary data-[state=on]:hover:bg-primary flex min-h-[44px] cursor-pointer items-center justify-center rounded-md px-4 py-3 text-sm font-medium hover:bg-gray-100 border border-gray-200 data-[state=on]:text-white transition-all"
                    >
                      {time}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
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
    </div>
  );
}