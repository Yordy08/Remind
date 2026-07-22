import prisma from '../../utils/prisma'
import cloudinary from '../../utils/cloudinary'
import { getUserFromToken } from '../../utils/auth'
import { uploadGoogleDriveBackup } from '../../utils/googleDrive'

export default defineEventHandler(async (event) => {

  const user = getUserFromToken(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Debes iniciar sesión para publicar'
    })
  }

  const form = await readMultipartFormData(event)

  // 🔥 Soportar múltiples archivos
  const files = form?.filter(f => f.name === 'file') || []
  const categoria = form?.find(f => f.name === 'album')?.data.toString() || 'Recientes'
  const estado = form?.find(f => f.name === 'estado')?.data.toString() || 'PRIVADO'
  const taggedUserIdsRaw = form?.find(f => f.name === 'taggedUserIds')?.data.toString() || '[]'

  let taggedUserIds: string[] = []
  try {
    taggedUserIds = JSON.parse(taggedUserIdsRaw)
    if (!Array.isArray(taggedUserIds)) taggedUserIds = []
  } catch {
    taggedUserIds = []
  }

  if (!files.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Debes subir al menos una imagen'
    })
  }

  const MAX_IMAGES = 10
  if (files.length > MAX_IMAGES) {
    throw createError({
      statusCode: 400,
      statusMessage: `Máximo ${MAX_IMAGES} imágenes permitidas`
    })
  }

  try {

    // 🔥 1. Subir todas las imágenes a Cloudinary en paralelo
    const uploadPromises = files.map((file) => {
      return new Promise<{ cloudinaryUrl: string, backupUrl?: string, backupFileId?: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'entrenos/posts' },
          async (error, result) => {
            if (error) reject(error)
            else {
              const backup = await uploadGoogleDriveBackup({
                buffer: file.data,
                filename: file.filename || 'post-image.jpg',
                mimeType: file.type || 'image/jpeg',
                folderName: 'posts'
              })

              // @ts-ignore
              resolve({ cloudinaryUrl: result.secure_url, backupUrl: backup?.url, backupFileId: backup?.fileId })
            }
          }
        // @ts-ignore
        ).end(file.data)
      })
    })

    const uploadedImages = await Promise.all(uploadPromises)

    // Guardar cada imagen como foto independiente para moverla, marcarla y compartirla individualmente.
    const createdPosts = await Promise.all(uploadedImages.map((image) => {
      return prisma.post.create({
        data: {
          descripcion: '',
          categoria,
          imagenes: [image.cloudinaryUrl],
          imagen: image.cloudinaryUrl,
          imagenesBackup: image.backupUrl ? [image.backupUrl] : [],
          imagenesBackupFileIds: image.backupFileId ? [image.backupFileId] : [],
          imagenBackup: image.backupUrl,
          imagenBackupFileId: image.backupFileId,
          estado,
          userId: user.id
        }
      })
    }))

    // 🔥 3. Crear etiquetas de usuarios
    for (const userId of taggedUserIds) {
      await prisma.userTag.create({
        data: {
          userId,
          postId: createdPosts[0].id
        }
      })
    }

    return {
      success: true,
      posts: createdPosts,
      post: createdPosts[0]
    }

  } catch (error: any) {
    console.error('Error creando post:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Error creando post'
    })
  }

})
