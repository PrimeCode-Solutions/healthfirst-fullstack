import { NextFunction, Router ,Request, Response, } from "express"
import { PrismaClient, AppointmentStatus, UserRole } from "../../../generated/prisma"

const prisma = new PrismaClient()
export const router = Router()

// Middleware que garante que o usuário autenticado é ADMIN
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "unauthorized" })

    // busca o usuário logado no banco
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    })

    // se não for ADMIN → 403 forbidden
    if (!me || me.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "forbidden" }) //logado mas sem permissao
    }

    next() 
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "internal_error" })
  }
}

router.get("/api/appointments", requireAdmin, async (req, res) => {
  try {
    const {
      status,      
      dateStart,   
      dateEnd,     
      userId,      
      q,           
      page = "1",
      pageSize = "20",
    } = req.query as Record<string, string>

    // paginação segura (limite de 100 itens por página)
    const p = Math.max(parseInt(page, 10) || 1, 1)
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100)
    const skip = (p - 1) * ps
    const take = ps

    // monta objeto de filtro pro Prisma
    const where: any = {}

    // filtro por status (valida se é um enum válido)
    if (status) {
      const allowed = Object.values(AppointmentStatus) as string[]
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: "invalid_status", allowed })
      }
      where.status = status
    }

    // filtro por usuário
    if (userId) where.userId = userId

    // filtro por data
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

    if (q && q.trim()) {
      where.patientName = { contains: q.trim(), mode: "insensitive" }
    }

    // consulta total e itens paginados em paralelo
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
          userId: true,
          // traz informações básicas do usuário
          user: { select: { id: true, name: true, email: true } },
          // traz dados do pagamento relacionado
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              preferenceId: true,
              mercadoPagoId: true,
              paidAt: true,
            },
          },
        },
      }),
    ])

    // calcula número total de páginas
    const pageCount = Math.ceil(total / ps)

    return res.json({
      meta: { total, page: p, pageSize: ps, pageCount },
      filters: { status, dateStart, dateEnd, userId, q },
      items,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "internal_error" })
  }
})
