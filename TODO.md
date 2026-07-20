# TODO: Múltiples Imágenes + Carrusel Instagram

## Pasos completados:

- [x] 1. Modificar `prisma/schema.prisma` - Agregar `imagenes String[]` y mantener `imagen String?` legacy
- [x] 2. Modificar `server/api/posts/create.post.ts` - Soportar múltiples uploads a Cloudinary + guardar `imagen` legacy
- [x] 3. Modificar `server/api/posts/get.get.ts` - Normalizar imagen legacy → array `imagenes`
- [x] 4. Crear `components/ImageCarousel.vue` - Carrusel estilo Instagram completo
- [x] 5. Modificar `components/Feed.vue` - Integrar carrusel condicional
- [x] 6. Modificar `pages/postear.vue` - Input múltiple, previews, eliminar, límite 10
- [x] 7. Modificar `server/api/users/profile.get.ts` - Normalizar imágenes en perfil
- [x] 8. Modificar `pages/biografia.vue` - Integrar carrusel en perfil y mini galería
- [x] 9. Configurar output de Prisma en `prisma/generated/client` (evita bloqueo Windows)
- [x] 10. Actualizar `server/utils/prisma.ts` para importar desde nuevo output
- [x] 11. Regenerar cliente Prisma exitosamente
