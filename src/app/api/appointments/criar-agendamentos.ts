import { Router, Request, Response } from "express"
import {
  PrismaClient,
  AppointmentStatus,
  PaymentStatus,
  ConsultationType, 
} from "../../../generated/prisma"

const prisma = new PrismaClient()
export const router = Router()

// ----------------- Helpers -----------------
function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number)
  return hh * 60 + mm
}

// colisão correta entre [aStart,aEnd) e [bStart,bEnd) evitando as
function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart
}

// (opcional) caso queiramos usar por esse metodo ou nao 
function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  )
}

// checa se o dia da semana está habilitado nas BusinessHours
function isDayEnabled(bh: any, date: Date) {
  const wd = date.getUTCDay() 
  const map: Record<number, boolean> = {
    0: bh.sundayEnabled,
    1: bh.mondayEnabled,
    2: bh.tuesdayEnabled,
    3: bh.wednesdayEnabled,
    4: bh.thursdayEnabled,
    5: bh.fridayEnabled,
    6: bh.saturdayEnabled,
  }
  return !!map[wd]
}

async function getBusinessHoursOrThrow() {
  const bh = await prisma.businessHours.findFirst()
  if (!bh) throw new Error("BusinessHours não configurado")
  return bh
}

// Troque por chamada real à SDK/API do MP (retorne sandbox_init_point/init_point reais)
async function createMercadoPagoPreference(input: {
  appointmentId: string
  amount: number
  description: string
  successUrl?: string
  pendingUrl?: string
  failureUrl?: string
}) {
  return {
    mercadoPagoId: `mp_${input.appointmentId}`,
    preferenceId: `pref_${input.appointmentId}`,
    init_point: `https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref_${input.appointmentId}`,
  }
}

// ----------------- Tipagem do req.user -----------------
type ReqUser = { id: string }
declare global {
  namespace Express {
    interface Request {
      user?: ReqUser
    }
  }
}

// ----------------- Rota: POST /api/appointments -----------------
router.post("/api/appointments", async (req: Request, res: Response) => {
  try {
    const {
      // dados do agendamento
      date,
      startTime,
      endTime,
      type, 
      patientName,
      patientEmail,
      patientPhone,
      notes,
      // pagamento
      amount,        
      currency,
      description,
      successUrl,
      pendingUrl,
      failureUrl,
    } = req.body ?? {}

    // --- Auth ---
    if (!req.user?.id) return res.status(401).json({ error: "unauthorized" })

    // --- Validação básica ---
    if (!date || !startTime || !endTime || !patientName) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: date, startTime, endTime, patientName" })
    }
    if (
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      !startTime.includes(":") ||
      !endTime.includes(":")
    ) {
      return res.status(400).json({ error: "startTime/endTime devem ser strings 'HH:MM'" })
    }

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return res.status(400).json({ error: "data inválida" })

    const startMin = toMinutes(startTime)
    const endMin = toMinutes(endTime)
    if (!(endMin > startMin)) {
      return res.status(400).json({ error: "intervalo de horário inválido" })
    }

    // --- BusinessHours ---
    const bh = await getBusinessHoursOrThrow()

    if (!isDayEnabled(bh, dateObj)) {
      return res.status(409).json({ error: "dia indisponível segundo BusinessHours" })
    }

    const bhStart = toMinutes(bh.startTime) 
    const bhEnd = toMinutes(bh.endTime)     
    if (startMin < bhStart || endMin > bhEnd) {
      return res.status(409).json({ error: "fora do horário de funcionamento" })
    }

    if (bh.lunchBreakEnabled && bh.lunchStartTime && bh.lunchEndTime) {
      const lStart = toMinutes(bh.lunchStartTime)
      const lEnd = toMinutes(bh.lunchEndTime)
      if (overlap(startMin, endMin, lStart, lEnd)) {
        return res.status(409).json({ error: "intervalo colide com horário de almoço" })
      }
    }

    const expected = bh.appointmentDuration ?? 30 
    if (endMin - startMin !== expected) {
      return res.status(400).json({ error: "duration_mismatch", expectedMin: expected })
    }

    // --- Disponibilidade (agenda global) ---
    const sameDayStart = new Date(
      Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 0, 0, 0)
    )
    const sameDayEnd = new Date(
      Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 23, 59, 59)
    )

    const dayAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: sameDayStart, lte: sameDayEnd },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
        },
      },
      select: { id: true, startTime: true, endTime: true },
    })

    const hasCollision = dayAppointments.some((a) =>
      overlap(startMin, endMin, toMinutes(a.startTime), toMinutes(a.endTime))
    )
    if (hasCollision) {
      return res.status(409).json({ error: "time_unavailable" })
    }

    // --- Validação do tipo (ConsultationType) ---
    let typeValue: ConsultationType = ConsultationType.GENERAL
    if (typeof type === "string") {
      const allowed = Object.values(ConsultationType)
      if (allowed.includes(type as ConsultationType)) {
        typeValue = type as ConsultationType
      } // se vier inválido, mantém GENERAL
    }

    // --- Cria Appointment (PENDING) ---
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user.id,
        date: dateObj, 
        startTime,
        endTime,
        type: typeValue, 
        status: AppointmentStatus.PENDING,
        patientName,
        patientEmail,
        patientPhone,
        notes,
      },
    })

    // --- amount pode vir como string; normalizar para number ---
    const normalizedAmount =
      typeof amount === "number"
        ? amount
        : typeof amount === "string"
        ? Number(amount)
        : NaN

    // --- Validação mínima do pagamento ---
    if (!Number.isFinite(normalizedAmount) || !description) {
      return res
        .status(400)
        .json({ error: "amount (número) e description são obrigatórios para o pagamento" })
    }

    // --- Cria preferência (mock) e Payment (PENDING) ---
    const pref = await createMercadoPagoPreference({
      appointmentId: appointment.id,
      amount: normalizedAmount,
      description,
      successUrl,
      pendingUrl,
      failureUrl,
    })

    const payment = await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: normalizedAmount,        
        currency: currency ?? "BRL",
        description,
        status: PaymentStatus.PENDING,
        mercadoPagoId: pref.mercadoPagoId,
        preferenceId: pref.preferenceId,
        payerEmail: patientEmail ?? null,
        payerName: patientName ?? null,
        payerPhone: patientPhone ?? null,
        successUrl: successUrl ?? null,
        pendingUrl: pendingUrl ?? null,
        failureUrl: failureUrl ?? null,
      },
    })

    // --- Resposta ---
    return res.status(201).json({
      appointment,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,          
        currency: payment.currency,
        preferenceId: payment.preferenceId,
        init_point: pref.init_point,     // troque pelo real quando integrar o MP
      },
    })
  } catch (e: any) {
    console.error(e)
    if (String(e?.message || "").includes("BusinessHours")) {
      return res.status(500).json({ error: "BusinessHours não configurado" })
    }
    return res.status(500).json({ error: "internal_error" })
  }
})
