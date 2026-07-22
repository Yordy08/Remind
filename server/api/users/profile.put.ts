import prisma from '../../utils/prisma'
import cloudinary from '../../utils/cloudinary'
import { getUserFromToken } from '../../utils/auth'
import { uploadGoogleDriveBackup } from '../../utils/googleDrive'

const getField = (formData: any[], name: string) => {
  const field = formData.find(item => item.name === name)
  return field?.data?.toString().trim() || ''
}

export default defineEventHandler(async (event) => {
  const tokenUser = getUserFromToken(event)

  if (!tokenUser) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const formData = await readMultipartFormData(event)

  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No se enviaron datos' })
  }

  const nombre = getField(formData, 'nombre')
  const apellido = getField(formData, 'apellido')
  const celular = getField(formData, 'celular')
  const bio = getField(formData, 'bio')
  const fechaNacimiento = getField(formData, 'fechaNacimiento')

  if (!nombre || !apellido || !celular) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre, apellido y celular son obligatorios' })
  }

  const data: any = {
    nombre,
    apellido,
    celular,
    bio: bio || null,
    fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null
  }

  const photo = formData.find(item => item.name === 'foto')

  if (photo?.data?.length) {
    const mimeType = photo.type || 'image/jpeg'
    const dataUri = `data:${mimeType};base64,${photo.data.toString('base64')}`

    try {
      const upload = await cloudinary.uploader.upload(dataUri, {
        folder: 'entrenos/profiles',
        resource_type: 'image'
      })

      data.foto = upload.secure_url

      const backup = await uploadGoogleDriveBackup({
        buffer: photo.data,
        filename: photo.filename || 'profile-photo.jpg',
        mimeType,
        folderName: 'profiles'
      })

      data.fotoBackupUrl = backup?.url
      data.fotoBackupFileId = backup?.fileId
    } catch (error: any) {
      console.error('Error subiendo foto de perfil:', error)
      throw createError({
        statusCode: 502,
        statusMessage: 'No se pudo subir la foto de perfil. Intenta con otra imagen.'
      })
    }
  }

  const user = await prisma.user.update({
    where: { id: tokenUser.id },
    data,
    select: {
      id: true,
      nombre: true,
      apellido: true,
      celular: true,
      email: true,
      foto: true,
      bio: true,
      fechaNacimiento: true,
      estado: true,
      role: true,
      reviewRequired: true,
      createdAt: true
    }
  })

  return JSON.parse(JSON.stringify({ success: true, user }))
})
