import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configurarApp } from './configurar'

async function arrancar() {
  const app = await NestFactory.create(AppModule)
  configurarApp(app)

  const puerto = Number(process.env.PORT ?? 3000)
  await app.listen(puerto)

  console.log(`API lista en http://localhost:${puerto}/api/v1/libros`)
  console.log(`Documentación en http://localhost:${puerto}/docs`)
  console.log(`tRPC en http://localhost:${puerto}/trpc`)
}

arrancar()
