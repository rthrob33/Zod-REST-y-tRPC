import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { configurarApp } from '../src/configurar'

describe('API de libros', () => {
  let app: INestApplication
  let http: ReturnType<typeof request>

  const base = '/api/v1/libros'
  const libroValido = { titulo: 'Libro de prueba', autor: 'Roberth', anio: 2026, paginas: 100 }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = modulo.createNestApplication()
    configurarApp(app)
    await app.init()
    http = request(app.getHttpServer())
  })

  afterAll(async () => {
    await app.close()
  })

  describe('validación con ZodPipe (400)', () => {
    it('rechaza un título demasiado corto', async () => {
      const res = await http.post(base).send({ ...libroValido, titulo: 'ab' })
      expect(res.status).toBe(400)
      expect(res.body.errores[0].campo).toBe('titulo')
    })

    it('rechaza un campo que no existe', async () => {
      const res = await http.post(base).send({ ...libroValido, esAdmin: true })
      expect(res.status).toBe(400)
      expect(res.body.errores[0].campo).toBe('esAdmin')
    })

    it('rechaza un tipo incorrecto', async () => {
      const res = await http.post(base).send({ ...libroValido, paginas: 'muchas' })
      expect(res.status).toBe(400)
    })

    it('rechaza un cuerpo vacío en PATCH', async () => {
      const lista = await http.get(base)
      const res = await http.patch(`${base}/${lista.body.datos[0].id}`).send({})
      expect(res.status).toBe(400)
    })

    it('rechaza un id que no es UUID', async () => {
      const res = await http.get(`${base}/123`)
      expect(res.status).toBe(400)
    })

    it('rechaza un límite fuera de rango', async () => {
      const res = await http.get(`${base}?limite=500`)
      expect(res.status).toBe(400)
    })

    it('rechaza un parámetro de búsqueda desconocido', async () => {
      const res = await http.get(`${base}?color=rojo`)
      expect(res.status).toBe(400)
    })
  })

  describe('REST', () => {
    let id: string

    it('POST crea el libro: 201 y Location', async () => {
      const res = await http.post(base).send(libroValido)
      expect(res.status).toBe(201)
      expect(res.body.leido).toBe(false)
      expect(res.headers.location).toBe(`${base}/${res.body.id}`)
      id = res.body.id
    })

    it('POST con un título repetido: 409', async () => {
      const res = await http.post(base).send({ ...libroValido, titulo: 'LIBRO DE PRUEBA' })
      expect(res.status).toBe(409)
    })

    it('GET por id: 200', async () => {
      const res = await http.get(`${base}/${id}`)
      expect(res.status).toBe(200)
      expect(res.body.titulo).toBe('Libro de prueba')
    })

    it('GET de un id que no existe: 404', async () => {
      const res = await http.get(`${base}/00000000-0000-4000-8000-000000000000`)
      expect(res.status).toBe(404)
    })

    it('PATCH cambia solo lo enviado: 200', async () => {
      const res = await http.patch(`${base}/${id}`).send({ leido: true })
      expect(res.status).toBe(200)
      expect(res.body.leido).toBe(true)
      expect(res.body.titulo).toBe('Libro de prueba')
    })

    it('PATCH sin tocar "leido" no lo reinicia', async () => {
      const res = await http.patch(`${base}/${id}`).send({ paginas: 250 })
      expect(res.status).toBe(200)
      expect(res.body.paginas).toBe(250)
      expect(res.body.leido).toBe(true)
    })

    it('PATCH con el título de otro libro: 409', async () => {
      const res = await http.patch(`${base}/${id}`).send({ titulo: 'Rayuela' })
      expect(res.status).toBe(409)
    })

    it('DELETE: 204 y después 404', async () => {
      const borrar = await http.delete(`${base}/${id}`)
      expect(borrar.status).toBe(204)
      const otra = await http.get(`${base}/${id}`)
      expect(otra.status).toBe(404)
    })
  })

  describe('paginación', () => {
    it('recorre todas las páginas sin repetir libros', async () => {
      const ids: string[] = []
      let cursor: string | null = null
      let paginas = 0

      do {
        const url: string = `${base}?limite=5&orden=titulo` + (cursor ? `&cursor=${cursor}` : '')
        const res = await http.get(url)
        expect(res.status).toBe(200)
        expect(res.body.datos.length).toBeLessThanOrEqual(5)
        ids.push(...res.body.datos.map((l: { id: string }) => l.id))
        cursor = res.body.siguiente
        paginas++
      } while (cursor)

      expect(paginas).toBe(3) // 12 libros de ejemplo en páginas de 5
      expect(new Set(ids).size).toBe(12)
    })

    it('buscar filtra por título o autor', async () => {
      const res = await http.get(`${base}?buscar=GARCÍA`)
      expect(res.status).toBe(200)
      expect(res.body.total).toBe(2)
    })

    it('un cursor que no existe: 400', async () => {
      const res = await http.get(`${base}?cursor=no-existe`)
      expect(res.status).toBe(400)
    })
  })

  describe('tRPC', () => {
    it('consulta: libros.listar', async () => {
      const entrada = encodeURIComponent(JSON.stringify({ limite: 3 }))
      const res = await http.get(`/trpc/libros.listar?input=${entrada}`)
      expect(res.status).toBe(200)
      expect(res.body.result.data.datos).toHaveLength(3)
    })

    it('mutación: libros.crear', async () => {
      const res = await http
        .post('/trpc/libros.crear')
        .send({ titulo: 'Creado con tRPC', autor: 'Roberth', anio: 2026, paginas: 50 })
      expect(res.status).toBe(200)
      expect(res.body.result.data.titulo).toBe('Creado con tRPC')
    })

    it('la mutación valida con el mismo contrato: 400', async () => {
      const res = await http.post('/trpc/libros.crear').send({ titulo: 'ab' })
      expect(res.status).toBe(400)
    })

    it('un libro creado por tRPC se ve en REST (comparten servicio)', async () => {
      const res = await http.get(`${base}?buscar=tRPC`)
      expect(res.body.total).toBe(1)
    })

    it('libros.obtener de un id que no existe: 404', async () => {
      const entrada = encodeURIComponent(JSON.stringify({ id: '00000000-0000-4000-8000-000000000000' }))
      const res = await http.get(`/trpc/libros.obtener?input=${entrada}`)
      expect(res.status).toBe(404)
    })
  })

  describe('documentación', () => {
    it('/docs muestra Swagger UI', async () => {
      const res = await http.get('/docs/')
      expect(res.status).toBe(200)
      expect(res.text).toContain('swagger-ui')
    })

    it('/openapi.json describe los 5 endpoints', async () => {
      const res = await http.get('/openapi.json')
      expect(res.status).toBe(200)
      expect(res.body.openapi).toBe('3.1.0')
      expect(Object.keys(res.body.paths['/api/v1/libros'])).toEqual(['get', 'post'])
      expect(Object.keys(res.body.paths['/api/v1/libros/{id}'])).toEqual(['get', 'patch', 'delete'])
    })
  })
})
