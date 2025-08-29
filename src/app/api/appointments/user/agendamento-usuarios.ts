import { Router, Request, Response, NextFunction } from "express"
import {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  ConsultationType,
  UserRole,
  PaymentStatus,
} from "../../../../generated/prisma"

const prisma = new PrismaClient()
export const router = Router()

function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number)
  return hh * 60 + mm
}
function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  // colisão se (aStart < bEnd) && (aEnd > bStart)
  return aStart < bEnd && aEnd > bStart
}
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
async function validateSlotOr409(params: {
  dateIso: string
  startTime: string
  endTime: string
  excludeAppointmentId?: string
}) {
  // datas/horários
  const { dateIso, startTime, endTime, excludeAppointmentId } = params
  const dateObj = new Date(dateIso)
  if (isNaN(dateObj.getTime())) return { error: { code: 400, msg: "data inválida" } }
  if (
    typeof startTime !== "string" ||
    typeof endTime !== "string" ||
    !startTime.includes(":") ||
    !endTime.includes(":")
  ) {
    return { error: { code: 400, msg: "startTime/endTime devem ser 'HH:MM'" } }
  }
  const startMin = toMinutes(startTime)
  const endMin = toMinutes(endTime)
  if (!(endMin > startMin)) return { error: { code: 400, msg: "intervalo de horário inválido" } }

  // BusinessHours(horarios de trabalho)
  const bh = await getBusinessHoursOrThrow()
  if (!isDayEnabled(bh, dateObj)) {
    return { error: { code: 409, msg: "dia indisponível segundo o Horario de trabalho" } }
  }
  const bhStart = toMinutes(bh.startTime)
  const bhEnd = toMinutes(bh.endTime)
  if (startMin < bhStart || endMin > bhEnd) {
    return { error: { code: 409, msg: "fora do horário de funcionamento" } }
  }
  if (bh.lunchBreakEnabled && bh.lunchStartTime && bh.lunchEndTime) {
    const lStart = toMinutes(bh.lunchStartTime)
    const lEnd = toMinutes(bh.lunchEndTime)
    if (overlap(startMin, endMin, lStart, lEnd)) {
      return { error: { code: 409, msg: "intervalo colide com horário de almoço" } }
    }
  }
  const expected = bh.appointmentDuration ?? 30
  if (endMin - startMin !== expected) {
    return { error: { code: 400, msg: "duration_mismatch", expectedMin: expected } }
  }

  // 3) Disponibilidade (agenda global)
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
      ...(excludeAppointmentId ? { NOT: { id: excludeAppointmentId } } : {}),
    },
    select: { id: true, startTime: true, endTime: true },
  })
  const hasCollision = dayAppointments.some((a) =>
    overlap(startMin, endMin, toMinutes(a.startTime), toMinutes(a.endTime))
  )
  if (hasCollision) return { error: { code: 409, msg: "time_unavailable" } }

  return {
    ok: {
      dateObj,
      startMin,
      endMin,
    },
  }
}
// req user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role?: string }
    }
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "unauthorized" })
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    })
    if (!me || me.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "forbidden" })
    }
    next()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "internal_error" })
  }
}

router.get(
  "/api/appointments/user/:userId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params
      const { status, dateStart, dateEnd, page = "1", pageSize = "20" } = req.query as Record<
        string,
        string | undefined
      >

      if (!req.user?.id) return res.status(401).json({ error: "unauthorized" })
      const me = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true },
      })
      const isAdmin = me?.role === UserRole.ADMIN
      if (!isAdmin && req.user.id !== userId) {
        return res.status(403).json({ error: "forbidden" })
      }

      // paginação
      const p = Math.max(parseInt(page ?? "1", 10) || 1, 1)
      const psRaw = parseInt(pageSize ?? "20", 10) || 20
      const ps = Math.min(Math.max(psRaw, 1), 100)
      const skip = (p - 1) * ps
      const take = ps

      // where
      const where: Prisma.AppointmentWhereInput = { userId }
      if (status) {
        const allowed = Object.values(AppointmentStatus)
        if (!allowed.includes(status as AppointmentStatus)) {
          return res.status(400).json({ error: "invalid_status", allowed })
        }
        where.status = status as AppointmentStatus
      }
      if (dateStart || dateEnd) {
        const ds = dateStart ? new Date(dateStart) : undefined
        const de = dateEnd ? new Date(dateEnd) : undefined
        if ((ds && isNaN(ds.getTime())) || (de && isNaN(de.getTime()))) {
          return res.status(400).json({ error: "invalid_date_range" })
        }
        where.date = {}
        if (ds) where.date.gte = ds
        if (de) where.date.lte = de
      }

      const [total, items] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.findMany({
          where,
          orderBy: [{ date: "desc" }, { startTime: "asc" }],
          skip,
          take,
          select: {
            id: true,
            status: true,
            date: true,
            startTime: true,
            endTime: true,
            type: true,
            patientName: true,
            patientEmail: true,
            patientPhone: true,
            createdAt: true,
            updatedAt: true,
            payment: {
              select: {
                id: true,
                status: true,
                amount: true,
                currency: true,
                preferenceId: true,
                paidAt: true,
              },
            },
          },
        }),
      ])

      const pageCount = Math.ceil(total / ps)
      return res.json({ meta: { total, page: p, pageSize: ps, pageCount }, items })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ error: "internal_error" })
    }
  }
)

router.put("/api/appointments/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      date,           
      startTime,
      endTime,  
      type,           
      status,         
      patientName,
      patientEmail,
      patientPhone,
      notes,
    } = req.body ?? {}

    // busca atual
    const current = await prisma.appointment.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ error: "not_found" })
    if (current.status === AppointmentStatus.CANCELLED) {
      return res.status(400).json({ error: "already_cancelled" })
    }

    // prepara novos valores (default = atuais)
    let newDateIso = date ?? current.date.toISOString()
    let newStart = startTime ?? current.startTime
    let newEnd = endTime ?? current.endTime

    // se mexer em data/hora, revalidar slot
    if (date || startTime || endTime) {
      const check = await validateSlotOr409({
        dateIso: newDateIso,
        startTime: newStart,
        endTime: newEnd,
        excludeAppointmentId: id,
      })
      if ("error" in check) {
        const { code, msg, expectedMin } = check.error as any
        return res.status(code).json(expectedMin ? { error: msg, expectedMin } : { error: msg })
      }
    }

    // valida tipo (ConsultationType)
    let newType: ConsultationType | undefined = undefined
    if (typeof type === "string") {
      const allowed = Object.values(ConsultationType)
      if (!allowed.includes(type as ConsultationType)) {
        return res.status(400).json({ error: "invalid_type", allowed })
      }
      newType = type as ConsultationType
    }

    // valida status (AppointmentStatus)
    let newStatus: AppointmentStatus | undefined = undefined
    if (typeof status === "string") {
      const allowed = Object.values(AppointmentStatus)
      if (!allowed.includes(status as AppointmentStatus)) {
        return res.status(400).json({ error: "invalid_status", allowed })
      }
      newStatus = status as AppointmentStatus
    }

    // aplica update
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        date: new Date(newDateIso),
        startTime: newStart,
        endTime: newEnd,
        type: newType ?? current.type,
        status: newStatus ?? current.status,
        patientName: patientName ?? current.patientName,
        patientEmail: patientEmail ?? current.patientEmail,
        patientPhone: patientPhone ?? current.patientPhone,
        notes: notes ?? current.notes,
      },
    })

    return res.json(updated)
  } catch (e) {
    console.error(e)
    if (String(e?.message || "").includes("BusinessHours")) {
      return res.status(500).json({ error: "BusinessHours não configurado" })
    }
    return res.status(500).json({ error: "internal_error" })
  }
})

router.delete("/api/appointments/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { payment: true },
    })
    if (!appt) return res.status(404).json({ error: "not_found" })
    if (appt.status === AppointmentStatus.CANCELLED) {
      return res.status(204).end()
    }

    // Atualiza pagamento local (se existir)
    if (appt.payment) {
      await prisma.payment.update({
        where: { id: appt.payment.id },
        data: { status: PaymentStatus.CANCELLED },
      })
    }

    // Cancela o agendamento
    await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    })

    return res.status(204).end()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "internal_error" })
  }
})
