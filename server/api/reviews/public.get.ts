import prisma from '../../utils/prisma'

export default defineEventHandler(async () => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          foto: true
        }
      }
    }
  })

  return JSON.parse(JSON.stringify({ success: true, reviews }))
})
