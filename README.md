# Novu

Aplicación de finanzas personales y productividad: registra ingresos y gastos,
controla tus cuentas, ahorra para metas, lleva tus suscripciones, define
presupuestos por categoría y organiza tus tareas, todo en un solo lugar.

Proyecto educativo y de portafolio de **Steven David Álvarez Morante**.

**Stack:** React 19 · Vite 8 · React Router 7 · Supabase (Postgres + Auth) ·
Recharts · Vitest · desplegado en Vercel.

---

## Funcionalidades

| Módulo | Qué hace |
|--------|----------|
| **Inicio** | Balance total, ingresos y gastos del mes con comparación contra el mes anterior, gráficas por semana/mes/año, gastos por categoría, metas y próximos pagos |
| **Movimientos** | Ingresos y gastos por categoría y cuenta, edición (corrige el saldo aunque cambie la cuenta), búsqueda, paginación y exportación a CSV |
| **Cuentas** | Débito, efectivo y crédito; transferencias entre cuentas; activos frente a deudas |
| **Metas** | Objetivo, fecha límite y aportes desde una cuenta |
| **Suscripciones** | Frecuencia diaria/semanal/mensual, días para la renovación y pago con un clic (descuenta de la cuenta y avanza la fecha) |
| **Presupuestos** | Límite mensual por categoría con estados *en orden / cerca del límite / excedido* |
| **Calendario** | Movimientos, metas, suscripciones y tareas en una vista mensual |
| **Tareas** | Con prioridad, categoría y fecha límite |
| **Administración** | Panel para administradores: usuarios, habilitar/deshabilitar cuentas, roles y cifras globales |
| **Ajustes** | Perfil, tema claro/oscuro, paletas de color, idioma español/inglés y cambio de contraseña |

---

## Puesta en marcha

Requisitos: **Node 20.19+** (o 22+) y un proyecto de [Supabase](https://supabase.com).

```bash
npm install
npm run dev        # http://localhost:5173
```

La URL y la clave pública (`anon`) de Supabase están en `src/supabase.js`. Esa
clave está pensada para ir en el navegador: **la seguridad la dan las políticas
RLS de la base de datos**, no mantenerla oculta (ver abajo).

### Scripts

| Comando | Para qué |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run preview` | Sirve la compilación localmente |
| `npm run lint` | ESLint |
| `npm test` | Tests (Vitest) |
| `npm run test:watch` | Tests en modo observación |
| `npm run test:db` | Prueba la migración v3 en un Postgres embebido (PGlite) |

---

## Base de datos

Las migraciones están en `database/`. Se ejecutan en Supabase → **SQL Editor**,
en este orden, y todas se pueden volver a ejecutar sin romper nada:

1. `migracion_perfil_categorias.sql` — perfil del usuario y categorías propias.
2. `migracion_perfil_columnas_v2.sql` — columnas extra del perfil y rol de administrador.
3. `migracion_presupuestos.sql` — tabla de presupuestos.
4. **`migracion_v3_saldos_y_seguridad.sql`** — la importante:
   - **Saldos atómicos** (`ajustar_saldo`, `ajustar_meta`): la suma ocurre dentro
     de Postgres (`saldo = saldo + delta`), así dos dispositivos abiertos a la vez
     no se pisan los movimientos.
   - **Renombrar cuentas** (`renombrar_cuenta`): cambia el nombre en la cuenta y en
     todos sus movimientos, suscripciones y transferencias, en una sola transacción.
   - **Nombres de cuenta únicos** por usuario.
   - **RLS en todas las tablas**: cada usuario sólo ve y modifica sus filas, y una
     cuenta deshabilitada no puede leer ni escribir nada.
   - **Funciones de administración** (`admin_*`), que comprueban el rol en el servidor.

La app funciona antes de ejecutar la v3 (usa el método anterior para los saldos);
al ejecutarla pasa sola a usar las funciones atómicas.

### Nombrar al primer administrador

Después de ejecutar la v3, en el SQL Editor:

```sql
UPDATE public.perfiles SET rol = 'admin'
 WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tu-correo@gmail.com');
```

Cierra sesión y vuelve a entrar: aparece **Panel admin** en el menú. Desde ahí se
pueden nombrar otros administradores. Por privacidad, el panel muestra cifras
globales y datos de cuenta, nunca los movimientos ni saldos de cada persona.

---

## Decisiones técnicas

- **Fechas de calendario sin zona horaria** (`src/utils/fechas.js`). JavaScript
  interpreta `2026-09-24` como medianoche UTC, que en Colombia es el día anterior.
  Las fechas se guardan como `YYYY-MM-DD` y se leen como ese día local.
- **Cambios de dinero verificados paso a paso** (`src/utils/saldos.js`): si un paso
  de una transferencia o un pago falla, se deshacen los anteriores.
- **Páginas bajo demanda** (`React.lazy`): quien entra a la portada no descarga el
  panel ni las gráficas.
- **Accesibilidad**: los desplegables y selectores se usan con teclado y los
  anuncian los lectores de pantalla.

---

## Tests

```bash
npm test
```

Cubren la lógica donde un error cuesta dinero o datos: fechas y zona horaria,
ajustes de saldo (con y sin la migración v3, y la reversión cuando un paso
falla), renombrado de cuentas, costo mensual de suscripciones, paginación y
detección de marcas. Se ejecutan con la zona horaria de Bogotá fijada en
`vite.config.js`, para que den lo mismo en cualquier máquina.

`npm run test:db` ejecuta la migración v3 en un Postgres real embebido (PGlite),
dos veces seguidas, y comprueba como dos usuarios y un administrador que RLS, los
saldos atómicos, el renombrado de cuentas y las funciones de administración se
comportan como deben. No toca la base de datos real.

GitHub Actions ejecuta lint, tests, la prueba de la migración y la compilación en
cada push y pull request (`.github/workflows/ci.yml`).

---

## Estructura

```
src/
├── pages/        Una página por sección (Inicio, Movimientos, Cuentas, Admin…)
├── components/   Piezas reutilizables (Sidebar, ModalAgregar, formularios, Selectores…)
├── Context/      Avisos (toasts) y confirmaciones
├── i18n/         Textos en español e inglés
├── hooks/        useTour
└── utils/        Lógica sin interfaz: fechas, saldos, cuentas, paginación… (con sus tests)
database/         Migraciones SQL de Supabase
supabase/         Edge Function para eliminar la cuenta
```
