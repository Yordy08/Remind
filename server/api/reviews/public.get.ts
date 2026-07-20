import prisma from '../../utils/prisma'

export default defineEventHandler(async () => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      user: {
        select: {
          nombre: true,
          apellido: true,
          foto: true
        }
      }
    }
  })

  return JSON.parse(JSON.stringify({ success: true, reviews }))
})
