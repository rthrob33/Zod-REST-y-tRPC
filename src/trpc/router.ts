import { HttpException } from '@nestjs/common'
import { initTRPC, TRPCError } from '@trpc/server'
import { crearLibro, idParam, listarLibros } from '../../package/contracts/src'
import type { LibrosService } from '../libros/libros.service'

const t = initTRPC.create()

// El servicio lanza errores de Nest (404, 409...). Aquí los paso a errores de tRPC.
function aErrorTRPC(error: unknown): never {
  if (error instanceof HttpException) {
    const estado = error.getStatus()
    const codigo =
      estado === 404 ? 'NOT_FOUND' : estado === 409 ? 'CONFLICT' : estado === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR'
    throw new TRPCError({ code: codigo, message: error.message })
  }
  throw error
}

function ejecutar<T>(accion: () => T): T {
  try {
    return accion()
  } catch (error) {
    return aErrorTRPC(error)
  }
}

// Recibe el mismo servicio que usa REST, así los dos comparten los datos
export function crearRouter(servicio: LibrosService) {
  return t.router({
    libros: t.router({
      // Consulta: lista paginada (usa el mismo esquema que REST)
      listar: t.procedure.input(listarLibros).query(({ input }) => ejecutar(() => servicio.listar(input))),

      // Consulta: un libro por id
      obtener: t.procedure.input(idParam).query(({ input }) => ejecutar(() => servicio.obtener(input.id))),

      // Mutación: crear un libro
      crear: t.procedure.input(crearLibro).mutation(({ input }) => ejecutar(() => servicio.crear(input))),
    }),
  })
}

export type AppRouter = ReturnType<typeof crearRouter>
