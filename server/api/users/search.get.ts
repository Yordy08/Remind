import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim()

  if (!q || q.length < 2) {
    return { users: [] }
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { nombre: { contains: q, mode: 'insensitive' } },
        { apellido: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      foto: true
    },
    take: 10
  })

  return { users }
})
