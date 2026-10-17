# Zod, REST y tRPC

**Nombre:** Roberth Melendez
**Carnet:** 2500461

API de un catálogo de libros. Un solo contrato hecho con Zod se usa para validar los datos en REST (NestJS), en tRPC y para generar la documentación OpenAPI.

## Cómo correrlo

```bash
npm install
npm run dev        # servidor en http://localhost:3000
npm test           # 25 pruebas
npm run openapi    # vuelve a exportar openapi.json
```

Para producción: `npm run build` y luego `npm start`.

| Dirección | Qué es |
|---|---|
| `http://localhost:3000/api/v1/libros` | REST |
| `http://localhost:3000/trpc` | tRPC |
| `http://localhost:3000/docs` | Documentación (Swagger UI) |
| `http://localhost:3000/openapi.json` | Documentación en JSON |

Los datos se guardan en memoria y arrancan con 12 libros de ejemplo. Al apagar el servidor se reinician.

## 1. Contrato (`package/contracts`)

Aquí están todos los esquemas de Zod, separados del servidor:

- `libro.ts`: `crearLibro`, `actualizarLibro`, `libro` y `listarLibros` (la query del listado).
- `comun.ts`: `paginado()`, `idParam` y los esquemas de error.

Los tipos de TypeScript salen de los esquemas con `z.infer`, así que no se escriben dos veces. Los esquemas de entrada usan `.strict()`, por eso un campo que no existe da 400 en vez de ignorarse.

## 2. ZodPipe y errores 400

`src/comun/zod.pipe.ts` es un pipe de NestJS que recibe un esquema. Se conecta en cada parámetro del controlador:

```ts
@Body(new ZodPipe(crearLibro)) datos: CrearLibro
```

Si los datos no cumplen, responde **400** con la lista de campos que fallaron:

```json
{
  "statusCode": 400,
  "message": "Datos inválidos",
  "errores": [
    { "campo": "titulo", "mensaje": "Demasiado pequeño: se esperaba que texto tuviera >=3 caracteres" },
    { "campo": "esAdmin", "mensaje": "Llave desconocida: \"esAdmin\"" }
  ]
}
```

También valida el body, la query y el `:id` (debe ser UUID).

## 3. REST (5 endpoints)

| Verbo | Ruta | Éxito | Errores |
|---|---|---|---|
| GET | `/api/v1/libros` | 200 | 400 |
| POST | `/api/v1/libros` | 201 + header `Location` | 400, 409 |
| GET | `/api/v1/libros/:id` | 200 | 400, 404 |
| PATCH | `/api/v1/libros/:id` | 200 | 400, 404, 409 |
| DELETE | `/api/v1/libros/:id` | 204 | 400, 404 |

Código 409: ya existe un libro con ese título. Código 404: el libro no existe.

### Lista paginada

`GET /api/v1/libros` usa paginación por cursor:

| Parámetro | Descripción |
|---|---|
| `limite` | Libros por página, de 1 a 50 (por defecto 10) |
| `cursor` | Id del último libro de la página anterior |
| `buscar` | Texto a buscar en título o autor |
| `orden` | `reciente` (por defecto) o `titulo` |

La respuesta trae `datos`, `total` y `siguiente`. Si `siguiente` no es `null`, se manda como `cursor` para pedir la página que sigue:

```bash
curl "http://localhost:3000/api/v1/libros?limite=5&orden=titulo"
curl "http://localhost:3000/api/v1/libros?limite=5&orden=titulo&cursor=<siguiente>"
```

Ejemplo de creación:

```bash
curl -X POST http://localhost:3000/api/v1/libros \\
  -H "Content-Type: application/json" \\
  -d '{"titulo":"Mi libro","autor":"Roberth","anio":2026,"paginas":120}'
```

## 4. tRPC

En `src/trpc/router.ts`, con los mismos esquemas del contrato y el mismo servicio que usa REST:

| Procedimiento | Tipo |
|---|---|
| `libros.listar` | consulta (query) |
| `libros.obtener` | consulta (query) |
| `libros.crear` | mutación (mutation) |

```bash
# consulta
curl 'http://localhost:3000/trpc/libros.listar?input=%7B%22limite%22%3A3%7D'

# mutación
curl -X POST http://localhost:3000/trpc/libros.crear \\
  -H "Content-Type: application/json" \\
  -d '{"titulo":"Creado con tRPC","autor":"Roberth","anio":2026,"paginas":50}'
```

Un libro creado por tRPC aparece en REST y al revés, porque los dos usan el mismo servicio.

## 5. Documentación

- `/docs` muestra la interfaz de Swagger UI.
- `openapi.json` está exportado en la raíz del repo y también se sirve en `/openapi.json`.
- La documentación **se genera desde los esquemas de Zod** (`src/docs/openapi.ts`), así que siempre coincide con lo que valida la API.

## Estructura

```
package/contracts/src/   contrato con Zod (libro.ts, comun.ts)
src/
├── comun/zod.pipe.ts    ZodPipe
├── libros/              controlador REST, servicio y repositorio
├── trpc/router.ts       router de tRPC
├── docs/openapi.ts      genera el documento OpenAPI
├── configurar.ts        agrega /docs, /openapi.json y /trpc
└── main.ts
scripts/exportar-openapi.ts
test/libros.e2e-spec.ts
openapi.json
```
