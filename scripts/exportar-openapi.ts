import { writeFileSync } from 'fs'
import { crearDocumento } from '../src/docs/openapi'

// Escribe openapi.json en la raíz del proyecto (no necesita el servidor encendido)
writeFileSync('openapi.json', JSON.stringify(crearDocumento(), null, 2) + '\n')
console.log('openapi.json exportado')
