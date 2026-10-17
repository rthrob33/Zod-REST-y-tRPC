import { z } from 'zod'
import {
  actualizarLibro,
  crearLibro,
  errorSimple,
  errorValidacion,
  libro,
  librosPagina,
  listarLibros,
} from '../../package/contracts/src'

// Convierte un esquema de Zod a JSON Schema (así la documentación sale del contrato)
function esquemaJson(esquema: z.ZodType, io: 'input' | 'output' = 'output') {
  const resultado = z.toJSONSchema(esquema, { io, target: 'draft-2020-12' }) as Record<string, unknown>
  delete resultado.$schema
  return resultado
}

const ref = (nombre: string) => ({ $ref: `#/components/schemas/${nombre}` })

const jsonDe = (nombre: string) => ({ 'application/json': { schema: ref(nombre) } })

const respuestaError = (descripcion: string, esquema: string) => ({
  description: descripcion,
  content: jsonDe(esquema),
})

const parametroId = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Id del libro (UUID)',
  schema: { type: 'string', format: 'uuid' },
}

// Los parámetros del listado salen del esquema listarLibros
function parametrosDelListado() {
  const propiedades = (esquemaJson(listarLibros).properties ?? {}) as Record<string, object>
  return Object.entries(propiedades).map(([nombre, schema]) => ({
    name: nombre,
    in: 'query',
    required: false,
    schema,
  }))
}

export function crearDocumento() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'API de Libros',
      version: '1.0.0',
      description:
        'Catálogo de libros. REST en /api/v1 y la misma lógica expuesta con tRPC en /trpc.\n\n' +
        'Autor: Roberth Melendez (carnet 2500461).',
    },
    servers: [{ url: 'http://localhost:3000' }],
    tags: [{ name: 'Libros' }],
    paths: {
      '/api/v1/libros': {
        get: {
          tags: ['Libros'],
          summary: 'Lista los libros con paginación por cursor',
          description: 'Si "siguiente" no es null, mándalo como ?cursor= para pedir la página que sigue.',
          parameters: parametrosDelListado(),
          responses: {
            '200': { description: 'Página de libros', content: jsonDe('LibrosPagina') },
            '400': respuestaError('Parámetros inválidos', 'ErrorValidacion'),
          },
        },
        post: {
          tags: ['Libros'],
          summary: 'Crea un libro',
          requestBody: { required: true, content: jsonDe('CrearLibro') },
          responses: {
            '201': {
              description: 'Libro creado',
              headers: {
                Location: { description: 'URL del libro nuevo', schema: { type: 'string' } },
              },
              content: jsonDe('Libro'),
            },
            '400': respuestaError('Datos inválidos', 'ErrorValidacion'),
            '409': respuestaError('Ya existe un libro con ese título', 'ErrorSimple'),
          },
        },
      },
      '/api/v1/libros/{id}': {
        get: {
          tags: ['Libros'],
          summary: 'Busca un libro por id',
          parameters: [parametroId],
          responses: {
            '200': { description: 'El libro', content: jsonDe('Libro') },
            '400': respuestaError('El id no es un UUID', 'ErrorValidacion'),
            '404': respuestaError('No existe', 'ErrorSimple'),
          },
        },
        patch: {
          tags: ['Libros'],
          summary: 'Actualiza uno o varios campos de un libro',
          parameters: [parametroId],
          requestBody: { required: true, content: jsonDe('ActualizarLibro') },
          responses: {
            '200': { description: 'Libro actualizado', content: jsonDe('Libro') },
            '400': respuestaError('Datos inválidos', 'ErrorValidacion'),
            '404': respuestaError('No existe', 'ErrorSimple'),
            '409': respuestaError('Ya existe un libro con ese título', 'ErrorSimple'),
          },
        },
        delete: {
          tags: ['Libros'],
          summary: 'Borra un libro',
          parameters: [parametroId],
          responses: {
            '204': { description: 'Borrado, sin contenido' },
            '400': respuestaError('El id no es un UUID', 'ErrorValidacion'),
            '404': respuestaError('No existe', 'ErrorSimple'),
          },
        },
      },
    },
    components: {
      schemas: {
        Libro: esquemaJson(libro),
        // Para lo que se envía uso "input": así "leido" no sale como obligatorio
        CrearLibro: esquemaJson(crearLibro, 'input'),
        ActualizarLibro: esquemaJson(actualizarLibro, 'input'),
        LibrosPagina: esquemaJson(librosPagina),
        ErrorValidacion: esquemaJson(errorValidacion),
        ErrorSimple: esquemaJson(errorSimple),
      },
    },
  }
}
