import { Module } from '@nestjs/common'
import { LibrosController } from './libros/libros.controller'
import { LibrosRepositorio } from './libros/libros.repositorio'
import { LibrosService } from './libros/libros.service'

@Module({
  controllers: [LibrosController],
  providers: [LibrosService, LibrosRepositorio],
})
export class AppModule {}
