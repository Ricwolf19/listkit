<div align="center">

# @pibytelabs/listkit

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
  - [Selección de filas y acciones masivas](#selección-de-filas-y-acciones-masivas)
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
- **Atajos de teclado** — `⌘ K` enfoca búsqueda, `Shift + F` abre filtros, `Shift + V` cambia la vista, `+` abre filtros, `-` quita el último filtro, `←`/`→` página anterior/siguiente, `Shift + ←`/`Shift + →` primera/última página.
- **Slots de encabezado** — coloca métricas/badges sobre el título con `headerContent={{ left, center, right }}`.
- **Gestor de columnas** — `table.columnControl` permite ocultar/mostrar y reordenar columnas; persiste en localStorage (o tu propio `ColumnStorage`).
- **Exportar a CSV** — agrega un botón de exportación en el toolbar con `export`: página actual por defecto; "exportar todo" se autodetecta para `data` en memoria, o se conecta con `fetchAll` para una fuente en el servidor (sin recorrer el adaptador página por página). Respeta las columnas visibles y su orden, con `exportValue`/`exportable` por columna.
- **Selección de filas y acciones masivas** — `selection` agrega checkboxes y una barra de selección con tus acciones masivas. La selección es por clave, sobrevive a la paginación y se limpia cuando cambia el dataset; combina con "exportar selección".
- **Imágenes optimizadas** — `<ListImage>` para tablas/tarjetas densas: lazy-load, decodificación asíncrona, placeholder shimmer, fallback de error y un slot para inyectar `next/image`.
- **Encabezado fijo, densidad, reordenar y redimensionar** — opciones opcionales de `table` (`stickyHeader`, `density`, `reorderable`, `resizable`); las elecciones del usuario persisten en localStorage.
- **Filtros colapsables + búsqueda rápida** — los sidebars largos tienen secciones colapsables (`collapsible`) y una caja de búsqueda de filtros.
- **Slider de rango** — un filtro `number-range` puede renderizar como slider de dos manijas (`display: 'slider'`, `min`/`max`/`step`/`formatValue`).
- **Componible + type-safe** — usa `<ListView>`, o baja de nivel a `Toolbar`, `Table`, `Cards`, `Pagination`, `FilterSidebar`, …

---

## Inicio rápido

```bash
pnpm add @pibytelabs/listkit react react-dom lucide-react tailwindcss
```

```css
/* app/globals.css */
@import 'tailwindcss';
@import '@pibytelabs/listkit/tailwind.css';
```

```tsx
// app/providers.tsx
'use client'
import { ListKitProvider, useNextRouterAdapter } from '@pibytelabs/listkit'

export function Providers({ children }) {
	return (
		<ListKitProvider router={useNextRouterAdapter()} theme='blue'>
			{children}
		</ListKitProvider>
	)
}
```

```tsx
// app/page.tsx
import { ListView } from '@pibytelabs/listkit'

export default function Page() {
	return <ListView config={productsConfig} data={products} />
}
```

---

## Instalación

```bash
pnpm add @pibytelabs/listkit
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
@import '@pibytelabs/listkit/tailwind.css';
```

Los estilos de `react-datepicker` se inyectan automáticamente en runtime (seguros para SSR), así que no necesitas importar CSS adicional.

---

## Uso

### 1. Conectar el provider (una vez, en la raíz de la app)

El provider suministra el adaptador de router (sincronización con URL) y un tema opcional por defecto.

```tsx
'use client'
import { ListKitProvider, useNextRouterAdapter } from '@pibytelabs/listkit'

export function Providers({ children }) {
	return (
		<ListKitProvider router={useNextRouterAdapter()} theme='blue'>
			{children}
		</ListKitProvider>
	)
}
```

¿Sin framework? Usa `useBrowserRouterAdapter()` (History API). ¿React Router? `useReactRouterAdapter()`. Omite `router` por completo y el estado permanece en estado local de React (sin sincronización con URL).

### 2. Renderizar una lista

`<ListView>` recibe una config más `data` (en memoria) o `adapter` (asíncrono).

```tsx
import { ListView } from '@pibytelabs/listkit'
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

### Imágenes optimizadas (`ListImage`)

Para tablas/tarjetas densas llenas de miniaturas, `<ListImage>` reserva su caja (sin layout shift), hace lazy-load y decodificación asíncrona, muestra un placeholder shimmer y cae en un fallback ante errores:

```tsx
import { ListImage } from '@pibytelabs/listkit'

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

Todo opcional vía `table.*`, y todo persistido en localStorage junto al gestor de columnas:

```tsx
table: {
  columnControl: true,  // ocultar/mostrar + reordenar desde el menú de opciones
  reorderable: true,    // arrastra los encabezados para reordenar
  resizable: true,      // arrastra el borde de una columna para redimensionar
  density: true,        // toggle cómoda/compacta
  defaultDensity: 'comfortable',
  stickyHeader: true,     // el encabezado permanece visible mientras la tabla hace scroll
  maxBodyHeight: '70vh',  // altura del área de scroll del encabezado fijo (por defecto '70vh')
  columns,
}
```

- `stickyHeader` le da a la tabla un área de scroll acotada (limitada por `maxBodyHeight`, por defecto `'70vh'`) para que el encabezado quede fijo arriba y la barra de paginación abajo — ambos visibles mientras haces scroll. El scroll horizontal queda contenido en la misma caja, así una tabla ancha nunca se desborda fuera de la página en pantallas pequeñas. Solo en vista de tabla.
- `density` + `defaultDensity` exponen el toggle cómoda ↔ compacta (sobrescribe el `compact` estático).
- `reorderable` / `resizable` agregan reordenar arrastrando encabezados y redimensionar por el borde; los anchos redimensionados persisten por columna.

> **El toolbar se mantiene limpio.** Densidad, columnas y exportar no agregan un botón cada uno — `<ListView>` los pliega en un único menú de **opciones** (⚙), dejando inline solo lo esencial (toggle de vista, conteo de resultados). Es responsivo (disponible también en móvil) y en vista de tarjetas muestra solo exportar. Los componentes `DensityToggle`, `ColumnManager`, `ExportButton` y `TableOptionsMenu` se exportan por si construyes tu propio toolbar.

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
import { useListRefresh } from '@pibytelabs/listkit'

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
- O invalida imperativamente desde cualquier lugar: `import { invalidateListCache } from '@pibytelabs/listkit'` y luego `invalidateListCache('tu-config-id')` (omite el id para limpiar todas las listas, ej. al cerrar sesión).

Las listas en memoria (prop `data`) se refrescan automáticamente cuando `data` cambia — esto solo es necesario para adaptadores asíncronos.

### Desplazar la barra de paginación

La barra de paginación usa `position: fixed`. Pasa `paginationClassName` para despejar elementos de la app como una sidebar (mergeado vía tailwind-merge, así que un `left-*` sobrescribe el `left-0` por defecto):

```tsx
<ListView config={config} adapter={adapter} paginationClassName='lg:left-64' />
```

Para una sidebar cuyo ancho cambia (colapsable), manéjalo con una variable CSS que la sidebar establezca y una clase que la lea, ej. `left-[var(--sidebar-w)]`.

### Datos asíncronos (server-side)

```tsx
import { serverActionAdapter } from '@pibytelabs/listkit'

const adapter = serverActionAdapter<Product>(async query => {
  const { rows, total } = await listProductsAction(query) // page/pageSize/search/filters
  return { data: rows, total }
})

<ListView config={productsConfig} adapter={adapter} />
```

### Backend MongoDB (`@pibytelabs/listkit/mongo`)

El front-end es el mismo en cualquier app de React (`fetchAdapter` → tu endpoint REST). En el servidor, traduce el `ListQuery` entrante a objetos planos de Mongo con `@pibytelabs/listkit/mongo` — **sin dependencia de `mongoose`/driver** y nunca ejecuta una query, así que funciona con Mongoose o el driver nativo. Los nombres de campo provienen solo de listas blancas que tú controlas (sin inyección NoSQL) y los valores de texto se escapan para regex.

```ts
import { buildMongoQuery } from '@pibytelabs/listkit/mongo'

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

Una entrada del field map es una ruta string de confianza, `{ path, build }` para personalizar la expresión de **un** campo, o `{ match }` para construir una condición **completa** fusionada tal cual — esto último es cómo un solo filtro abarca varios campos (buckets calculados, reglas entre campos). Combina condiciones extra (alcance de auth, id de tenant, un `$in` por referencia de una colección anidada) con `combineFilters`, y usa los helpers de más bajo nivel `buildMongoFilter` / `buildMongoSort` / `mongoPaginate` / `existenceMatch` cuando necesites control fino.

### Renderizado en servidor (`initialData`)

Por defecto la lista fetchea en el **cliente**: el servidor renderiza un shell vacío/cargando y las filas aparecen después de la hidratación. Para SEO, una primera pintura más rápida y sin flash de carga, obten la **primera página en el servidor** y pásala a `<ListView>` como `initialData` — renderiza esas filas en el HTML inicial y **omite el primer fetch del cliente**. La paginación y filtrado posterior siguen ejecutándose en el cliente.

El problema: el servidor debe calcular la **misma query** que el cliente derivará de la URL, o ambos renders no coincidirán y React advertirá sobre un hydration mismatch. `buildListQuery` (desde `@pibytelabs/listkit/server`) hace exactamente eso — usa su resultado tanto para fetchear como para `initialQuery`:

```tsx
// app/orders/page.tsx — un React Server Component
import { buildListQuery } from '@pibytelabs/listkit/server'
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
> `defineListConfig` desde **`@pibytelabs/listkit/server`** (no la entrada principal).
> La entrada principal arrastra contexto de cliente (`createContext`) y haría crash
> el render de RSC. Tanto la página del servidor como la vista de lista del cliente
> pueden importar el mismo módulo de config cuando se define de esta manera.

```tsx
// config.ts — compartido por la página del servidor y la vista de lista del cliente
import { defineListConfig } from '@pibytelabs/listkit/server'
export const ordersConfig = defineListConfig<Order>({
	/* … */
})
```

```tsx
// OrdersList.tsx — un Client Component
'use client'
import { ListView, serverActionAdapter } from '@pibytelabs/listkit'
import type { ListQuery, ListResult } from '@pibytelabs/listkit'
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

- **`NextListView`** (`@pibytelabs/listkit/next`) — `<ListView>` pre-cableado con el adaptador de App Router, así que búsqueda/página/filtros/sort se sincronizan con la URL. Sin `ListKitProvider` + `useNextRouterAdapter` manuales. Pasa `theme` aquí, o ponlo una vez en un `<ListKitProvider theme={…}>` raíz y `NextListView` lo hereda (un provider hereda cualquier prop que no pases).
- **`loadInitialList(config, searchParams, fetcher)`** (`@pibytelabs/listkit/server`) — envuelve `buildListQuery` + el fetch de primera página y degrada a un fetch del cliente en caso de error. Retorna `{ initialData, initialQuery }`.
- **`ListSkeleton`** (`@pibytelabs/listkit`) — un fallback de `<Suspense>` listo para usar (barra de toolbar + tabla esqueleto) para el patrón de SSR streaming.

```tsx
// app/orders/page.tsx — Server Component
import { Suspense } from 'react'
import { loadInitialList } from '@pibytelabs/listkit/server'
import { ListSkeleton } from '@pibytelabs/listkit'
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
import { NextListView } from '@pibytelabs/listkit/next'
import { serverActionAdapter } from '@pibytelabs/listkit'
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

### Uso con TanStack Query

Si tu app ya usa TanStack Query y quieres su caché entre componentes, refetch en segundo plano, reintentos y devtools, respalda tus listas con React Query en lugar de la caché integrada. Importa el hook ya hecho desde `@pibytelabs/listkit/react-query` — no hace falta escribir uno a mano:

```tsx
import { ListView } from '@pibytelabs/listkit'
import {
	useReactQueryListData,
	invalidateList,
} from '@pibytelabs/listkit/react-query'

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
import type { UseListDataHook } from '@pibytelabs/listkit'

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
import { useListRefresh } from '@pibytelabs/listkit'

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
import type { UseListDataHook } from '@pibytelabs/listkit'

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

| Ruta de importación                | Contenido                                                                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `@pibytelabs/listkit`              | `ListView`, `defineListConfig`, `ListKitProvider`, `ListSkeleton`, `invalidateListCache`, adapters, hooks, primitives, types                 |
| `@pibytelabs/listkit/next`         | `useNextRouterAdapter`, `NextListView`                                                                                                       |
| `@pibytelabs/listkit/react-router` | `useReactRouterAdapter`                                                                                                                      |
| `@pibytelabs/listkit/adapters`     | `memoryAdapter`, `fetchAdapter`, `serverActionAdapter`, `createDexieAdapter`                                                                 |
| `@pibytelabs/listkit/server`       | `buildListQuery`, `loadInitialList`, `defineListConfig` — seguro para RSC (sin React/DOM)                                                    |
| `@pibytelabs/listkit/query`        | `filtersById`, `getString`/`getBoolean`/`getStringArray`/`getDateRange`/`getNumberRange`/`getText`, `paginate` — leer filtros de `ListQuery` |
| `@pibytelabs/listkit/sql`          | `buildOrderBy`, `textCondition` — fragmentos de query con sabor a Postgres                                                                   |
| `@pibytelabs/listkit/mongo`        | `buildMongoQuery`, `buildMongoFilter`, `buildMongoSort`, `mongoPaginate`, `combineFilters`, `escapeRegex` — objetos de query de MongoDB      |
| `@pibytelabs/listkit/react-query`  | `useReactQueryListData`, `invalidateList`, `listQueryKey` — respalda listas con TanStack Query                                               |
| `@pibytelabs/listkit/tailwind.css` | Registro de fuente Tailwind v4                                                                                                               |

---

## Licencia

MIT © Pibyte Labs
