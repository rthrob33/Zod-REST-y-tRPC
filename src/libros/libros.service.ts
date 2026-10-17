import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type {
  ActualizarLibro,
  CrearLibro,
  Libro,
  LibrosPagina,
  ListarLibros,
} from '../../package/contracts/src'
import { LibrosRepositorio } from './libros.repositorio'

// Las reglas de negocio viven aquí. Las usan REST y tRPC por igual.
@Injectable()
export class LibrosService {
  constructor(@Inject(LibrosRepositorio) private readonly repo: LibrosRepositorio) {}

  listar(q: ListarLibros): LibrosPagina {
    let lista = this.repo.listar()

    if (q.buscar) {
      const texto = q.buscar
      lista = lista.filter(
        (l) => l.titulo.toLowerCase().includes(texto) || l.autor.toLowerCase().includes(texto),
      )
    }

    lista.sort((a, b) => {
      if (q.orden === 'titulo') {
        return a.titulo.localeCompare(b.titulo, 'es') || a.id.localeCompare(b.id)
      }
      // "reciente": los más nuevos primero
      return b.creadoEn.localeCompare(a.creadoEn) || a.id.localeCompare(b.id)
    })

    // El cursor es el id del último libro de la página anterior
    let inicio = 0
    if (q.cursor) {
      const posicion = lista.findIndex((l) => l.id === q.cursor)
      if (posicion === -1) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Datos inválidos',
          errores: [{ campo: 'cursor', mensaje: 'El cursor no existe en esta búsqueda' }],
        })
      }
      inicio = posicion + 1
    }

    const datos = lista.slice(inicio, inicio + q.limite)
    const hayMas = inicio + q.limite < lista.length
    const ultimo = datos[datos.length - 1]

    return {
      datos,
      siguiente: hayMas && ultimo ? ultimo.id : null,
      total: lista.length,
    }
  }

  obtener(id: string): Libro {
    const libro = this.repo.buscarPorId(id)
    if (!libro) {
      throw new NotFoundException(`El libro ${id} no existe`)
    }
    return libro
  }

  crear(datos: CrearLibro): Libro {
    if (this.repo.buscarPorTitulo(datos.titulo)) {
      throw new ConflictException('Ya existe un libro con ese título')
    }
    return this.repo.crear(datos)
  }

  actualizar(id: string, cambios: ActualizarLibro): Libro {
    this.obtener(id) // si no existe, lanza 404

    if (cambios.titulo) {
      const repetido = this.repo.buscarPorTitulo(cambios.titulo)
      if (repetido && repetido.id !== id) {
        throw new ConflictException('Ya existe un libro con ese título')
      }
    }

    // obtener() ya comprobó que existe, por eso el "as Libro"
    return this.repo.actualizar(id, cambios) as Libro
  }

  borrar(id: string): void {
    this.obtener(id) // si no existe, lanza 404
    this.repo.borrar(id)
  }
}
