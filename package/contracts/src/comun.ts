import { z } from 'zod'

// Mensajes de error de Zod en español
z.config(z.locales.es())

// Respuesta paginada: sirve para cualquier lista
export const paginado = <T extends z.ZodType>(item: T) =>
  z.object({
    datos: z.array(item),
    siguiente: z.string().nullable(),
    total: z.number().int(),
  })

// El :id de la URL
export const idParam = z.object({
  id: z.uuid(),
})
export type IdParam = z.infer<typeof idParam>

// Cómo responde la API cuando los datos no son válidos (400)
export const errorValidacion = z.object({
  statusCode: z.literal(400),
  message: z.string(),
  errores: z.array(
    z.object({
      campo: z.string(),
      mensaje: z.string(),
    }),
  ),
})

// Cómo responde la API en los otros errores (404, 409)
export const errorSimple = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.string().optional(),
})
