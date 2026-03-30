# Properties 714 Dashboard — Setup Guide

## Paso 1: Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → New Project
2. Nombre: `properties714` | Región: `US East (N. Virginia)`
3. Guarda la contraseña de base de datos

---

## Paso 2: Ejecutar el schema de base de datos

1. En Supabase → **SQL Editor** → New Query
2. Pega el contenido completo de `supabase/schema.sql`
3. Click **Run** (debe ejecutarse sin errores)

Esto crea:
- `profiles` — usuarios con roles (owner / acquisitionist)
- `acquisitions_leads` — tabla principal de propiedades
- `lead_notes` + `lead_activity` — historial y notas
- `deals` + `crm_contacts` — Fase 2
- Row Level Security en todas las tablas
- Trigger para auto-crear perfil al registrarse

---

## Paso 3: Configurar credenciales

1. Supabase → **Settings → API**
2. Copia:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public** key → clave larga que empieza con `eyJ...`
3. Edita `js/config.js`:

```javascript
window.__P714_CONFIG__ = {
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIs...',
};
```

---

## Paso 4: Crear tu cuenta de Owner

**Opción A — Desde Supabase Dashboard:**
1. Supabase → **Authentication → Users → Invite User**
2. Ingresa tu email → Send Invitation
3. Acepta el link en tu email y pon una contraseña
4. Luego en **SQL Editor** ejecuta:

```sql
-- Cambiar tu rol a owner (reemplaza con tu email)
UPDATE profiles
SET role = 'owner', full_name = 'Eduardo'
WHERE email = 'tu@email.com';
```

**Opción B — Directo en SQL:**
```sql
-- Solo si tienes acceso a Supabase Auth SQL
SELECT id FROM auth.users WHERE email = 'tu@email.com';

UPDATE profiles
SET role = 'owner', full_name = 'Eduardo'
WHERE id = 'UUID_DEL_PASO_ANTERIOR';
```

---

## Paso 5: Crear cuentas de Adquisicionistas

1. Supabase → **Authentication → Users → Invite User**
2. Ingresa el email del adquisicionista
3. El perfil se crea automáticamente con rol `acquisitionist`
4. (Opcional) Actualizar su nombre:

```sql
UPDATE profiles
SET full_name = 'Junior'
WHERE email = 'junior@email.com';
```

---

## Paso 6: Verificar Email Confirmation (importante)

Para que el sistema funcione bien sin confirmaciones de email:

1. Supabase → **Authentication → Providers → Email**
2. Desactivar **"Confirm email"** (o dejar activado si prefieres confirmación)

---

## Paso 7: Deploy en EasyPanel

El Docker/nginx ya está configurado. Solo asegúrate de que `js/config.js`
tiene las credenciales correctas antes de hacer deploy.

```bash
git add js/config.js
git commit -m "feat: configure Supabase credentials"
git push
```

EasyPanel detectará el push y redesplegará automáticamente.

---

## Estructura de Roles

| Role | Ve | Puede |
|------|----|-------|
| `owner` | Todas las propiedades del equipo | Todo + gestión de usuarios |
| `acquisitionist` | Solo sus propias propiedades | CRUD de sus leads |

---

## Estructura del sistema

```
/               Dashboard principal (KPIs en tiempo real)
/login/         Pantalla de login
/acquisitions/  Pipeline de adquisiciones con scoring
/leads/         CRM de contactos (Fase 2)
/deals/         Closing tracker (Fase 2)
/reports/       Reportes por agente (Fase 3)
/settings/      Gestión de usuarios (Fase 3)
```
