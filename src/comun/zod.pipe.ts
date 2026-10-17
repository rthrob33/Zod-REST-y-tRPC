import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { z } from 'zod'

// Pipe que valida con un esquema de Zod.
// Si los datos no cumplen, responde 400 con la lista de campos con error.
@Injectable()
export class ZodPipe implements PipeTransform {
  constructor(private readonly esquema: z.ZodType) {}

  transform(valor: unknown) {
    const resultado = this.esquema.safeParse(valor)

    if (resultado.success) {
      return resultado.data
    }

    const errores = resultado.error.issues.map((problema) => ({
      campo: campoDelError(problema),
      mensaje: problema.message,
    }))

    throw new BadRequestException({
      statusCode: 400,
      message: 'Datos inválidos',
      errores,
    })
  }
}

function campoDelError(problema: z.core.$ZodIssue) {
  // Campo que sobra: el nombre viene en "keys", no en "path"
  if (problema.code === 'unrecognized_keys') {
    return problema.keys.join(', ')
  }
  return problema.path.join('.') || '(general)'
}
