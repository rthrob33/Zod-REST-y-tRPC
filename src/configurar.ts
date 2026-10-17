import type { INestApplication } from '@nestjs/common'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import swaggerUi from 'swagger-ui-express'
import { crearDocumento } from './docs/openapi'
import { LibrosService } from './libros/libros.service'
import { crearRouter } from './trpc/router'

// Todo lo que se agrega a la app. Lo usan main.ts y las pruebas, así son idénticas.
export function configurarApp(app: INestApplication) {
  app.setGlobalPrefix('api/v1')

  const express = app.getHttpAdapter().getInstance()
  const documento = crearDocumento()

  // Documentación: interfaz en /docs y el JSON en /openapi.json
  express.use('/docs', swaggerUi.serve, swaggerUi.setup(documento))
  express.get('/openapi.json', (_req: unknown, res: { json: (d: object) => void }) => res.json(documento))

  // tRPC en /trpc, con el mismo servicio que usa REST
  express.use('/trpc', createExpressMiddleware({ router: crearRouter(app.get(LibrosService)) }))
}
