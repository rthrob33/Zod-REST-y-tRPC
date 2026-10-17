import { z } from 'zod'
import { paginado } from './comun'

// Campos que se pueden escribir al crear o editar un libro
const campos = {
  titulo: z.string().trim().min(3).max(120),
  autor: z.string().trim().min(2).max(80),
  anio: z.number().int().min(1450).max(2100),
  paginas: z.number().int().positive().max(20000),
}

// POST: todo es obligatorio menos "leido" (por defecto false).
// strict() hace que un campo que no existe devuelva 400 en vez de ignorarse.
export const crearLibro = z
  .object({
    ...campos,
    leido: z.boolean().default(false),
  })
  .strict()
export type CrearLibro = z.infer<typeof crearLibro>

// PATCH: todos los campos son opcionales, pero hay que mandar al menos uno.
// "leido" se declara aparte para que el valor por defecto no se aplique solo.
export const actualizarLibro = z
  .object({
    ...campos,
    leido: z.boolean(),
  })
  .partial()
  .strict()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'Envía al menos un campo para actualizar',
  })
export type ActualizarLibro = z.infer<typeof actualizarLibro>

// Libro tal como lo devuelve la API
export const libro = z.object({
  id: z.uuid(),
  ...campos,
  leido: z.boolean(),
  creadoEn: z.iso.datetime(),
})
export type Libro = z.infer<typeof libro>

// Query string del listado: ?limite=5&cursor=...&buscar=...&orden=titulo
export const listarLibros = z
  .object({
    limite: z.coerce.number().int().min(1).max(50).default(10),
    cursor: z.string().optional(),
    buscar: z.string().trim().toLowerCase().optional(),
    orden: z.enum(['reciente', 'titulo']).default('reciente'),
  })
  .strict()
export type ListarLibros = z.infer<typeof listarLibros>

export const librosPagina = paginado(libro)
export type LibrosPagina = z.infer<typeof librosPagina>
