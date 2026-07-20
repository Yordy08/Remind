import prisma from '../../utils/prisma'
import cloudinary from '../../utils/cloudinary'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData) {
      throw createError({ statusCode: 400, statusMessage: 'No se enviaron datos' })
    }

    const getField = (name: string) => {
      const field = formData.find(f => f.name === name)
      return field?.data?.toString() || ''
    }

    const nombre = getField('nombre')
    const apellido = getField('apellido')
    const celular = getField('celular')
    const email = getField('email')
    const password = getField('password')
    const fechaNacimiento = getField('fechaNacimiento')

    if (!nombre || !apellido || !celular || !email || !password) {
      throw createError({ statusCode: 400, statusMessage: 'Todos los campos son obligatorios' })
    }

    const paymentProofFile = formData.find(f => f.name === 'paymentProof')
    if (!paymentProofFile || !paymentProofFile.data || paymentProofFile.data.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Debes adjuntar la captura del pago' })
    }

    const existe = await prisma.user.findUnique({
      where: { email }
    })

    if (existe) {
      throw createError({ statusCode: 409, statusMessage: 'Correo ya registrado' })
    }

    let fotoUrl: string | undefined

    const fotoFile = formData.find(f => f.name === 'foto')
    if (fotoFile && fotoFile.data && fotoFile.data.length > 0) {
      const base64 = `data:${fotoFile.type};base64,${fotoFile.data.toString('base64')}`
      const uploadResult = await cloudinary.uploader.upload(base64, {
        folder: 'entrenos/profiles'
      })
      fotoUrl = uploadResult.secure_url
    }

    const paymentProofBase64 = `data:${paymentProofFile.type};base64,${paymentProofFile.data.toString('base64')}`
    const paymentProofUpload = await cloudinary.uploader.upload(paymentProofBase64, {
      folder: 'entrenos/payment-proofs'
    })

    const hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        celular,
        email,
        password: hash,
        foto: fotoUrl || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        estado: 'INACTIVO',
        role: 'USER',
        paymentProofUrl: paymentProofUpload.secure_url,
        subscriptionStatus: 'PENDING'
      }
    })

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', estado: 'ACTIVO' },
      select: { id: true }
    })

    await Promise.all(admins.map(admin => prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Nueva suscripción por aprobar',
        message: `${user.nombre} ${user.apellido} envió una captura de pago. Revisa el comprobante desde el dashboard y activa manualmente la cuenta.`
      }
    })))

    return {
      success: true,
      message: 'Tu suscripción está en verificación. Será aprobada durante los próximos 30 minutos.',
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        celular: user.celular,
        email: user.email,
        foto: user.foto,
        fechaNacimiento: user.fechaNacimiento,
        estado: user.estado,
        subscriptionStatus: user.subscriptionStatus
      }
    }
  } catch (error: any) {
    console.error('Error en registro:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({ statusCode: 500, statusMessage: error.message || 'Error interno del servidor' })
  }
})
