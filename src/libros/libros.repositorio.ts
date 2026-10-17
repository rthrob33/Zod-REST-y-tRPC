import { randomUUID } from 'crypto'
import { Injectable } from '@nestjs/common'
import type { ActualizarLibro, CrearLibro, Libro } from '../../package/contracts/src'

// Datos de ejemplo para que el listado ya tenga con qué paginar
const ejemplos: CrearLibro[] = [
  { titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', anio: 1967, paginas: 471, leido: true },
  { titulo: 'El Señor de los Anillos', autor: 'J. R. R. Tolkien', anio: 1954, paginas: 1178, leido: false },
  { titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', anio: 1605, paginas: 863, leido: false },
  { titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', anio: 1943, paginas: 96, leido: true },
  { titulo: 'Rayuela', autor: 'Julio Cortázar', anio: 1963, paginas: 600, leido: false },
  { titulo: 'La sombra del viento', autor: 'Carlos Ruiz Zafón', anio: 2001, paginas: 576, leido: true },
  { titulo: 'Pedro Páramo', autor: 'Juan Rulfo', anio: 1955, paginas: 124, leido: true },
  { titulo: 'Hombres de maíz', autor: 'Miguel Ángel Asturias', anio: 1949, paginas: 320, leido: false },
  { titulo: 'El túnel', autor: 'Ernesto Sabato', anio: 1948, paginas: 160, leido: false },
  { titulo: 'Crónica de una muerte anunciada', autor: 'Gabriel García Márquez', anio: 1981, paginas: 120, leido: true },
  { titulo: 'Ficciones', autor: 'Jorge Luis Borges', anio: 1944, paginas: 200, leido: false },
  { titulo: 'La casa de los espíritus', autor: 'Isabel Allende', anio: 1982, paginas: 433, leido: false },
]

// Guarda los libros en memoria (se reinician al apagar el servidor)
@Injectable()
export class LibrosRepositorio {
  private libros = new Map<string, Libro>()

  constructor() {
    ejemplos.forEach((datos, i) => {
      // Cada libro de ejemplo con una fecha distinta para poder ordenar
      const creadoEn = new Date(Date.UTC(2026, 0, 1 + i)).toISOString()
      this.guardar(datos, creadoEn)
    })
  }

  listar(): Libro[] {
    return [...this.libros.values()]
  }

  buscarPorId(id: string): Libro | undefined {
    return this.libros.get(id)
  }

  // Devuelve el libro que ya tiene ese título (ignorando mayúsculas), si existe
  buscarPorTitulo(titulo: string): Libro | undefined {
    const buscado = titulo.toLowerCase()
    return this.listar().find((libro) => libro.titulo.toLowerCase() === buscado)
  }

  crear(datos: CrearLibro): Libro {
    return this.guardar(datos, new Date().toISOString())
  }

  actualizar(id: string, cambios: ActualizarLibro): Libro | undefined {
    const actual = this.libros.get(id)
    if (!actual) return undefined

    const nuevo: Libro = { ...actual, ...cambios }
    this.libros.set(id, nuevo)
    return nuevo
  }

  borrar(id: string): boolean {
    return this.libros.delete(id)
  }

  private guardar(datos: CrearLibro, creadoEn: string): Libro {
    const libro: Libro = { id: randomUUID(), ...datos, creadoEn }
    this.libros.set(libro.id, libro)
    return libro
  }
}
