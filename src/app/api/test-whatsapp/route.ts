import { NextResponse } from "next/server";
import { sendAppointmentReminder } from "@/lib/whatsapp";

export async function GET(request: Request) {
  try {
    // ⚠️ COLOQUE SEU NÚMERO AQUI PARA TESTAR
    const seuNumero = "5511999999999"; 

    // Dispara o lembrete usando o template 'lembrete_consulta'
    const result = await sendAppointmentReminder(
      seuNumero,
      "Fulano de Teste", // Nome do Paciente {{1}}
      "10:00"            // Horário {{2}}
    );

    return NextResponse.json({ 
      success: true, 
      message: "Template de lembrete enviado!", 
      data: result 
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || error },
      { status: 500 }
    );
  }
}