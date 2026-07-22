import prisma from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const reactions = await prisma.dailyPhraseInteraction.findMany({
    where: {
      action: { in: ['LOVE', 'THANKS'] }
    },
    orderBy: { reactedAt: 'desc' },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          foto: true
        }
      }
    }
  })

  return JSON.parse(JSON.stringify({ success: true, reactions }))
})
