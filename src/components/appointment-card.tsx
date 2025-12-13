import {
  CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  Banknote,
  Phone,
  Mail,
  User,
  Info,
  MessageCircle,
  Hash,
  Clock,
  CreditCard,
  UserCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical } from "lucide-react";

interface AppointmentCardProps {
  appointment: any;
  currentUser: any;
  onEdit: (apt: any) => void;
  onDelete: (id: string) => void;
  onComplete: (apt: any) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  SCHEDULED: { label: "Agendado", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CalendarIcon },
  CONFIRMED: { label: "Confirmado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  COMPLETED: { label: "Concluído", color: "bg-gray-100 text-gray-700 border-gray-200", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  PENDING: { label: "Pendente", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: AlertCircle },
};

export default function AppointmentCard({
  appointment,
  currentUser,
  onEdit,
  onDelete,
  onComplete,
}: AppointmentCardProps) {
  const isDoctor = currentUser?.role === "DOCTOR";
  const isAdmin = currentUser?.role === "ADMIN";
  
  // Equipe (Admin ou Médico)
  const isStaff = isDoctor || isAdmin;
  
  const status = statusConfig[appointment.status] || statusConfig.SCHEDULED;
  const StatusIcon = status.icon;

  const startTime = appointment.startTime?.slice(0, 5) || "--:--";
  let mainName = "";
  let subName = null;

  if (isStaff) {
    mainName = appointment.patientName || appointment.user?.name || "Paciente sem nome";
    
    if (isAdmin) {
        subName = (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                <UserCheck className="h-3 w-3" /> 
                Dr(a). {appointment.doctor?.name || "Não atribuído"}
            </span>
        );
    }
  } else {
    mainName = appointment.doctor?.name || "Dr. Não atribuído";
    subName = (
        <span className="text-xs text-muted-foreground">
            Para: {appointment.patientName || "Você"}
        </span>
    );
  }

  const canViewContact = isAdmin || (isDoctor && appointment.doctorId === currentUser?.id);
  
  const contactEmail = appointment.patientEmail || appointment.user?.email;
  const contactPhone = appointment.patientPhone || appointment.user?.phone;
  const createdAtFormatted = appointment.createdAt 
    ? format(new Date(appointment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : "Data desconhecida";

  const getWhatsappLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, ""); 
    const finalNumber = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${finalNumber}`;
  };

  return (
    <Card className="group relative overflow-hidden border border-emerald-100/60 bg-white transition-all hover:shadow-md hover:border-emerald-200">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", status.color.replace("bg-", "bg-opacity-100 bg-").split(" ")[0])} />
      
      <div className="flex flex-col">
        <div className="flex flex-col gap-4 p-4 pl-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold shadow-sm">
                <span className="text-lg leading-none">{startTime}</span>
                <span className="text-[10px] text-emerald-600/70 uppercase mt-0.5">Início</span>
            </div>

            <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-gray-900 text-lg">
                        {mainName}
                    </h4>
                    {subName}
                    
                    {canViewContact && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="text-muted-foreground hover:text-emerald-600 transition-colors focus:outline-none ml-1">
                                    <Info className="h-4 w-4" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                                <div className="p-4 bg-emerald-50/50 border-b border-emerald-100">
                                    <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                                        <User className="h-4 w-4" /> 
                                        Contato do Paciente
                                    </h4>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-xs font-medium text-muted-foreground">Nome Completo</span>
                                        <p className="text-sm font-medium">{appointment.patientName}</p>
                                    </div>
                                    <Separator />
                                    <div className="space-y-3">
                                        {contactEmail && (
                                            <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                                    <Mail className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs text-muted-foreground font-medium">E-mail</p>
                                                    <a href={`mailto:${contactEmail}`} className="text-sm text-blue-600 hover:underline truncate block">
                                                        {contactEmail}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {contactPhone && (
                                            <div className="flex items-start gap-3">
                                                <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                    <MessageCircle className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-medium">WhatsApp</p>
                                                    <a href={getWhatsappLink(contactPhone)} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline font-medium">
                                                        {contactPhone}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5" />
                        <span>
                            {appointment.type === 'GENERAL' && 'Consulta Geral'}
                            {appointment.type === 'URGENT' && 'Urgência'}
                            {appointment.type === 'FOLLOWUP' && 'Retorno'}
                            {!['GENERAL', 'URGENT', 'FOLLOWUP'].includes(appointment.type) && appointment.type}
                        </span>
                    </div>
                    
                    {isStaff && (
                        <div className="flex items-center gap-1.5">
                            <Banknote className="h-3.5 w-3.5" />
                            <span>R$ {Number(appointment.amount).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
                <Badge variant="outline" className={cn("px-3 py-1 font-medium flex items-center gap-1.5", status.color)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                </Badge>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                        <DropdownMenuItem onClick={() => onEdit(appointment)}>
                            Editar detalhes
                        </DropdownMenuItem>
                    )}
                    
                    {isDoctor && appointment.status === 'CONFIRMED' && (
                        <DropdownMenuItem onClick={() => onComplete(appointment)} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Finalizar Consulta
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                        onClick={() => onDelete(appointment.id)}
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        {isAdmin && (
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-2.5 text-[11px] text-slate-500 flex flex-wrap gap-x-6 gap-y-2 items-center">
                <div className="flex items-center gap-1.5" title="Data de criação do registro">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>Criado em: <span className="font-medium text-slate-700">{createdAtFormatted}</span></span>
                </div>
                
                <div className="flex items-center gap-1.5" title="ID único do sistema">
                    <Hash className="h-3 w-3 text-slate-400" />
                    <span className="font-mono">ID: {appointment.id}</span>
                </div>

                {appointment.payment?.id && (
                    <div className="flex items-center gap-1.5" title="Status do Pagamento">
                        <CreditCard className="h-3 w-3 text-slate-400" />
                        <span>
                            Pagamento: 
                            <span className={cn(
                                "ml-1 font-medium", 
                                appointment.payment.status === 'APPROVED' ? "text-green-600" : "text-yellow-600"
                            )}>
                                {appointment.payment.status === 'APPROVED' ? 'Aprovado' : appointment.payment.status}
                            </span>
                        </span>
                    </div>
                )}
            </div>
        )}
      </div>
    </Card>
  );
}