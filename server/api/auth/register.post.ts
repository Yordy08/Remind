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
      return field?.data?.toString().trim() || ''
    }

    const toDataUri = (file: NonNullable<typeof formData>[number]) => {
      const mimeType = file.type || 'image/jpeg'
      return `data:${mimeType};base64,${file.data.toString('base64')}`
    }

    const nombreCompleto = getField('nombreCompleto')
    const legacyNombre = getField('nombre')
    const legacyApellido = getField('apellido')
    const celular = getField('celular')
    const email = getField('email').toLowerCase()
    const password = getField('password')
    const fechaNacimiento = getField('fechaNacimiento')

    if ((!nombreCompleto && (!legacyNombre || !legacyApellido)) || !celular || !email || !password) {
      throw createError({ statusCode: 400, statusMessage: 'Todos los campos son obligatorios' })
    }

    const nameParts = nombreCompleto ? nombreCompleto.split(/\s+/).filter(Boolean) : []
    const nombre = nombreCompleto ? nameParts.shift() || '' : legacyNombre
    const apellido = nombreCompleto ? nameParts.join(' ') : legacyApellido

    if (!nombre || !apellido) {
      throw createError({ statusCode: 400, statusMessage: 'Ingresa nombre y apellido' })
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

    let paymentProofUrl = ''

    try {
      const paymentProofUpload = await cloudinary.uploader.upload(toDataUri(paymentProofFile), {
        folder: 'entrenos/payment-proofs',
        resource_type: 'image'
      })
      paymentProofUrl = paymentProofUpload.secure_url
    } catch (error) {
      console.error('Error subiendo comprobante de pago:', error)
      throw createError({
        statusCode: 502,
        statusMessage: 'No se pudo subir el comprobante de pago. Intenta con otra imagen o vuelve a intentarlo.'
      })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        celular,
        email,
        password: hash,
        foto: null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        estado: 'INACTIVO',
        role: 'USER',
        paymentProofUrl,
        subscriptionStatus: 'PENDING'
      }
    })

    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', estado: 'ACTIVO' },
        select: { id: true }
      })

      await Promise.all(admins.map(admin => prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Nueva suscripción por aprobar',
          message: `${user.nombre} ${user.apellido} envió una captura de pago. Revisa el comprobante y aprueba la cuenta desde esta notificación.`,
          imageUrl: user.paymentProofUrl,
          actionType: 'SUBSCRIPTION_APPROVAL',
          targetUserId: user.id
        }
      })))
    } catch (error) {
      console.error('Error creando notificación de suscripción:', error)
    }

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
