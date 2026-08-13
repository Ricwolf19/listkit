<div align="center">

# listkit

**Vistas de lista estandarizadas y responsivas para React.**  
Tabla / tarjetas, búsqueda, filtros avanzados, paginación, ordenamiento, SSR y theming — listo para usar.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%5E18%20%7C%7C%20%5E19-61dafb.svg)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/tailwindcss-v4-38bdf8.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)

[🇬🇧 English](./README.md) | **🇲🇽 Español**

</div>

---

## Tabla de contenidos

- [Características](#características)
- [Inicio rápido](#inicio-rápido)
- [Instalación](#instalación)
- [Configuración de Tailwind v4](#configuración-de-tailwind-v4)
- [Uso](#uso)
  - [1. Conectar el provider](#1-conectar-el-provider-una-vez-en-la-raíz-de-la-app)
  - [2. Renderizar una lista](#2-renderizar-una-lista)
  - [Organizar la configuración](#organizar-la-configuración-archivo-vs-inline)
  - [Filtros avanzados](#filtros-avanzados)
  - [Ordenamiento de columnas](#ordenamiento-de-columnas)
  - [Exportar a CSV](#exportar-a-csv)
  - [Exportación configurable (alcance, campos, orden)](#exportación-configurable-alcance-campos-orden)
  - [Diagnósticos](#diagnósticos)
  - [Defaults de tabla y layout](#defaults-de-tabla-y-layout)
  - [Acciones de fila](#acciones-de-fila)
  - [Filtros rápidos](#filtros-rápidos)
  - [Indicadores de scroll](#indicadores-de-scroll)
  - [Selección de filas y acciones masivas](#selección-de-filas-y-acciones-masivas)
  - [Estado vacío](#estado-vacío)
  - [Atajos de teclado](#atajos-de-teclado)
  - [Preferencias de vista guardadas](#preferencias-de-vista-guardadas)
  - [Imágenes optimizadas (`ListImage`)](#imágenes-optimizadas-listimage)
  - [UX de tabla: encabezado fijo, densidad, reordenar, redimensionar](#ux-de-tabla-encabezado-fijo-densidad-reordenar-redimensionar)
  - [Tarjetas personalizadas con acciones y tema](#tarjetas-personalizadas-con-acciones-y-tema)
  - [Tarjetas totalmente personalizadas (`bareCard`)](#tarjetas-totalmente-personalizadas-barecard)
  - [Refrescar después de una mutación](#refrescar-después-de-una-mutación)
  - [Desplazar la barra de paginación](#desplazar-la-barra-de-paginación)
  - [Datos asíncronos (server-side)](#datos-asíncronos-server-side)
  - [Renderizado en servidor (`initialData`)](#renderizado-en-servidor-initialdata)
  - [Menos boilerplate (Next.js)](#menos-boilerplate-nextjs)
  - [Caché integrada (cero dependencias)](#caché-integrada-cero-dependencias)
  - [Uso con TanStack Query](#uso-con-tanstack-query)
  - [Ejemplo completo — caché integrada](#ejemplo-completo--sin-react-query-caché-integrada)
  - [Ejemplo completo — con React Query](#ejemplo-completo--con-react-query)
  - [Theming](#theming)
- [Subpath exports](#subpath-exports)
- [Licencia](#licencia)

---

## Características

- **Configuración declarativa** — un solo `defineListConfig<T>()` describe toda la vista de lista (búsqueda, filtros, columnas, tarjeta, acciones, tema).
- **Responsivo por defecto** — cambia automáticamente entre tabla (escritorio) y tarjetas (tablet/móvil); sigue el viewport.
- **Adaptadores de datos** — renderiza arrays en memoria o conecta una fuente asíncrona (REST, server actions de Next.js, Dexie). Búsqueda/paginación/filtros fluyen a través del adaptador, por lo que pueden ejecutarse en el servidor.
- **Caché integrada** — las respuestas se mantienen en memoria con `staleTime` configurable. Volver a una página reciente muestra los datos al instante; stale-while-revalidate refresca silenciosamente en segundo plano.
- **Hook de datos remplazable** — inyecta tu propio `useListData` (ej. TanStack Query) para refetch en segundo plano, reintentos y caché entre componentes sin acoplar el paquete a ninguna librería.
- **Listo para SSR** — pasa la primera página obtenida en el servidor como `initialData` y la lista renderiza filas reales en el HTML inicial (SEO, sin flash de carga, hidrata sin volver a fetchear). `buildListQuery` reconstruye la query exacta en el servidor para que coincida con el cliente.
- **Filtros avanzados** — `text`, `select`, `multi-select`, `date-range`, `number-range`, `boolean`; los valores son validados con Zod y sincronizados a la URL. Los filtros pueden organizarse en 1 o 2 columnas para ahorrar espacio.
- **Ordenamiento de columnas** — marca columnas como `sortable`; los encabezados ciclan asc → desc → off, sincronizan la URL y fluyen al adaptador (`query.sort`). La siguiente página se prefetch en idle para que la paginación hacia adelante sea instantánea.
- **Adaptadores de router** — sincronizan el estado de la lista a la URL vía adaptadores remplazables: Next.js, React Router, o el adaptador de navegador sin framework.
- **Theming** — 8 paletas integradas o tu propio tema personalizado; por lista o global.
- **Tarjetas personalizadas** — usa el chrome de tarjeta integrado, o `bareCard` para insertar un componente de tarjeta completamente personalizado.
- **Refrescar en mutación** — `useListRefresh()` refetchea la lista después de un delete/edit, sin recargar la página.
- **Atajos de teclado** — `⌘ K` enfoca búsqueda, `+` abre filtros, `Shift + V` cambia la vista, `-` quita el último filtro, `←`/`→` página anterior/siguiente, `Shift + ←`/`Shift + →` primera/última página.
- **Slots de encabezado** — coloca métricas/badges sobre el título con `headerContent={{ left, center, right }}`.
- **Gestor de columnas** — `table.columnControl` permite ocultar/mostrar y reordenar columnas; persiste en localStorage (o tu propio `ColumnStorage`).
- **Exportar a CSV** — agrega un botón de exportación en el toolbar con `export`: página actual por defecto; "exportar todo" se autodetecta para `data` en memoria, o se conecta con `fetchAll` para una fuente en el servidor (sin recorrer el adaptador página por página). Respeta las columnas visibles y su orden, con `exportValue`/`exportable` por columna.
- **Selección de filas y acciones masivas** — `selection` agrega checkboxes y una barra de selección con tus acciones masivas. La selección es por clave, sobrevive a la paginación y se limpia cuando cambia el dataset; combina con "exportar selección".
- **Imágenes optimizadas** — `<ListImage>` para tablas/tarjetas densas: lazy-load, decodificación asíncrona, placeholder shimmer, fallback de error y un slot para inyectar `next/image`.
- **Encabezado fijo, densidad, reordenar y redimensionar** — opciones opcionales de `table` (`stickyHeader`, `density`, `reorderable`, `resizable`); las elecciones del usuario persisten en localStorage.
- **Filtros colapsables + búsqueda rápida** — los sidebars largos tienen secciones colapsables (`collapsible`) y una caja de búsqueda de filtros.
- **Slider de rango** — un filtro `number-range` puede renderizar como slider de dos manijas (`display: 'slider'`, `min`/`max`/`step`/`formatValue`).
- **Límites numéricos según el locale** — los inputs de `number-range` leen y escriben números agrupados (`1,234.56` en `en-US`, `1.234,56` en `de-DE`), y el chip aplicado usa `formatValue` cuando el filtro declara uno. Un límite que no sea un número finito se lee como vacío, así que uno malformado nunca llega a la query.
- **Componible + type-safe** — usa `<ListView>`, o baja de nivel a `Toolbar`, `Table`, `Cards`, `Pagination`, `FilterSidebar`, …

---

## Inicio rápido

```bash
pnpm add listkit react react-dom lucide-react tailwindcss
```

```css
/* app/globals.css */
@import 'tailwindcss';
@import 'listkit/tailwind.css';
```

```tsx
// app/providers.tsx
'use client'
import { ListKitProvider } from 'listkit'
import { useNextRouterAdapter } from 'listkit/next'

export function Providers({ children }) {
	const router = useNextRouterAdapter()

	return (
		<ListKitProvider router={router} theme='blue'>
			{children}
		</ListKitProvider>
	)
}
```

```tsx
// app/page.tsx
import { ListView } from 'listkit'

export default function Page() {
	return <ListView config={productsConfig} data={products} />
}
```

¿Quieres aún menos cableado? `<NextListView>` (`listkit/next`) inyecta el adaptador de router y el provider por ti — mira la sección **Menos boilerplate (Next.js)**.

---

## Instalación

```bash
pnpm add listkit
# peers
pnpm add react react-dom lucide-react tailwindcss
```

Peers opcionales (instala solo lo que uses):

```bash
pnpm add zod                # filtros avanzados (validación de valores)
pnpm add next               # useNextRouterAdapter
pnpm add react-router-dom   # useReactRouterAdapter
```

Todo lo demás (`react-datepicker`, `clsx`, `tailwind-merge`) viene empaquetado como dependencia regular — no necesitas instalar nada extra.

---

## Configuración de Tailwind v4

listkit incluye sus clases compiladas; regístralas una vez para que Tailwind las genere:

```css
/* app/globals.css */
@import 'tailwindcss';
@import 'listkit/tailwind.css';
```

Los estilos de `react-datepicker` se inyectan automáticamente en runtime (seguros para SSR), así que no necesitas importar CSS adicional.

---

## Uso

### 1. Conectar el provider (una vez, en la raíz de la app)

El provider suministra el adaptador de router (sincronización con URL) y valores por defecto opcionales para toda la app (tema, densidad, labels).

```tsx
'use client'
import { ListKitProvider } from 'listkit'
import { useNextRouterAdapter } from 'listkit/next'

export function Providers({ children }) {
	const router = useNextRouterAdapter()

	return (
		<ListKitProvider router={router} theme='blue' defaultDensity='compact'>
			{children}
		</ListKitProvider>
	)
}
```

`defaultDensity` fija la densidad de fila inicial para todas las tablas bajo el provider (p. ej. hacer compacta la opción por defecto de la app). Un `table.defaultDensity` del config aún gana, y la elección persistida del usuario gana sobre ambos.

¿Sin framework? Usa `useBrowserRouterAdapter()` (History API), exportado desde la entrada principal. ¿React Router? `useReactRouterAdapter()` desde `listkit/react-router`. Omite `router` por completo y el estado permanece en estado local de React (sin sincronización con URL).

### 2. Renderizar una lista

`<ListView>` recibe una config más `data` (en memoria) o `adapter` (asíncrono).

```tsx
import { ListView } from 'listkit'
;<ListView config={productsConfig} data={products} />
```

### Organizar la configuración: archivo vs inline

Ambas son válidas — `defineListConfig` es solo un helper de identidad tipado.

**Inline** (ideal para listas pequeñas/únicas):

```tsx
function ProductsPage() {
	const config = defineListConfig<Product>({
		id: 'products',
		title: 'Productos',
		search: { fields: ['name', 'sku'] },
		table: { columns: [{ key: 'name', header: 'Nombre' }] },
	})
	return <ListView config={config} data={products} />
}
```

**Archivo de configuración separado** (recomendado cuando crece — mantiene la página pequeña y la config testeable/reutilizable):

```
features/products/
├── config.tsx        # defineListConfig (columnas, filtros, acciones, tema)
├── ProductCard.tsx   # renderizador de tarjeta
└── types.ts          # tipo de fila
```

```tsx
// features/products/config.tsx
export const productsConfig = defineListConfig<Product>({
	/* … */
})

// page.tsx
import { productsConfig } from '@/features/products/config'
;<ListView config={productsConfig} data={products} />
```

### Filtros avanzados

```tsx
defineListConfig<Product>({
  id: 'products',
  search: true,
  filtersTitle: 'Filtrar productos',
  filters: [
    {
      id: 'attributes',
      title: 'Atributos',
      filters: [
        {
          id: 'category',
          field: 'category',
          label: 'Categoría',
          type: 'select',
          options: [{ value: 'coffee', label: 'Café' }],
        },
        {
          id: 'tags',
          field: 'tags',
          label: 'Etiquetas',
          type: 'multi-select',
          options: [...],
        },
        {
          id: 'price',
          field: 'price',
          label: 'Precio',
          type: 'number-range',
        },
        {
          id: 'createdAt',
          field: 'createdAt',
          label: 'Alta',
          type: 'date-range',
        },
        {
          id: 'active',
          field: 'active',
          label: 'Estado',
          type: 'boolean',
        },
        {
          id: 'name',
          field: 'name',
          label: 'Nombre',
          type: 'text',
        },
      ],
    },
  ],
})
```

Los filtros aplicados aparecen como chips removibles sobre la lista y se sincronizan con la URL. Con un adaptador asíncrono, lee `query.filters` (un `ActiveFilterValue[]`) en tu fetcher y tradúcelo a SQL/HTTP.

#### Valores por defecto de los filtros

Dale a cualquier filtro un `defaultValue` para **pre-aplicarlo en una lista en blanco** — cuando la URL aún no tiene filtros. Varios filtros pueden definir uno cada uno (p. ej. mostrar solo filas activas _y_ el mes actual por defecto):

```ts
const filters: FilterDefinition<Order>[] = [
	{
		id: 'status',
		field: 'status',
		label: 'Estatus',
		type: 'select',
		options: statusOptions,
		defaultValue: 'active',
	},
	{
		id: 'created',
		field: 'createdAt',
		label: 'Creado',
		type: 'date-range',
		defaultValue: { from: '2026-06-01', to: '2026-06-30' },
	},
]
```

`defaultValue` usa la misma forma que el adaptador recibe para ese tipo: `select` → `string`, `multi-select` → `string[]`, `boolean` → `boolean`, `text` → `{ value, match }`, `date-range` → `{ from?, to? }`, `number-range` → `{ min?, max? }`.

Los valores por defecto solo siembran la vista **inicial**: se aplican en el primer render (así el primer fetch ya los incluye) y se escriben en la URL; después, las ediciones/limpiezas del usuario siempre ganan. Las listas con `initialData` (SSR) se dejan intactas — aplica los defaults en tu query del servidor.

### Ordenamiento de columnas

Marca cualquier columna de tabla como `sortable`. Al hacer clic en su encabezado cicla **ascendente → descendente → apagado**, sincroniza el sort activo en un parámetro `sort` de la URL, y fluye al adaptador como `query.sort` (`{ field, dir }`):

```tsx
table: {
  columns: [
    { key: 'name', header: 'Nombre', sortable: true },
    { key: 'createdAt', header: 'Alta', sortable: true, sortField: 'created_at' },
    { key: 'total', header: 'Total', align: 'right', sortable: true },
  ],
}
```

- **Datos en memoria** — el adaptador integrado ordena automáticamente por el campo activo.
- **Adaptadores asíncronos** — lee `query.sort` en tu fetcher y tradúcelo a `ORDER BY`.
- `sortField` sobrescribe el nombre de campo enviado al adaptador (por defecto usa el `key` de la columna).

Después de que carga una página, la siguiente se prefetch en idle dentro del caché, así que hacer clic en "siguiente" renderiza al instante sin flash de carga.

### Exportar a CSV

Agrega un botón de exportación al toolbar con `export`. Exporta las **columnas visibles en su orden actual** (respeta ocultar/reordenar), la **página actual** por defecto:

```tsx
defineListConfig<Product>({
	export: true, // botón CSV de página actual
	table: {
		columns: [
			{ key: 'name', header: 'Nombre' },
			// render devuelve JSX → da un valor plano para serializar:
			{
				key: 'price',
				header: 'Precio',
				render: p => <b>{money(p.price)}</b>,
				exportValue: p => p.price,
			},
			{ key: 'actions', header: '', render: rowActions, exportable: false }, // se omite
		],
	},
})
```

- `exportValue?(item)` — valor plano para una columna cuyo `render` es JSX. Si se omite, usa `item[key]` (admite rutas con punto).
- `exportable: false` — excluye una columna (ej. una columna de acciones).

**Exportar todo.** Pasa un `ExportConfig` para ofrecer también la opción "exportar todo":

```tsx
export: {
  fileName: 'productos',          // por defecto el id de la lista
  fetchAll: query => listAll(query), // endpoint masivo (recibe la query actual)
}
```

- **`data` en memoria** — "exportar todo" se ofrece automáticamente (todo ya está en el navegador).
- **`adapter` asíncrono** — "exportar todo" aparece solo cuando conectas `fetchAll`. listkit **nunca recorre tu adaptador página por página**; apunta `fetchAll` a un endpoint masivo/stream dedicado que aplique la query actual en el servidor. El botón muestra un spinner mientras corre.
- Usa `allowExportAll: false` para forzar solo-página-actual.

El CSV es nativo (sin dependencia extra) y lleva BOM UTF-8 para que Excel lea los acentos correctamente. Los helpers `exportRowsToCsv` / `rowsToCsv` / `downloadCsv` se exportan para botones personalizados.

### Exportación configurable (alcance, campos, orden)

Con `export` activo, "Exportar…" abre un diálogo de configuración antes de
generar el archivo: el usuario elige el **alcance** (página actual / filas
seleccionadas / todos los resultados), **qué campos** incluir — premarcados con
las columnas visibles en ese momento — y **su orden**. Con
`export.configurable: false` se recupera el menú de un clic.

El universo exportable sale por defecto de las columnas elegibles de la tabla.
Declara `fields` para ofrecer **propiedades que la tabla nunca muestra**,
agrupadas al estilo Stripe:

```tsx
export: {
  fileName: 'pedidos',
  groups: [
    { id: 'pedido', label: 'Pedido' },
    { id: 'cliente', label: 'Cliente' },
  ],
  fields: [
    { key: 'reference', label: 'Folio', group: 'pedido' },
    { key: 'total', label: 'Importe', group: 'pedido', value: o => o.total },
    { key: 'placedAt', label: 'Fecha', group: 'pedido' }, // → YYYY-MM-DD, hora local
    { key: 'customer.name', label: 'Cliente', group: 'cliente' },
    { key: 'customer.taxId', label: 'RFC', group: 'cliente' }, // no es columna
    { key: 'products.name', label: 'Productos', group: 'cliente' }, // array → "A; B"
  ],
},
```

- Un campo sin `value` lee su `key` como path con puntos, **atravesando
  arrays** (`products.name` → todos los nombres, unidos con `'; '`;
  configurable por campo con `join`).
- Las fechas (y strings ISO del servidor) se renderizan `YYYY-MM-DD` en **hora
  local** — ordenable en hoja de cálculo y sin el día corrido cerca de
  medianoche. Elige `'datetime'`/`'iso'`/función custom vía `dateFormat`
  (global) o `date` (por campo).
- `maxRows` (default 50,000) limita un export "todos"; un archivo truncado
  **lo dice en el diálogo** — nunca en silencio.

**Seleccionar más allá de la página.** Al seleccionar una página completa, la
barra ofrece "Seleccionar los N resultados" — una selección virtual (no se
cargan filas). Desmarcar filas acumula exclusiones; el export envía
`excludeKeys` en vez de materializar nada.

**Escalar con un resolver.** Para una lista con servidor, cablea
`export.resolve` — recibe el `ExportRequest` completo (alcance, query, keys de
campos en orden, include/exclude keys) y devuelve **filas** (nunca un archivo
pre-armado, para que el formato por campo sea idéntico en todo alcance):

```ts
// cliente
export: {
  resolve: async request => {
    const res = await fetch('/api/orders/export', {
      method: 'POST', // recomendado: los filtros suelen llevar PII y las keys no caben en una URL
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportRequestToBody(request)),
    })
    return res.json() // { rows, truncated?, total? }
  },
},

// servidor (estilo Express) — Mongo:
const request = parseExportRequest(req.body, { fields: EXPORT_KEYS })
if (!request) return res.status(400).end()
const { filter, sort, projection, skip, limit } = buildMongoExport(request, {
  fields: FIELDS,               // el mismo whitelist del endpoint de lista
  exportPaths: EXPORT_PATHS,    // key de campo → path Mongo de confianza
  tiebreak: { _id: 1 },         // obligatorio: un export necesita orden total
})
const rows = await Model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean()
res.json({ rows, total: await Model.countDocuments(filter) })

// servidor — Postgres:
const { sql, params } = buildSqlExport(request, {
  table: 'orders o',
  fields: FIELDS,
  exportColumns: {
    reference: 'o.reference',
    'products.name': { relation: { table: 'order_item i', on: 'i.order_id = o.id', column: 'i.product_name', orderBy: 'i.pos' } },
  },
  fallbackSort: 'o.created_at DESC, o.id DESC',
  tiebreak: ', o.id',
  idColumn: 'o.id',
})
const { rows } = await pool.query(sql, params)
```

Las listas de keys se enlazan como un solo parámetro `= ANY($n)` (un
`IN ($1, $2, …)` con miles de keys revienta el límite de parámetros del
driver). El `fetchAll` legado sigue funcionando como resolver de
`scope: 'all'`.

Sin resolver: las listas in-memory soportan los tres alcances nativamente; un
adapter de servidor sin `resolve` ofrece página + seleccionados, con "todos"
deshabilitado **con explicación** en el diálogo.

### Diagnósticos

listkit emite diagnósticos con código para que una config rota aparezca en
desarrollo y no en producción. Los `LK1xxx` lanzan en dev (no-op en prod); los
`LK2xxx` avisan una vez; los `LK3xxx` se muestran en la UI.

| Código | Severidad | Significado                                                             |
| ------ | --------- | ----------------------------------------------------------------------- |
| LK1001 | error     | Key de campo duplicada en el universo exportable.                       |
| LK1002 | error     | Export solicitado sin configuración de export.                          |
| LK1003 | error     | La petición traía una key fuera del whitelist (se descarta).            |
| LK1004 | error     | Sort sobre un path que resuelve a array — precomputa un campo plano.    |
| LK2001 | warn      | Un campo produjo un valor no primitivo; la celda queda vacía.           |
| LK2002 | warn      | Celda sobre el límite de 32,767 caracteres de Excel; truncada.          |
| LK2003 | warn      | `data:` URI descartada de una celda (URLs planas sí pasan).             |
| LK2004 | warn      | Petición GET demasiado grande — cambia el resolver a POST.              |
| LK3001 | info      | `maxRows` truncó el export — se muestra en el diálogo ("N de M filas"). |

### Defaults de tabla y layout

Estos comportamientos pasaron de opt-in a default, porque cada uno se estaba
reimplementando en todas las apps que consumen listkit. La columna de versión
es el release que lo cambió:

| Comportamiento                              | Default              | Cómo salir                                                | Desde |
| ------------------------------------------- | -------------------- | --------------------------------------------------------- | ----- |
| Las columnas recortan el texto que desborda | on                   | `truncate: false` por columna (`wrap`/`grow` lo implican) | 4.0   |
| Layout de paginación                        | `'sticky'`           | `paginationVariant='fixed' \| 'inline'`                   | 4.0   |
| Selector de filas por página                | `[20, 50, 100, 200]` | `pageSizeOptions: false`                                  | 4.0   |
| Scroll al tope al cambiar de página         | on                   | `scrollToTopOnPageChange: false`                          | 4.0   |
| Ancho mínimo por columna sin `width`        | `140px`              | `table.minColumnWidth` (`0` desactiva el piso)            | 4.1   |

**El piso de columna.** Un layout `'fixed'` reparte el contenedor en partes
iguales entre las columnas que no declaran `width`, así que la cantidad de
columnas sola decide cuánto le toca a cada una: doce columnas en un shell de
1280px reciben 106px — insuficiente para una fecha, ya no digamos para un par
de botones de acción. La tabla por eso lleva un `min-width` de
`columnas sin width x minColumnWidth` (más los `width` declarados, sumados con
`calc` porque son longitudes CSS), y **scrollea en horizontal** cuando el
contenedor baja de ahí en vez de seguir apretando.

Es un `min-width`, no un breakpoint medido: el browser lo reevalúa en cada
resize sin re-render, sin lectura de layout y con la misma respuesta en SSR.
Combínalo con `sticky: 'right'` en la columna de acciones para que los botones
se queden quietos mientras lo demás scrollea — esa combinación es la que hace
usable una tabla ancha.

Una celda fijada pinta con `bg-inherit`, así que **el fondo de la fila tiene que
ser opaco**. Los estados propios de listkit lo son; si `rowClassName` devuelve
algo como `bg-amber-50/60`, el contenido que scrollea se transparenta a través
de la columna fijada.

**El fijado arranca en `md`.** Un checkbox más una columna de acciones son
~150px, un quinto de un teléfono, y la razón por la que vale la pena gastarlos
en una pantalla ancha es exactamente la razón por la que no en una angosta. El
checkbox de selección se fija solo cuando `selection` está activo — una
selección que no ves es una selección que pierdes de vista a media tabla.

**Acciones de borde.** `overlay: true` renderiza una columna como el espejo del
checkbox de selección en el otro extremo: siempre visible, padding `px-2`
delgado, un divisor `border-l` nítido en vez de una etiqueta de header, y
fijada a la derecha desde `md`:

```tsx
{ key: 'actions', header: 'Acciones', width: '7rem', overlay: true,
  render: (item, i) => <RowActions item={item} index={i} variant='inline' actions={…} /> }
```

`overlay` también implica `exportable: false` — la columna contiene botones y su
key no nombra ningún valor de la fila, así que de otro modo escribiría una
columna vacía y marcada en cada CSV. Pasa `exportable: true` si de verdad la
quieres.

Dale un `width` del tamaño de sus botones más el padding — 28px por botón de
icono, 4px por gap, 16px de padding, así que tres botones ≈ `'7rem'`. No se
revela en hover a propósito: las acciones que nadie ve son acciones que nadie
usa, y una pantalla táctil nunca hace hover.

### Acciones de fila

`RowActions` renderiza las acciones de una fila de las dos formas:

```tsx
{
  key: 'actions', header: '', sticky: 'right', width: '7rem', exportable: false,
  render: (item, i) => (
    <RowActions
      item={item}
      index={i}
      variant='inline'          // botones de icono en la celda; 'menu' (default) los colapsa tras •••
      maxInline={3}             // pasado esto el excedente se pliega en un ••• al final
      actions={[
        { label: 'Ver', icon: <Eye size={16} />, onClick: open },
        { label: 'Descargar', icon: <FileDown size={16} />, onClick: download },
        { label: 'Cancelar', icon: <X size={16} />, danger: true, onClick: cancel,
          disabled: item => item.canceled && 'Ya está cancelada' },
      ]}
    />
  ),
}
```

`'inline'` es un clic en vez de dos, para las acciones que un operador usa en
cada fila. Cada botón es sólo icono, con su `label` como nombre accesible y
como tooltip, así que cuesta un ancho fijo sin importar qué tan largo sea el
label — una acción sin `icon` cae de vuelta a renderizar el label, lo que
ensancha la columna y normalmente significa que pertenece al menú. `disabled`
devuelve la razón, que se vuelve el tooltip.

`loading` cubre la acción que hace un round trip al servidor — preparar una
descarga, mandar un correo. Cambia el icono por un spinner y bloquea un segundo
clic, que es lo que separa "no pasó nada" de "va en camino":

```tsx
{ label: 'Descargar', icon: <FileDown size={16} />, onClick: download,
  loading: item => downloading.has(item.id) }
```

**Quick actions.** Marca una acción como `quick` (necesita un `icon`) y, en
dispositivos con hover, pasar el cursor por el `•••` la desliza hacia la
izquierda como botón de icono, en la misma línea de la fila — un clic para la
acción que un operador usa en cada fila. Es un atajo, no el único camino: la
acción sigue apareciendo en el menú `•••`, así que en touch — donde el hover no
existe — no se pierde nada, solo vive un tap más adentro.

**Menú agrupado.** Dale un `group` a las acciones y el menú `•••` las agrupa
bajo ese título, separadas por divisores — el menú seccionado estilo Stripe.
Las acciones sin grupo van primero, sin título; los grupos siguen en orden de
primera aparición. El título es texto para el usuario: pásalo ya localizado:

```tsx
rowActions: [
	{
		label: 'Descargar PDF',
		icon: <FileDown size={16} />,
		quick: true,
		group: 'Acciones',
		onClick: download,
	},
	{
		label: 'Editar factura',
		icon: <Pencil size={16} />,
		quick: true,
		group: 'Acciones',
		onClick: edit,
	},
	{ label: 'Copiar ID', group: 'Acciones', onClick: copyId },
	{ label: 'Ver cliente', group: 'Conexiones', onClick: viewCustomer },
]
```

El mismo campo `group` existe en las acciones del toolbar: en pantallas chicas,
donde se pliegan al `•••` del toolbar, el menú renderiza las mismas secciones
tituladas.

**Variantes de paginación.** `'sticky'` flota dentro del flujo y no necesita
offset de viewport — por eso es el nuevo default. `'fixed'` se clava al
viewport y, en una app con sidebar fijo, necesita `paginationOffsetLeft` para
librarlo:

```tsx
<ListView
	config={config}
	paginationVariant='fixed'
	paginationOffsetLeft='var(--app-sidebar-w)'
/>
```

`'inline'` la renderiza estática al final de su contenedor. Dentro de una card
flex-column se asienta abajo aunque la lista quede corta o vacía — el caso que
antes obligaba a `position: static !important`.

**Columnas fijadas.** Dale a una columna `sticky: 'left' | 'right'` más un
`width` y se queda visible mientras la tabla scrollea en horizontal. Usa
`'right'` para la columna de acciones, para poder actuar sobre una fila sin
scrollear hasta el final:

```tsx
{ key: 'actions', header: '', sticky: 'right', width: '64px', exportable: false, render: rowActions }
```

Varias columnas pueden fijarse al mismo borde; sus offsets se apilan en orden
de columna. Una columna fijada sin `width` se deja sin fijar en vez de
colocarse en un offset equivocado.

### Filtros rápidos

Marca un filtro como `quick` y se renderiza como una pill compacta bajo el
buscador que abre **su input real** en un popover — los filtros de uso
frecuente sin ir al sidebar. El usuario oculta la barra desde el menú Opciones.

```tsx
{ id: 'channel', field: 'channel', label: 'Canal', type: 'select', options, quick: true }
```

`quick` y `pinned` se complementan: el chip pinned aplica un valor
predeterminado (`solo pendientes`), la pill quick deja elegir cualquier valor
que el filtro acepte. Ambos siguen siendo filtros ordinarios — mismo param de
URL, misma entrada en `query.filters`, misma cache key.

El sidebar además se reordena según el uso: los filtros aplicados encabezan su
sección, las secciones que los contienen encabezan el panel, y las secciones
largas sin tocar arrancan colapsadas (nunca una con un filtro aplicado). Se
desactivan con `filtersActiveFirst: false` / `filtersAutoCollapse: false`.

### Indicadores de scroll

Todo contenedor con scroll acotado en listkit — el sidebar de filtros, el menú
de opciones, el gestor de columnas, las opciones de un select, el diálogo de
export y el scroll horizontal de la tabla — difumina sus bordes recortados,
para que el contenido más allá del corte se anuncie en vez de leerse como el
final de la lista. `ScrollArea` y `useScrollFade` se exportan para tus paneles.

Los fades horizontales oscurecen en vez de blanquear: en una tabla el contenido
no termina en el borde, pasa por debajo de algo, y un lavado blanco se lee como
que el dato mismo se desvanece.

Donde la tabla tiene columnas pinned, ese lado no lleva fade: la columna pinned
más externa proyecta la costura ella misma, y sólo mientras hay contenido
scrolleado detrás. La sombra va sobre la celda real, así que queda exacta en el
límite aunque redimensiones, reordenes u ocultes una columna. `ScrollArea`
expone las piezas para tus propios scrollers: `fadeLeft` / `fadeRight` apagan un
lado, y el wrapper es un `group/scroll` con `data-scroll-left` /
`data-scroll-right` para que los descendientes estilen según el scroll.

Los diálogos toman un `height` fijo, así su contenido scrollea en lugar de que
el diálogo cambie de tamaño bajo el cursor mientras el usuario filtra.

### Selección de filas y acciones masivas

Habilita checkboxes y una barra de selección con `selection`. La selección es **por clave**, **sobrevive a la paginación** y **se limpia cuando cambia el dataset** (búsqueda/filtros/orden/refresh) para que una selección obsoleta no se filtre:

```tsx
import { Star, Trash2 } from 'lucide-react'

defineListConfig<Product>({
	getItemKey: p => p.id, // requerido para una selección estable
	selection: {
		actions: [
			{
				label: 'Destacar',
				icon: <Star size={16} />,
				onClick: rows => featureMany(rows),
			},
			{
				label: 'Eliminar',
				icon: <Trash2 size={16} />,
				variant: 'danger',
				// Cada acción recibe las filas seleccionadas + helpers: { selectedKeys, clear }.
				onClick: async (rows, { selectedKeys, clear }) => {
					await deleteMany(selectedKeys) // ids, de getItemKey
					clear() // limpia la selección tras una acción masiva exitosa
				},
			},
		],
		onSelectionChange: rows => setSelected(rows),
	},
})
```

**Qué te da la selección.** La selección se indexa por `getItemKey`, así que cada entrada tiene un **id** (la clave) y el **objeto** completo de la fila:

- El `onClick(selected, { selectedKeys, clear })` de una acción masiva recibe `selected` (las filas `T[]` — incluso de otras páginas) y `selectedKeys` (sus ids de `getItemKey`). Usa los ids para un `DELETE … WHERE id IN (…)` y `clear()` para reiniciar después.
- `onSelectionChange(selected)` emite el mismo `T[]` cuando cambia el conjunto — úsalo para tu propia barra o contador.
- Para control total, usa el hook exportado `useRowSelection` directamente (`selectedKeys`, `selectedItems`, `isSelected`, `toggle`, `toggleMany`, `clear`).

Otras notas:

- La tabla gana una columna de checkbox **separada** con un encabezado **seleccionar-toda-la-página** (indeterminado cuando solo algunas están seleccionadas).
- Las filas se rastrean por clave, así que seleccionar entre páginas conserva los objetos completos para tu handler masivo — sin necesidad de React Query.
- `clearOnDataChange: false` conserva la selección al cambiar filtros/orden (por defecto se limpia).
- Cuando `export` está habilitado, la barra de selección también muestra **Exportar selección** (desactívalo con `showExport: false`).
- En vista de tarjetas, `ctx.selection` (`isSelected`/`toggle`) permite que una tarjeta personalizada renderice su propio checkbox.

#### Seleccionar todos los resultados

Al seleccionar la página completa se ofrece escalar a **los N resultados que coinciden** — el patrón de Gmail/Stripe. Es una selección **virtual**: listkit no carga las demás páginas, registra la búsqueda y los filtros actuales más lo que destildes después.

```tsx
selection: {
	allowSelectAllMatching: false, // desactivar; por defecto true
}
```

Lo que recibe una acción masiva depende del modo, y la diferencia importa:

| `helpers.mode`   | `selected` / `selectedKeys`             | Resolver contra                              |
| ---------------- | --------------------------------------- | -------------------------------------------- |
| `'explicit'`     | cada fila seleccionada                  | las claves                                   |
| `'all-matching'` | solo las filas que el cliente **cargó** | `helpers.query` menos `helpers.excludedKeys` |

Una acción en `'all-matching'` debe correr contra la **query**, no contra el arreglo de filas — las filas de otras páginas nunca se pidieron, así que usar `selectedKeys` tocaría la página actual y dejaría intactas todas las demás sin avisar:

```tsx
onClick: async (rows, { selectedKeys, mode, query, excludedKeys, clear }) => {
	if (mode === 'all-matching') await archiveByQuery(query, excludedKeys)
	else await archiveMany(selectedKeys)
	clear()
}
```

El backend resuelve esa query con los mismos builders que usa la lista — `buildMongoFilter` / `buildSqlFilter` — así que las filas que toca la acción son exactamente las que vio el usuario. La exportación funciona igual: el alcance `all` del modal le entrega al resolver la query y las exclusiones.

Exportar esa selección necesita una forma de alcanzar las filas. Con datos in-memory o un `resolve` de exportación, el alcance **Selección** del modal cubre los 12,000; sin eso, queda **deshabilitado con una explicación** en vez de escondido, y el "Exportar selección" de un clic se retira — un archivo con la página cargada mientras la barra dice "12,000 seleccionados" es peor que ningún archivo.

### Estado vacío

"Sin resultados" significa cosas distintas: una lista a la que nadie ha escrito quiere una invitación, una filtrada quiere una pista para aflojar los filtros. Compónlo con `empty`, sin reemplazar el layout:

```tsx
import { PackageOpen } from 'lucide-react'

defineListConfig<Product>({
	empty: {
		title: 'Aún no hay productos',
		message: 'Agrega tu primer producto para verlo aquí.',
		icon: <PackageOpen size={40} />,
		action: <button onClick={openCreate}>Nuevo producto</button>,
	},
})
```

| Campo     | Efecto                                                                              |
| --------- | ----------------------------------------------------------------------------------- |
| `title`   | Encabezado. Por defecto usa la etiqueta `empty` activa.                             |
| `message` | Línea de apoyo bajo el título.                                                      |
| `icon`    | Glifo propio. `null` quita el bloque del ícono — más denso para una lista embebida. |
| `action`  | Un botón o enlace, para que la pantalla vacía tenga un siguiente paso.              |

`emptyMessage` es el atajo de una línea y `empty` lo sobreescribe; `renderEmpty` reemplaza el bloque completo y es el último recurso — usa `empty` primero para que el espaciado y el tema sigan siendo consistentes con el resto de la lista.

### Atajos de teclado

Activos por defecto. Cada atajo se enlaza por **capacidad**, no por estado: una lista con filtros siempre responde `+`, haya o no un filtro aplicado en este momento — así las teclas nunca se mueven bajo tus manos.

| Teclas                    | Acción                                    |
| ------------------------- | ----------------------------------------- |
| `⌘ K` / `Ctrl K`          | Enfocar la búsqueda                       |
| `+`                       | Abrir el panel de filtros, en su buscador |
| `-`                       | Quitar el último filtro aplicado          |
| `Shift + C`               | Limpiar todos los filtros                 |
| `Shift + V`               | Alternar tabla / tarjetas                 |
| `Shift + E`               | Abrir la exportación configurable         |
| `Shift + R`               | Refrescar la lista                        |
| `Shift + A`               | Seleccionar la página actual              |
| `Esc`                     | Limpiar la selección                      |
| `←` / `→`                 | Página anterior / siguiente               |
| `Shift + ←` / `Shift + →` | Primera / última página                   |
| `?`                       | Mostrar esta lista, en un overlay         |

`?` abre el overlay de ayuda, que lista **solo los atajos que esa lista realmente enlaza** — lee el mismo registro que los handlers, así que no puede anunciar una tecla muerta. La pista de `?` también vive en el menú de opciones, para quien no la descubra tecleando.

Los atajos nunca disparan mientras escribes en un input, textarea o contenteditable, así que `-` dentro de la búsqueda sigue siendo un guion. Cada uno se enlaza solo si la lista tiene la función: sin config de `export`, no hay `Shift + E`, y el overlay no lo lista.

### Preferencias de vista guardadas

Las preferencias que describen _cómo trabaja un usuario con una lista_ persisten por id de lista, para que la lista abra como la dejó. Lo que se guarda:

| Preferencia              | Se define desde              |
| ------------------------ | ---------------------------- |
| Orden de columnas        | Gestor de columnas, arrastre |
| Columnas ocultas         | Gestor de columnas           |
| Ancho de columnas        | Redimensionar el encabezado  |
| Densidad                 | Menú de opciones             |
| Vista (tabla/tarjetas)   | Toggle de vista              |
| Filas por página         | Selector del footer          |
| Barra de filtros rápidos | Menú de opciones             |

Un parámetro de URL siempre le gana al valor guardado, así que un enlace compartido muestra la vista de quien lo mandó, no la de quien lo recibe.

El almacenamiento es `localStorage` por defecto y es reemplazable — respáldalo con tu tabla de configuración de usuario para llevar las preferencias entre dispositivos:

```tsx
import type { ColumnStorage } from 'listkit'

const dbColumnStorage: ColumnStorage = {
	get: key => cache.get(key) ?? null,
	set: (key, prefs) => {
		cache.set(key, prefs)
		void api.saveColumnPrefs(key, prefs)
	},
}

<ListView config={config} adapter={adapter} columnStorage={dbColumnStorage} />
```

`get`/`set` son **síncronos** para que la tabla pinte las columnas correctas en el primer frame. Para respaldarlo con un store asíncrono, hidrata un caché por adelantado (desde un valor renderizado en el servidor o un fetch único), haz que `get` lea ese caché y deja que `set` dispare la escritura en segundo plano — como arriba.

### Imágenes optimizadas (`ListImage`)

Para tablas/tarjetas densas llenas de miniaturas, `<ListImage>` reserva su caja (sin layout shift), hace lazy-load y decodificación asíncrona, muestra un placeholder shimmer y cae en un fallback ante errores:

```tsx
import { ListImage } from 'listkit'

{ key: 'photo', header: '', exportable: false,
  render: p => <ListImage src={p.photo} alt={p.name} width={40} height={40} /> }
```

En Next.js, inyecta el componente optimizado — React puro cae a `<img>`:

```tsx
import Image from 'next/image'
;<ListImage as={Image} src={src} alt={alt} width={48} height={48} />
```

> La compresión del lado del cliente pertenece al momento de **subida** (reducir antes de almacenar), no al renderizado — descargar una imagen completa solo para recomprimirla en JS hace el render más lento, no más rápido. Lazy-loading + optimización del framework es lo que acelera las listas con muchas imágenes.

### UX de tabla: encabezado fijo, densidad, reordenar, redimensionar

**Vienen activadas por defecto.** Cualquier config con `table` obtiene el gestor de columnas, el toggle de densidad, reordenar arrastrando el encabezado, redimensionar desde el borde y el menú de opciones — sin banderas — y cada elección se persiste en localStorage. Escribe `false` para quitar alguna:

```tsx
table: {
  columns,
  // Todo lo de abajo es opcional; el valor por defecto ya es `true`.
  columnControl: false,   // fija las columnas (sin panel de ocultar/mostrar)
  reorderable: false,     // sin reordenar arrastrando el encabezado
  resizable: false,       // sin redimensionar desde el borde
  density: false,         // sin toggle cómoda/compacta
  optionsMenu: false,     // quita por completo el menú de opciones
  defaultDensity: 'comfortable',
  stickyHeader: true,     // el encabezado permanece visible mientras la tabla hace scroll
  maxBodyHeight: '70vh',  // altura del área de scroll del encabezado fijo (por defecto '70vh')
}
```

- `stickyHeader` le da a la tabla un área de scroll acotada (limitada por `maxBodyHeight`, por defecto `'70vh'`) para que el encabezado quede fijo arriba y la barra de paginación abajo — ambos visibles mientras haces scroll. El scroll horizontal queda contenido en la misma caja, así una tabla ancha nunca se desborda fuera de la página en pantallas pequeñas. Solo en vista de tabla.
- `density` + `defaultDensity` exponen el toggle cómoda ↔ compacta (sobrescribe el `compact` estático).
- `reorderable` / `resizable` agregan reordenar arrastrando encabezados y redimensionar por el borde; los anchos redimensionados persisten por columna.

#### Tamaño de columnas y truncado

Por defecto la tabla usa `layout: 'auto'` — las columnas se ajustan a su contenido, así una celda larga ensancha su columna y empuja a las demás. Para mantener las columnas estables y recortar el desborde, activa `truncate` por columna:

```tsx
table: {
  columns: [
    // Elipsis de una línea. Cambia la tabla a layout: 'fixed' para que el recorte
    // siga el ancho real de la columna — ensánchala/redimensiónala y se ve más texto.
    { key: 'name', header: 'Nombre', truncate: true, width: '14rem' },
    // Recorta a N líneas.
    { key: 'notes', header: 'Notas', truncate: 2 },
    // Vuelve a permitir el salto de línea en una columna.
    { key: 'address', header: 'Dirección', wrap: true },
    // Acota el rango del redimensionado.
    { key: 'sku', header: 'SKU', minWidth: 96, maxWidth: 240 },
  ],
}
```

- `truncate: true` recorta a una línea con elipsis; `truncate: N` recorta a N líneas. Es **dinámico** — el recorte sigue el ancho visible de la columna, así que ensancharla o redimensionarla revela más texto en vivo (sin config extra por columna). Para celdas de texto plano se agrega automáticamente un tooltip `title` con el texto completo; para un `render` con JSX, pasa `tooltip: item => '…'` para mostrar el valor completo al hover.
- `truncate` pone la tabla en `layout: 'fixed'` para que el recorte quede atado al ancho real de la columna — **esta es la solución cuando el texto sigue cortado aunque ensanches o redimensiones la columna** (en layout `auto` gana el contenido). Para un **`render` personalizado con líneas apiladas** (p. ej. un nombre sobre un id), mantén `truncate` en tus propios elementos internos y pon `table.layout: 'fixed'` directamente — no envuelvas anchos fijos como `max-w-[180px]` dentro de la celda, porque ignoran el redimensionado.
- `grow: true` marca la **columna prioritaria**: absorbe el espacio sobrante y nunca se trunca, así el valor más importante siempre se ve completo mientras las vecinas recortan.
- **Auto-ajuste:** con `resizable`, **doble clic en el handle de redimensionado** de una columna la ajusta a su celda visible más ancha (acotado por `maxWidth`). No necesitas adivinar un ancho fijo.
- `width` es una pista en layout `auto` y autoritativo en `fixed`; es solo el tamaño **inicial** y nunca bloquea el redimensionado. `minWidth`/`maxWidth` (px) son topes **opcionales** para la celda y el handle (piso por defecto 48px, sin techo) — ojo: `maxWidth` también limita hasta dónde arrastra el handle, así que omítelo para resize sin tope.

> **El toolbar se mantiene limpio.** Densidad, columnas y exportar no agregan un botón cada uno — `<ListView>` los pliega en un único menú de **opciones** (⚙), dejando inline solo lo esencial (toggle de vista, conteo de resultados). Es responsivo (disponible también en móvil) y en vista de tarjetas muestra solo exportar. Los componentes `DensityToggle`, `ColumnManager`, `ExportButton` y `TableOptionsMenu` se exportan por si construyes tu propio toolbar.

### Tarjetas sin escribir una tarjeta

Una config con tabla también renderiza vista de tarjetas, construida con esas mismas columnas — pares etiqueta/valor apilados que respetan las columnas que el usuario eligió y el `render` de cada una. Es a lo que cambia el toggle de vista, y lo que un viewport menor a 1024px muestra automáticamente.

```tsx
defineListConfig<Order>({
	id: 'orders',
	table: { columns },
	// card: undefined  → generada desde `columns` (el default)
	// card: item => …  → tu propio renderer, abajo
	// card: false      → solo tabla, sin toggle ni tarjetas en móvil
})
```

La tarjeta automática es un punto de partida, no un techo: pasa un `card` en cuanto una lista merezca una diseñada.

### Orden inicial (`defaultSort`)

```tsx
defineListConfig<Order>({
	id: 'orders',
	defaultSort: { field: 'placedAt', dir: 'desc' },
	table: { columns: [{ key: 'placedAt', header: 'Fecha', sortable: true }] },
})
```

La lista abre ordenada, el encabezado muestra la flecha y desde ahí el usuario cicla el orden. Un sort ya presente en la URL gana, y limpiar el orden no se vuelve a aplicar hasta la siguiente carga. `buildListQuery` también lo aplica en servidor, así el seed de SSR coincide con la primera query del cliente.

### Chips de filtro fijados

Algunos filtros _son_ la lista ("solo pendientes de pago", "usuarios activos"). Marca uno como `pinned` y también se renderiza como chip toggleable sobre las filas:

```tsx
{ id: 'paid', field: 'paid', label: 'Pagado', type: 'boolean', pinned: true },
{ id: 'status', field: 'status', label: 'Estado', type: 'select',
  options, pinned: true, pinnedValue: 'pendiente' },
```

Al hacer clic aplica `pinnedValue` (o `defaultValue`, o `true` para un boolean); otro clic lo limpia. Sigue siendo un filtro común — mismo parámetro de URL, misma entrada en `query.filters`, misma cache key — así que nada más en la lista necesita enterarse.

### Tarjetas personalizadas con acciones y tema

El renderizador `card` recibe el item de la fila más un objeto `ctx` con acciones y el tema de color activo:

```tsx
defineListConfig<Product>({
	/* … */
	actions: {
		onEdit: item => openEditModal(item),
		onDelete: item => confirmDelete(item),
	},
	card: (item, ctx) => (
		<div className='p-4'>
			<h3 className='font-semibold'>{item.name}</h3>
			<div className='mt-3 flex gap-2'>
				<button
					onClick={() => ctx.actions.onEdit?.(item)}
					className={cn(
						'rounded-md px-3 py-1 text-sm',
						ctx.colorTheme.primaryBg,
						ctx.colorTheme.primaryText
					)}
				>
					Editar
				</button>
			</div>
		</div>
	),
})
```

### Tarjetas totalmente personalizadas (`bareCard`)

Por defecto cada `card` está envuelta en el `<Card>` de listkit (borde, padding, sombra). Pon `bareCard: true` para renderizar tu salida de `card` directamente — inserta tu propio componente de tarjeta sin doble chrome:

```tsx
defineListConfig<Post>({
	bareCard: true,
	gridCols: 'md:grid-cols-2 lg:grid-cols-3',
	card: post => <MyPostCard {...post} />,
})
```

Cuando se configuran `card` y `table`, listkit muestra un toggle de vista y por defecto usa **tabla en escritorio** y **tarjetas en pantallas angostas**. Pon `defaultView: 'cards'` para abrir en tarjetas también en escritorio (la tabla sigue disponible en el toggle, y un cambio manual del usuario gana):

```tsx
defineListConfig<Post>({
	defaultView: 'cards',
	card: post => <MyPostCard {...post} />,
	table: { columns },
})
```

### Refrescar después de una mutación

Con un adaptador asíncrono, listkit fetchea en el cliente, así que una mutación en el servidor no se verá hasta que cambie la query. Llama `useListRefresh()` desde cualquier descendiente de `<ListView>` (el botón eliminar de una fila, un modal) para forzar un refetch — sin recargar la página. Es un no-op fuera de un `ListView`, así que los botones compartidos siguen siendo seguros:

```tsx
import { useListRefresh } from 'listkit'

function DeleteButton({ onConfirm }) {
	const refresh = useListRefresh()
	return (
		<button
			onClick={async () => {
				await onConfirm() // server action
				refresh() // la fila desaparece inmediatamente
			}}
		>
			Eliminar
		</button>
	)
}
```

`refresh()` invalida realmente las páginas en caché de esta lista (no solo incrementa un token), así que los datos refetcheados también ganan en un remount posterior — una fila eliminada no puede reaparecer cuando navegas fuera y vuelves.

Para mutaciones que ocurren **fuera** del árbol de la lista (ej. una página separada de crear/editar), tienes dos opciones:

- Llama `revalidatePath(...)` en la server action. Al regresar, el servidor re-renderiza y entrega a `<ListView>` una semilla fresca de `initialData`, que se trata como autoritativa al montar — sin flash de datos obsoletos.
- O invalida imperativamente desde cualquier lugar: `import { invalidateListCache } from 'listkit'` y luego `invalidateListCache('tu-config-id')` (omite el id para limpiar todas las listas, ej. al cerrar sesión).

Las listas en memoria (prop `data`) se refrescan automáticamente cuando `data` cambia — esto solo es necesario para adaptadores asíncronos.

### Desplazar la barra de paginación

La barra de paginación usa `position: fixed`. Pasa `paginationClassName` para despejar elementos de la app como una sidebar (mergeado vía tailwind-merge, así que un `left-*` sobrescribe el `left-0` por defecto):

```tsx
<ListView config={config} adapter={adapter} paginationClassName='lg:left-64' />
```

Para una sidebar cuyo ancho cambia (colapsable), manéjalo con una variable CSS que la sidebar establezca y una clase que la lea, ej. `left-[var(--sidebar-w)]`.

### Datos asíncronos (server-side)

```tsx
import { serverActionAdapter } from 'listkit'

const adapter = serverActionAdapter<Product>(async query => {
  const { rows, total } = await listProductsAction(query) // page/pageSize/search/filters
  return { data: rows, total }
})

<ListView config={productsConfig} adapter={adapter} />
```

### Backend PostgreSQL (`listkit/sql`)

Para un backend Postgres, `listkit/sql` convierte un `ListQuery` en fragmentos SQL seguros — placeholders `$n`, `lower() LIKE`, `NULLS LAST` — **sin dependencia de driver**. Compónlos tú mismo, o pásale un pool a `executeSqlList` para toda la query de página (filtros + búsqueda + scope + orden + paginación) en una llamada:

```ts
import { parseListkitQuery } from 'listkit/query'
import { executeSqlList } from 'listkit/sql'

app.get('/api/discounts', async (req, res) => {
	const { data, total } = await executeSqlList<Discount>({
		pool, // node-postgres / @vercel/postgres / @neondatabase/serverless — cualquier { query() }
		table: 'discount d',
		query: parseListkitQuery(req.query),
		fields: {
			kind: 'd.kind', // select  → igualdad
			value: 'd.value', // number-range → >= / <=
			created: 'd.created_at', // date-range
			// many-to-many con un builder `match` + la fábrica de placeholders `p(value)`:
			colors: {
				match: (v, p) =>
					Array.isArray(v) && v.length
						? `EXISTS (SELECT 1 FROM product_color j WHERE j.sku = d.sku AND j.id = ANY(${p(v.map(Number))}::int[]))`
						: null,
			},
		},
		searchColumns: ['d.label', 'd.code'],
		sort: { label: 'd.label', created: 'd.created_at' },
		fallbackSort: 'd.created_at DESC',
		tiebreak: ', d.id DESC',
		scope: { 'd.tenant_id': tenantId }, // alcance de auth fusionado en cada query
	})
	res.json({ data, total }) // la forma { data, total } que espera fetchAdapter
})
```

Las columnas vienen solo de los whitelists que controlas (sin inyección SQL) y el matching refleja el adapter en memoria. Para control total, baja a `buildSqlFilter(query, fields, params)` + `buildSearch(term, columns, params)` (ambos hacen append a tu `params` para que el numerado `$n` quede correcto) y `buildOrderBy` — el patrón manual exacto, sin el boilerplate. `sqlFieldMapFromFilters(config.filters)` deriva un field map inicial desde tu config.

### Backend MongoDB (`listkit/mongo`)

El front-end es el mismo en cualquier app de React (`fetchAdapter` → tu endpoint REST). En el servidor, traduce el `ListQuery` entrante a objetos planos de Mongo con `listkit/mongo` — **sin dependencia de `mongoose`/driver** y nunca ejecuta una query, así que funciona con Mongoose o el driver nativo. Los nombres de campo provienen solo de listas blancas que tú controlas (sin inyección NoSQL) y los valores de texto se escapan para regex.

```ts
import { buildMongoQuery } from 'listkit/mongo'

// query es el ListQuery de listkit parseado desde la request
const { filter, sort, skip, limit } = buildMongoQuery(query, {
	fields: {
		legalName: 'legalName', // text  → $regex sin distinción de mayúsculas
		type: 'type', // select → igualdad
		status: 'csf.generalData.status', // ruta anidada, según el tipo de filtro
		created: 'createdAt', // date-range → $gte/$lte
		hasCsf: { path: 'csf', build: existenceMatch }, // un campo, expr custom
		// Bucket calculado sobre varios campos — `match` se fusiona tal cual:
		certStatus: {
			match: v =>
				v === 'active'
					? { cerFile: { $ne: null }, certificateValidTo: { $gt: new Date() } }
					: null,
		},
	},
	sort: { name: 'legalName', created: 'createdAt' },
	fallbackSort: { legalName: 1 },
})

const [data, total] = await Promise.all([
	Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
	Model.countDocuments(filter),
])
return { data, total } // la forma { data, total } que espera fetchAdapter
```

**El matching refleja el motor in-memory.** Texto, `select` y `multi-select` comparan sin acentos ni distinción de mayúsculas (`'cancun'` encuentra `'Cancún'`), y un boolean en `false` también matchea documentos donde el campo nunca se escribió — las mismas filas que devolvería un `memoryAdapter`, garantizado por una suite de paridad que corre un mismo fixture por ambos motores contra un mongod real.

Dos escapes importan a escala:

```ts
fields: {
	// Valores controlados en un campo indexado: igualdad exacta, usa el índice.
	status: { path: 'status', fold: false },
	// Fechas guardadas como números Date.now() en vez de Date de BSON.
	created: { path: 'createdAt', as: 'unix-ms' },
}
```

Una comparación con folding es un regex, así que no puede usar un índice de igualdad. Para _igualdad_ insensible a acentos a escala, usa un índice con collation (`{ locale: 'es', strength: 1 }`) y pasa `collation` al executor. La búsqueda libre es un regex no anclado por naturaleza: mantén `searchFields` corto, acompáñalo de un `baseFilter` indexado (un tenant, un dueño), y migra a Atlas Search cuando eso deje de alcanzar.

**Una sola llamada de punta a punta.** `executeMongoList` arma filtros, búsqueda, referencias, orden y paginación, y corre el `find` + `count`. No depende del driver — pásale la colección nativa o el `.collection` de un modelo de Mongoose:

```ts
import { executeMongoList } from 'listkit/mongo'
import { parseListkitQuery } from 'listkit/query'

app.get('/api/companies', async (req, res) => {
	const result = await executeMongoList({
		collection: db.collection('companies'),
		query: parseListkitQuery(req.query),
		fields: mongoFieldMapFromFilters(companiesConfig.filters ?? []),
		searchFields: ['legalName', 'taxId'],
		sort: { name: 'legalName', created: 'createdAt' },
		fallbackSort: { legalName: 1 },
		tiebreak: { _id: 1 }, // sin esto, los empates paginan de forma no determinista
		baseFilter: { organizationId: req.orgId },
	})
	res.json(result) // { data, total }
})
```

**Filtros sobre una colección unida.** `resolveReferences` convierte "filtrar ventas por el nombre de su cliente" en un `$in` de ids que matchean, con tope (10 000 por defecto) para que un filtro amplio no arrastre una colección entera a una sola query; `buildMongoSearchWithRefs` hace lo mismo para la búsqueda libre. `/mongoose` conecta ambos por ti vía `references` / `searchReferences`.

**Migrar un endpoint existente.** Si tu API ya responde `{ results, pagination }`, conserva ese contrato mientras mueves las entrañas: envuelve con `toLegacyEnvelope` en el servidor y léelo con `fromLegacyEnvelope` como `transformResponse` del adapter hasta migrar el wire. `encodeListQuery` es la codificación canónica del cliente, exportada para que un adapter propio no se desincronice de `parseListkitQuery`.

Una entrada del field map es una ruta string de confianza, `{ path, build }` para personalizar la expresión de **un** campo, o `{ match }` para construir una condición **completa** fusionada tal cual — esto último es cómo un solo filtro abarca varios campos (buckets calculados, reglas entre campos). Combina condiciones extra (alcance de auth, id de tenant, un `$in` por referencia de una colección anidada) con `combineFilters`, y usa los helpers de más bajo nivel `buildMongoFilter` / `buildMongoSort` / `mongoPaginate` / `existenceMatch` cuando necesites control fino.

**Evita la segunda copia.** En lugar de escribir el whitelist `fields` a mano, derívalo de los mismos `filters` que tu config ya declara con `mongoFieldMapFromFilters` — así la UI del sidebar y la query del backend quedan sincronizadas desde una sola fuente. Los `select` de existencia (opciones `with`/`without`) se mapean a un spec `existenceMatch` automáticamente. Para filtros que apuntan a una colección poblada/unida, usa `filterConfigToMongoFieldMaps(filters, { references })` para separarlos en `{ main, refs }`:

```ts
import {
	buildMongoQuery,
	filterConfigToMongoFieldMaps,
	mongoFieldMapFromFilters,
} from 'listkit/mongo'

// Caso simple — una colección:
const fields = mongoFieldMapFromFilters(companiesConfig.filters ?? [])
const { filter, sort, skip, limit } = buildMongoQuery(query, {
	fields,
	sort: sortMap,
})

// Con una referencia poblada (p. ej. `csf.*` vive en una colección unida):
const { main, refs } = filterConfigToMongoFieldMaps(
	companiesConfig.filters ?? [],
	{
		references: { csf: 'csf' },
	}
)
// → main = filtros a nivel empresa; refs.csf = filtros de la colección csf
```

#### Ejecutor de Mongoose (`listkit/mongoose`)

Para un backend con Mongoose, `listkit/mongoose` corre toda la query de la página por ti — búsqueda, filtros avanzados, referencias pobladas, orden, paginación y un camino de exportar-todo — así un controller son pocas líneas. `mongoose` es un peer dependency **opcional y type-only** (se importa con `import type`, así que este entry **no incluye runtime de `mongoose`** y no agrega peso al bundle más allá de los constructores); instálalo en el backend para usar este entry.

```ts
import { parseListkitQuery } from 'listkit/query'
import { filterConfigToMongoFieldMaps } from 'listkit/mongo'
import { executePaginatedListkitQuery } from 'listkit/mongoose'

const maps = filterConfigToMongoFieldMaps(companiesConfig.filters ?? [], {
	references: { csf: 'csf' },
})

app.get('/api/companies', async (req, res) => {
	const { data, total } = await executePaginatedListkitQuery<Company>({
		model: CompanyModel,
		query: parseListkitQuery(req.query),
		fields: maps.main,
		references: [{ path: 'csf', model: CsfModel, fields: maps.refs.csf ?? {} }],
		searchFields: ['legalName', 'taxId'],
		searchReferences: [
			{ path: 'csf', model: CsfModel, fields: ['generalData.postalCode'] },
		],
		sortFields: { name: 'legalName', created: 'createdAt' },
		fallbackSort: { legalName: 1 },
		populate: ['csf'],
		baseFilter: { appsAllowed: req.app }, // alcance de auth, tenant id, …
	})
	res.json({ data, total }) // la forma { data, total } que espera fetchAdapter
})
```

Cada filtro de referencia activo se vuelve un `$in` de los ids de referencia que coinciden; el término de búsqueda matchea `searchFields` en la colección principal y (por id) `searchReferences`. Un `pageSize` mayor que `maxPageSize` (por defecto 100) se trata como **exportar todo** — desde la primera fila, con tope `maxExport` (por defecto 50 000) — así combina con el `fetchAll` de exportación de una lista. Cuando no necesitas referencias/populate, el más bajo nivel `buildMongoQuery` + tu propio `Model.find` sigue siendo lo más simple.

### Renderizado en servidor (`initialData`)

Por defecto la lista fetchea en el **cliente**: el servidor renderiza un shell vacío/cargando y las filas aparecen después de la hidratación. Para SEO, una primera pintura más rápida y sin flash de carga, obten la **primera página en el servidor** y pásala a `<ListView>` como `initialData` — renderiza esas filas en el HTML inicial y **omite el primer fetch del cliente**. La paginación y filtrado posterior siguen ejecutándose en el cliente.

El problema: el servidor debe calcular la **misma query** que el cliente derivará de la URL, o ambos renders no coincidirán y React advertirá sobre un hydration mismatch. `buildListQuery` (desde `listkit/server`) hace exactamente eso — usa su resultado tanto para fetchear como para `initialQuery`:

```tsx
// app/orders/page.tsx — un React Server Component
import { buildListQuery } from 'listkit/server'
import { ordersConfig } from './config'
import { listOrders } from './actions'
import { OrdersList } from './OrdersList'

export default async function OrdersPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const query = buildListQuery(ordersConfig, await searchParams)
	const initial = await listOrders(query) // { data, total }
	return <OrdersList initialData={initial} initialQuery={query} />
}
```

> Dado que la config ahora se lee en un Server Component, constrúyela con
> `defineListConfig` desde **`listkit/server`** (no la entrada principal).
> La entrada principal arrastra contexto de cliente (`createContext`) y haría crash
> el render de RSC. Tanto la página del servidor como la vista de lista del cliente
> pueden importar el mismo módulo de config cuando se define de esta manera.

```tsx
// config.ts — compartido por la página del servidor y la vista de lista del cliente
import { defineListConfig } from 'listkit/server'
export const ordersConfig = defineListConfig<Order>({
	/* … */
})
```

```tsx
// OrdersList.tsx — un Client Component
'use client'
import { ListView, serverActionAdapter } from 'listkit'
import type { ListQuery, ListResult } from 'listkit'
import { ordersConfig } from './config'
import { listOrders } from './actions'

export function OrdersList({
	initialData,
	initialQuery,
}: {
	initialData: ListResult<Order>
	initialQuery: ListQuery
}) {
	const adapter = serverActionAdapter<Order>(q => listOrders(q))
	return (
		<ListView
			config={ordersConfig}
			adapter={adapter}
			initialData={initialData} // renderizado en el HTML del servidor
			initialQuery={initialQuery} // usado solo mientras la URL aún coincide
		/>
	)
}
```

La misma server action (`listOrders`) alimenta tanto la primera página del servidor como los fetches posteriores del cliente — sin lógica de fetching duplicada. `initialData` se usa solo mientras la query en vivo sea igual a `initialQuery`; en el momento en que el usuario cambia de página/filtro (o llama `useListRefresh()`), la lista fetchea normalmente. Es totalmente opt-in: las listas sin `initialData` siguen fetcheando desde el cliente sin cambios.

### Menos boilerplate (Next.js)

Tres helpers cubren el cableado que toda app SSR/Next debería hacer manualmente:

- **`NextListView`** (`listkit/next`) — `<ListView>` pre-cableado con el adaptador de App Router, así que búsqueda/página/filtros/sort se sincronizan con la URL. Sin `ListKitProvider` + `useNextRouterAdapter` manuales. Pasa `theme` aquí, o ponlo una vez en un `<ListKitProvider theme={…}>` raíz y `NextListView` lo hereda (un provider hereda cualquier prop que no pases).
- **`loadInitialList(config, searchParams, fetcher)`** (`listkit/server`) — envuelve `buildListQuery` + el fetch de primera página y degrada a un fetch del cliente en caso de error. Retorna `{ initialData, initialQuery }`.
- **`ListSkeleton`** (`listkit`) — un fallback de `<Suspense>` listo para usar (barra de toolbar + tabla esqueleto) para el patrón de SSR streaming.

```tsx
// app/orders/page.tsx — Server Component
import { Suspense } from 'react'
import { loadInitialList } from 'listkit/server'
import { ListSkeleton } from 'listkit'
import { ordersConfig } from './config'
import { listOrders } from './actions'
import { OrdersList } from './OrdersList'

export default function OrdersPage({ searchParams }) {
	return (
		<Suspense fallback={<ListSkeleton />}>
			<OrdersData searchParams={searchParams} />
		</Suspense>
	)
}

async function OrdersData({ searchParams }) {
	const { initialData, initialQuery } = await loadInitialList(
		ordersConfig,
		await searchParams,
		listOrders
	)
	return <OrdersList initialData={initialData} initialQuery={initialQuery} />
}
```

```tsx
// OrdersList.tsx — Client Component
'use client'
import { NextListView } from 'listkit/next'
import { serverActionAdapter } from 'listkit'
import { ordersConfig } from './config'
import { listOrders } from './actions'

export function OrdersList({ initialData, initialQuery }) {
	const adapter = serverActionAdapter(q => listOrders(q))
	return (
		<NextListView
			theme='blue'
			config={ordersConfig}
			adapter={adapter}
			initialData={initialData}
			initialQuery={initialQuery}
		/>
	)
}
```

### Caché integrada (cero dependencias)

Por defecto `useListData` mantiene la última respuesta en memoria durante **30 segundos** (`staleTime`). Esto significa:

- Volver a una página que ya visitaste muestra los datos **al instante** — sin flash de carga.
- Si la caché está obsoleta, los datos antiguos se muestran inmediatamente mientras un refresh silencioso corre en segundo plano (stale-while-revalidate).
- Las peticiones idénticas en vuelo se **deduplican** así que cambios rápidos de filtros no disparan llamadas duplicadas.
- Llamar `useListRefresh()` invalida las páginas en caché de esta lista y refetchea (ver [Refrescar después de una mutación](#refrescar-después-de-una-mutación)); `invalidateListCache(id?)` hace lo mismo imperativamente desde cualquier lugar.
- La caché es **acotada** (evicción LRU, ~100 entradas compartidas entre todas las listas), así que una app de larga duración no puede crecerla sin límite. Si necesitas una caché más grande, con recolección de basura ajustable y entre componentes, inyecta TanStack Query (abajo) y deja que sea suyo el ciclo de vida.

Puedes ajustar o desactivar la caché por lista:

```tsx
// Cachear respuestas por 5 minutos
<ListView config={config} adapter={adapter} staleTime={5 * 60 * 1000} />

// Desactivar caché (siempre fetchear)
<ListView config={config} adapter={adapter} staleTime={0} />
```

#### El id de la lista identifica al dataset, no a la vista

La caché indexa cada respuesta por **`config.id` + la query** (`page`, `pageSize`, `search`, `filters`, `sort`). Por eso el `id` debe identificar de forma única **qué dataset** muestra la lista. Cualquier scope que cambie las filas pero **no forme parte de la query** — un `studentId` o `customerId` que el adapter captura en su closure, un registro padre del que cuelga la lista — es invisible para la caché.

Cuando un mismo `config` se monta en varios de esos scopes, colisionan: entras a la lista bajo el scope A, luego al scope B con la misma query dentro de `staleTime`, y listkit sirve las filas cacheadas de A a B **sin llamar al server**. Es intermitente por naturaleza — solo pasa si hay una entrada aún fresca que coincide.

Pasa el scope como **`cacheScope`** y listkit lo integra al id de caché (`` `${config.id}::${cacheScope}` ``) para que cada vista tenga su propio bucket — sin clonar el config ni mutar su `id`:

```tsx
// Un solo planeacionesConfig, una instancia por estudiante — sin fuga entre estudiantes.
<ListView
	config={planeacionesConfig}
	adapter={adapter}
	cacheScope={studentId}
/>
```

Reglas prácticas:

- **Se renderiza una vez, global** (ej. una página admin `/users`) → nada que hacer; el `id` por sí solo es único.
- **El scope ya vive en el `id`** (ej. `` id: `orders-${year}` ``) → nada que hacer; ya está en la llave.
- **Un `config` reusado entre scopes** (un tab por-padre, una sub-lista en una página de detalle) → asigna `cacheScope` al valor del scope.

`invalidateListCache(config.id)` sigue limpiando **todos** los scopes de ese id (hace match por el prefijo `id::`), así que una mutación que afecta a todos los scopes los refresca a todos; `useListRefresh()` dentro de una vista scopeada refresca solo esa vista. En desarrollo, listkit emite un `console.warn` cuando detecta el mismo id resuelto montado en más de una ruta — la firma de un `cacheScope` faltante.

### Uso con TanStack Query

Si tu app ya usa TanStack Query y quieres su caché entre componentes, refetch en segundo plano, reintentos y devtools, respalda tus listas con React Query en lugar de la caché integrada. Importa el hook ya hecho desde `listkit/react-query` — no hace falta escribir uno a mano:

```tsx
import { ListView } from 'listkit'
import { useReactQueryListData, invalidateList } from 'listkit/react-query'

// Debe haber un QueryClientProvider por encima de la lista.
;<ListView
	config={customersConfig}
	adapter={customersAdapter}
	useListData={useReactQueryListData}
/>
```

El hook indexa cada página por el `config.id` de la lista + la query, respeta el `staleTime` que listkit le pasa, mantiene las filas actuales mientras carga la siguiente página (`keepPreviousData`) y usa un `seed` de SSR como `initialData` si existe.

`@tanstack/react-query` es una **peer dependency opcional** — instálala solo si usas este módulo.

**Refrescar tras una mutación.** `useListRefresh()` funciona igual (incrementa un token que forma parte de la query key). Para mutaciones _fuera_ del árbol de la lista, llama `invalidateList(queryClient, listId)` — el equivalente en React Query de `invalidateListCache`:

```ts
await deleteCustomer(id)
invalidateList(queryClient, 'customers') // refetch de esta lista; omite el id para todas
```

**Hazlo tú mismo.** ¿Prefieres control total sobre las opciones de la query? Inyecta cualquier `UseListDataHook` — cuando pasas `useListData`, listkit delega cada fetch a tu hook y nunca toca la caché `Map` integrada:

```tsx
import { useQuery } from '@tanstack/react-query'
import type { UseListDataHook } from 'listkit'

const useCachedListData: UseListDataHook<Customer> = (
	adapter,
	query,
	refreshToken
) => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['customers', 'list', query, refreshToken],
		queryFn: () => adapter.fetch(query),
		staleTime: 5 * 60 * 1000,
	})
	return {
		data: data?.data ?? [],
		total: data?.total ?? 0,
		isLoading,
		error,
	}
}
```

### Ejemplo completo — sin React Query (caché integrada)

Una lista de admin genérica usando una server action de Next.js, la caché nativa y mutaciones:

```tsx
// features/users/config.tsx
export const usersConfig = defineListConfig<User>({
	id: 'users',
	title: 'Usuarios',
	search: true,
	pageSize: 20,
	filters: [
		{
			id: 'filters',
			filters: [
				{
					id: 'status',
					field: 'status',
					label: 'Estado',
					type: 'select',
					options: [
						{ value: 'active', label: 'Activo' },
						{ value: 'inactive', label: 'Inactivo' },
					],
					columns: 2, // medio ancho, se sienta junto al siguiente filtro
				},
				{
					id: 'role',
					field: 'role',
					label: 'Rol',
					type: 'select',
					options: [
						{ value: 'admin', label: 'Admin' },
						{ value: 'editor', label: 'Editor' },
					],
					columns: 2,
				},
				{
					id: 'createdAt',
					field: 'createdAt',
					label: 'Alta',
					type: 'date-range',
				},
			],
		},
	],
	table: {
		columns: [
			{ key: 'name', header: 'Nombre' },
			{ key: 'email', header: 'Correo' },
			{ key: 'status', header: 'Estado' },
			{
				key: 'actions',
				header: '',
				render: item => <UserActions user={item} />,
			},
		],
	},
})

// features/users/UserList.tsx
export function UserList() {
	const adapter = serverActionAdapter<User>(async query => {
		const { rows, total } = await listUsersAction(query)
		return { data: rows, total }
	})

	return (
		<ListView
			config={usersConfig}
			adapter={adapter}
			staleTime={60_000} // caché integrada: mantener respuestas por 1 minuto
			toolbarActions={[
				{
					label: 'Nuevo usuario',
					onClick: () => openCreateModal(),
				},
			]}
		/>
	)
}

// features/users/UserActions.tsx
import { useListRefresh } from 'listkit'

function UserActions({ user }: { user: User }) {
	const refresh = useListRefresh()

	const handleDelete = async () => {
		await deleteUserAction(user.id)
		refresh() // invalida la caché integrada y refetchea
	}

	return <button onClick={handleDelete}>Eliminar</button>
}
```

### Ejemplo completo — con React Query

La misma lista, pero dejando que TanStack Query posea la caché y el refetch en segundo plano:

```tsx
// features/users/UserList.tsx
import { useQuery } from '@tanstack/react-query'
import type { UseListDataHook } from 'listkit'

const useUsersListData: UseListDataHook<User> = (
	adapter,
	query,
	refreshToken
) => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['users', 'list', query, refreshToken],
		queryFn: () => adapter.fetch(query),
		staleTime: 5 * 60 * 1000,
	})

	return {
		data: data?.data ?? [],
		total: data?.total ?? 0,
		isLoading,
		error,
	}
}

export function UserList() {
	const adapter = serverActionAdapter<User>(async query => {
		const { rows, total } = await listUsersAction(query)
		return { data: rows, total }
	})

	return (
		<ListView
			config={usersConfig}
			adapter={adapter}
			useListData={useUsersListData} // React Query toma el control
			toolbarActions={[
				{
					label: 'Nuevo usuario',
					onClick: () => openCreateModal(),
				},
			]}
		/>
	)
}
```

### Theming

```tsx
// paleta integrada por lista
defineListConfig({ colorTheme: 'teal', /* … */ })

// default global
<ListKitProvider theme="teal">…</ListKitProvider>

// tema personalizado (colores de marca) — pasa un objeto ThemeClasses donde se acepta un tema
const brand: ThemeClasses = {
  primaryBg: 'bg-[#121c38]',
  primaryText: 'text-white',
  focusRing: 'focus:ring-indigo-500',
  focusBorder: 'focus:border-indigo-500',
  /* … */
}
defineListConfig({ colorTheme: brand, /* … */ })
```

---

## Subpath Exports

| Ruta de importación    | Contenido                                                                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listkit`              | `ListView`, `defineListConfig`, `ListKitProvider`, `ListSkeleton`, `invalidateListCache`, adapters, hooks, primitives, types                                                                                     |
| `listkit/next`         | `useNextRouterAdapter`, `NextListView`                                                                                                                                                                           |
| `listkit/react-router` | `useReactRouterAdapter`                                                                                                                                                                                          |
| `listkit/adapters`     | `memoryAdapter`, `fetchAdapter`, `serverActionAdapter`, `createDexieAdapter`                                                                                                                                     |
| `listkit/server`       | `buildListQuery`, `loadInitialList`, `defineListConfig` — seguro para RSC (sin React/DOM)                                                                                                                        |
| `listkit/query`        | `parseListkitQuery`, `filtersById`, `getString`/`getBoolean`/`getStringArray`/`getDateRange`/`getNumberRange`/`getText`, `paginate` — parsear un request a `ListQuery` y leer sus filtros                        |
| `listkit/sql`          | `executeSqlList`, `buildSqlFilter`, `buildSearch`, `buildOrderBy`, `textCondition`, `sqlFieldMapFromFilters` — fragmentos Postgres + ejecutor (inyección de pool, sin driver)                                    |
| `listkit/mongo`        | `buildMongoQuery`, `buildMongoFilter`, `buildMongoSort`, `mongoPaginate`, `combineFilters`, `escapeRegex`, `mongoFieldMapFromFilters`, `filterConfigToMongoFieldMaps` — objetos de query de MongoDB (sin driver) |
| `listkit/mongoose`     | `executePaginatedListkitQuery` — corre la query de página en Mongoose (peer dep `mongoose` opcional, type-only)                                                                                                  |
| `listkit/react-query`  | `useReactQueryListData`, `invalidateList`, `listQueryKey` — respalda listas con TanStack Query                                                                                                                   |
| `listkit/tailwind.css` | Registro de fuente Tailwind v4                                                                                                                                                                                   |

---

## Licencia

MIT © Ricardo Tapia
