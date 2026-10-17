import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import type { Response } from 'express'
import {
  actualizarLibro,
  crearLibro,
  idParam,
  listarLibros,
  type ActualizarLibro,
  type CrearLibro,
  type IdParam,
  type ListarLibros,
} from '../../package/contracts/src'
import { ZodPipe } from '../comun/zod.pipe'
import { LibrosService } from './libros.service'

@Controller('libros')
export class LibrosController {
  constructor(@Inject(LibrosService) private readonly servicio: LibrosService) {}

  // GET /libros -> 200 con la página de resultados
  @Get()
  listar(@Query(new ZodPipe(listarLibros)) q: ListarLibros) {
    return this.servicio.listar(q)
  }

  // POST /libros -> 201 y el header Location con la URL del libro nuevo
  @Post()
  @HttpCode(201)
  crear(
    @Body(new ZodPipe(crearLibro)) datos: CrearLibro,
    @Res({ passthrough: true }) res: Response,
  ) {
    const libro = this.servicio.crear(datos)
    res.setHeader('Location', `/api/v1/libros/${libro.id}`)
    return libro
  }

  // GET /libros/:id -> 200, o 404 si no existe
  @Get(':id')
  obtener(@Param(new ZodPipe(idParam)) params: IdParam) {
    return this.servicio.obtener(params.id)
  }

  // PATCH /libros/:id -> 200 con el libro actualizado
  @Patch(':id')
  actualizar(
    @Param(new ZodPipe(idParam)) params: IdParam,
    @Body(new ZodPipe(actualizarLibro)) cambios: ActualizarLibro,
  ) {
    return this.servicio.actualizar(params.id, cambios)
  }

  // DELETE /libros/:id -> 204 sin cuerpo
  @Delete(':id')
  @HttpCode(204)
  borrar(@Param(new ZodPipe(idParam)) params: IdParam) {
    this.servicio.borrar(params.id)
  }
}
