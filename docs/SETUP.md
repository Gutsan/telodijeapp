# 🚀 Guía de Configuración - Telodije

**Guía paso a paso para configurar y ejecutar la app Telodije en tu máquina.**

**Tiempo estimado total:** ~40 minutos

---

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#1-prerrequisitos)
2. [Instalación del Proyecto](#2-instalación-del-proyecto)
3. [Configurar Supabase (Base de Datos + Auth)](#3-configurar-supabase-base-de-datos--auth)
4. [Configurar Google OAuth](#4-configurar-google-oauth)
5. [Configurar Variables de Entorno](#5-configurar-variables-de-entorno)
6. [Ejecutar la App](#6-ejecutar-la-app)
7. [Configurar SuperAdmin](#7-configurar-superadmin)
8. [Verificar el Funcionamiento](#8-verificar-el-funcionamiento)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerrequisitos

Antes de empezar, asegúrate de tener:

| Requisito | Versión mínima | Cómo verificar | Descarga |
|-----------|----------------|----------------|----------|
| **Node.js** | 18+ | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ | `npm --version` | Se instala con Node.js |
| **Git** | 2.x | `git --version` | [git-scm.com](https://git-scm.com) |
| **Cuenta Supabase** | Gratis | N/A | [supabase.com](https://supabase.com) |
| **Cuenta Google** | Gmail | N/A | [console.cloud.google.com](https://console.cloud.google.com) |

---

## 2. Instalación del Proyecto

### 2.1 Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/telodije.git
cd telodije
```

### 2.2 Instalar dependencias

```bash
npm install
```

### 2.3 Verificar que se instala correctamente

```bash
npm ls zustand expo react-native
```

Deberías ver las versiones instaladas sin errores.

---

## 3. Configurar Supabase (Base de Datos + Auth)

### 3.1 Crear Proyecto

1. Ir a [supabase.com](https://supabase.com) e inicia sesión
2. Click en **"New Project"** (esquina superior derecha)
3. Completa los datos:

| Campo | Valor |
|-------|-------|
| **Organization** | Selecciona o crea una |
| **Project name** | `telodije` |
| **Database Password** | Genera una contraseña segura (guárdala) |
| **Region** | La más cercana a tus usuarios |

4. Click en **"Create new project"**
5. Espera ~2 minutos a que se cree

### 3.2 Obtener Credenciales

Una vez creado el proyecto:

1. Ir a **Settings** → **API** (menú izquierdo)
2. Copia estos valores:

| Campo | Ubicación | Ejemplo |
|-------|-----------|---------|
| **Project URL** | Settings → API → Project URL | `https://abcdefghij.supabase.co` |
| **anon public key** | Settings → API → Project API keys → anon public | `eyJhbGciOiJIUzI1NiIs...` |

> ⚠️ **Guarda estos valores**. Los necesitarás en el Paso 5.

### 3.3 Ejecutar Migraciones SQL

Ve al **SQL Editor** de Supabase (menú izquierdo) y ejecuta **en orden**:

#### Migración 1: Schema inicial

Copia y pega **todo** el siguiente SQL en el SQL Editor, y haz click en **"Run"**:

```sql
-- ===========================================
-- TELODIJE - INITIAL SCHEMA
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50),
  provider_id VARCHAR(255),
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);

-- MATCHES TABLE
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(100) UNIQUE,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  league VARCHAR(255),
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league);

-- QUINIELAS TABLE
CREATE TABLE IF NOT EXISTS quinielas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT true,
  max_players INTEGER DEFAULT 10,
  invite_code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quinielas_created_by ON quinielas(created_by);
CREATE INDEX IF NOT EXISTS idx_quinielas_invite_code ON quinielas(invite_code);

-- QUINIELA_PLAYERS TABLE
CREATE TABLE IF NOT EXISTS quiniela_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('owner', 'admin', 'player')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiniela_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_qp_quiniela_id ON quiniela_players(quiniela_id);
CREATE INDEX IF NOT EXISTS idx_qp_user_id ON quiniela_players(user_id);

-- QUINIELA_MATCHES TABLE
CREATE TABLE IF NOT EXISTS quiniela_matches (
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  PRIMARY KEY (quiniela_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_qm_quiniela_id ON quiniela_matches(quiniela_id);
CREATE INDEX IF NOT EXISTS idx_qm_match_id ON quiniela_matches(match_id);

-- PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  home_score_prediction INTEGER NOT NULL CHECK (home_score_prediction >= 0),
  away_score_prediction INTEGER NOT NULL CHECK (away_score_prediction >= 0),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiniela_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_quiniela ON predictions(user_id, quiniela_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);

-- RANKINGS TABLE
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiniela_id UUID REFERENCES quinielas(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  exact_predictions INTEGER DEFAULT 0,
  position INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiniela_id)
);

CREATE INDEX IF NOT EXISTS idx_rankings_quiniela ON rankings(quiniela_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_user ON rankings(user_id);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quinielas_updated_at
  BEFORE UPDATE ON quinielas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE quinielas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiniela_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiniela_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert matches" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan_type = 'premium')
  );

CREATE POLICY "Only admins can update matches" ON matches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.plan_type = 'premium')
  );

CREATE POLICY "Users can view public quinielas" ON quinielas
  FOR SELECT USING (
    is_private = false
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM quiniela_players WHERE quiniela_players.quiniela_id = quinielas.id AND quiniela_players.user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create quinielas" ON quinielas
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their quinielas" ON quinielas
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their quinielas" ON quinielas
  FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Users can view quiniela members" ON quiniela_players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quiniela_players qp WHERE qp.quiniela_id = quiniela_players.quiniela_id AND qp.user_id = auth.uid())
  );

CREATE POLICY "Users can join quinielas" ON quiniela_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave quinielas" ON quiniela_players
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view quiniela rankings" ON rankings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quiniela_players WHERE quiniela_players.quiniela_id = rankings.quiniela_id AND quiniela_players.user_id = auth.uid())
  );
```

#### Migración 2: Triggers de Auth

Ejecuta el siguiente SQL en el SQL Editor:

```sql
-- ===========================================
-- TRIGGER: Sync profile on user creation
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, provider, provider_id, plan_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
    NEW.raw_user_meta_data->>'provider_id',
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider,
    provider_id = EXCLUDED.provider_id,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- FUNCTION: Sync profile on user update
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', full_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', avatar_url),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();
```

> ✅ **Verificación:** En Supabase ve a **Table Editor** y deberías ver las 7 tablas: `users`, `matches`, `quinielas`, `quiniela_players`, `quiniela_matches`, `predictions`, `rankings`.

### 3.4 (Opcional) Cargar Datos de Prueba

Si quieres datos de ejemplo para probar, ejecuta el siguiente SQL:

```sql
-- DATOS DE PRUEBA

-- Usuarios de prueba (solo para la tabla users, NO auth)
INSERT INTO users (id, email, full_name, avatar_url, provider, plan_type) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@telodije.com', 'Super Admin', NULL, 'email', 'premium'),
  ('550e8400-e29b-41d4-a716-446655440002', 'juan@example.com', 'Juan Pérez', NULL, 'email', 'free'),
  ('550e8400-e29b-41d4-a716-446655440003', 'maria@example.com', 'María García', NULL, 'google', 'free');

-- Partidos de prueba
INSERT INTO matches (id, external_id, home_team, away_team, league, match_date, status, home_score, away_score) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'ext-001', 'Real Madrid', 'FC Barcelona', 'La Liga', NOW() + INTERVAL '2 days', 'scheduled', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440002', 'ext-002', 'Manchester City', 'Liverpool FC', 'Premier League', NOW() + INTERVAL '3 days', 'scheduled', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440003', 'ext-003', 'Bayern Munich', 'Borussia Dortmund', 'Bundesliga', NOW() + INTERVAL '4 days', 'scheduled', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440004', 'ext-004', 'PSG', 'Olympique Marsella', 'Ligue 1', NOW() + INTERVAL '5 days', 'scheduled', NULL, NULL),
  ('660e8400-e29b-41d4-a716-446655440005', 'ext-005', 'Juventus', 'AC Milan', 'Serie A', NOW() + INTERVAL '6 days', 'scheduled', NULL, NULL);

-- Quiniela general de prueba
INSERT INTO quinielas (id, name, description, created_by, is_private, max_players, invite_code) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'Quiniela General Semanal', 'Quiniela oficial de la semana', '550e8400-e29b-41d4-a716-446655440001', false, 100, 'GENERAL');

-- Relacionar partidos con la quiniela
INSERT INTO quiniela_matches (quiniela_id, match_id) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002'),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003'),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004'),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005');
```

### 3.5 Habilitar Auth Email/Password

1. Ve a **Authentication** → **Providers** (menú izquierdo)
2. Verifica que **Email** esté habilitado (viene habilitado por defecto)
3. Configura estas opciones:

| Opción | Valor para desarrollo | Valor para producción |
|--------|----------------------|----------------------|
| **Confirm email** | `false` (para no tener que confirmar) | `true` |
| **Allow sign up** | `true` | `true` |
| **Minimum password length** | `6` | `8` |

4. Click en **"Save"**

> ✅ **Verificación:** Deberías poder registrar un usuario desde la app sin problema.

---

## 4. Configurar Google OAuth

### 4.1 Crear Proyecto en Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Click en el selector de proyectos (esquina superior) → **"New Project"**
3. Completa:

| Campo | Valor |
|-------|-------|
| **Project name** | `Telodije` |
| **Organization** | Tu organización (o ninguna) |
| **Location** | Tu ubicación |

4. Click en **"Create"**
5. Espera a que se cree y selecciónalo

### 4.2 Habilitar APIs

1. Ve a **APIs & Services** → **Library**
2. Busca **"Google+ API"** o **"People API"**
3. Click en **"Enable"**

### 4.3 Crear OAuth Credentials

1. Ve a **APIs & Services** → **Credentials**
2. Click en **"+ Create Credentials"** → **"OAuth client ID"**
3. Si te pide, primero configura la **Pantalla de consentimiento** (ver paso 4.4)
4. Selecciona:

| Campo | Valor |
|-------|-------|
| **Application type** | `Web application` |
| **Name** | `Telodije Web` |

5. En **"Authorized JavaScript origins"** agrega:
   - `http://localhost:8081` (desarrollo)
   - `https://telodije.app` (producción, si aplica)

6. En **"Authorized redirect URIs"** agrega la URL de callback de Supabase:
   - `https://TU-PROYECTO.supabase.co/auth/v1/callback`
   - **Reemplaza** `TU-PROYECTO` con el nombre de tu proyecto Supabase

7. Click en **"Create"**
8. **Copia el Client ID** (lo necesitarás en el Paso 5)

> ⚠️ **El Client Secret NO se necesita** porque Supabase maneja la autenticación del lado del servidor.

### 4.4 Configurar Pantalla de Consentimiento

1. Ve a **APIs & Services** → **OAuth consent screen**
2. Selecciona **"External"**
3. Completa:

| Campo | Valor |
|-------|-------|
| **App name** | `Telodije` |
| **User support email** | Tu email |
| **Developer contact** | Tu email |

4. Click en **"Save and Continue"**
5. En **Scopes**, agrega:
   - `openid`
   - `email`
   - `profile`
6. Click en **"Save and Continue"**
7. En **Test users**, agrega los emails que quieras probar
8. Click en **"Save and Continue"**

### 4.5 Configurar Redirect URI en Supabase

1. Ve a tu Supabase Dashboard → **Authentication** → **URL Configuration**
2. En **"Redirect URLs"**, agrega:
   - `http://localhost:8081/**`
3. Click en **"Save"**

> ✅ **Verificación:** El botón "Continuar con Google" debería iniciar el flujo de autenticación sin errores.

---

## 5. Configurar Variables de Entorno

### 5.1 Crear el archivo `.env.local`

Desde la raíz del proyecto, ejecuta:

```bash
cp .env.example .env.local
```

### 5.2 Rellenar las credenciales

Abre `.env.local` y rellena:

```env
# ===========================================
# TELODIJE - VARIABLES DE ENTORNO
# ===========================================

# Supabase (del Paso 3.2)
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU-ANON-KEY-AQUI

# Google OAuth (del Paso 4.3)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=TU-CLIENT-ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=TU-CLIENT-ID.apps.googleusercontent.com

# Football API (Opcional - del Paso 9 si lo configuras)
EXPO_PUBLIC_FOOTBALL_API_KEY=tu-api-key
EXPO_PUBLIC_FOOTBALL_API_URL=https://api.football-data.org/v4

# Build
APP_VARIANT=development
```

### 5.3 Tabla Resumen de Variables

| Variable | Obligatoria | Fuente | Descripción |
|----------|:-----------:|--------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Settings → API | URL del proyecto |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Settings → API | Key pública anon |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | ⚠️ Si usas Google | Google Cloud Console | Client ID OAuth |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | ⚠️ Si usas Google | Google Cloud Console | Client ID iOS |
| `EXPO_PUBLIC_FOOTBALL_API_KEY` | ❌ Opcional | football-data.org | API de fútbol |
| `EXPO_PUBLIC_FOOTBALL_API_URL` | ❌ Opcional | Ya preconfigurada | URL API fútbol |

> ⚠️ **NUNCA** subas el archivo `.env.local` a Git. Ya está en `.gitignore`.

---

## 6. Ejecutar la App

### 6.1 Modo Desarrollo (Web)

```bash
npm run web
```

Abre tu navegador en **http://localhost:8081**

### 6.2 Build de Producción (PWA)

```bash
npm run build:web
```

El build se genera en la carpeta `dist/`.

### 6.3 Desplegar en Vercel (Opcional)

1. Instala Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Despliega:
   ```bash
   vercel --prod
   ```

3. Configura las variables de entorno en el dashboard de Vercel

---

## 7. Configurar SuperAdmin

Para marcar un usuario como **SuperAdmin** (premium), ejecuta el siguiente SQL en el **SQL Editor** de Supabase:

### 7.1 Marcar usuario existente como premium

```sql
-- Reemplaza el email con el email del usuario que quieras marcar como admin
UPDATE users 
SET plan_type = 'premium' 
WHERE email = 'admin@telodije.com';
```

### 7.2 Verificar que quedó como premium

```sql
SELECT id, email, full_name, plan_type FROM users WHERE plan_type = 'premium';
```

> ✅ **Verificación:** El usuario con `plan_type = 'premium'` podrá:
> - Crear partidos (Panel Admin)
> - Actualizar marcadores
> - Crear quinielas sin límite de invitados

---

## 8. Verificar el Funcionamiento

### Checklist de Verificación

Marca cada punto cuando lo confirmes:

| # | Verificación | Cómo verificar |
|---|-------------|----------------|
| 1 | ✅ Las dependencias están instaladas | `npm ls zustand` no da error |
| 2 | ✅ Las tablas existen en Supabase | En Table Editor ves las 7 tablas |
| 3 | ✅ Los triggers están activos | En Database → Triggers ves `on_auth_user_created` |
| 4 | ✅ RLS está habilitado | En Table Editor → policies ves las políticas |
| 5 | ✅ Auth Email está habilitado | En Authentication → Providers ves Email activo |
| 6 | ✅ Google OAuth funciona | El botón "Continuar con Google" inicia el flujo |
| 7 | ✅ Se puede registrar | Crear una cuenta con email/password |
| 8 | ✅ Se puede iniciar sesión | Login con las credenciales creadas |
| 9 | ✅ El Home carga | Se ve el dashboard con el nombre del usuario |
| 10 | ✅ Se puede crear quiniela | Click en "Crear Quiniela" y se genera código |

---

## 9. Troubleshooting

### Errores Comunes

#### ❌ `Unable to resolve module zustand`

**Solución:**
```bash
npm install zustand
```

#### ❌ `Unable to resolve module expo-auth-session`

**Solución:**
```bash
npx expo install expo-auth-session
```

#### ❌ `window is not defined` (durante build)

**Causa:** El Static Rendering está habilitado y Supabase intenta acceder a `window` en el servidor.

**Solución:** Verifica que en `app.json` la propiedad `web.output` sea `"single"` (no `"static"`):
```json
"web": {
  "output": "single"
}
```

#### ❌ `Error: Invalid login credentials`

**Causas posibles:**
1. Las credenciales de Supabase en `.env.local` son incorrectas
2. El usuario no existe (regístralo primero)
3. La contraseña es incorrecta

**Solución:** Verifica que `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` sean correctas.

#### ❌ `Failed to fetch` o errores de red

**Solución:**
1. Verifica tu conexión a internet
2. Verifica que la URL de Supabase sea correcta
3. Revisa que no haya un firewall bloqueando

#### ❌ `Google Sign-In was cancelled`

**Causa:** El usuario canceló el popup de Google.

**Solución:** Normal durante testing. Si persiste, verifica los Redirect URIs.

#### ❌ `RLS policy violation`

**Causa:** Las políticas de seguridad están bloqueando la operación.

**Solución:**
1. Verifica que el usuario esté autenticado
2. Verifica que las políticas RLS sean correctas
3. Para testing, puedes deshabilitar RLS temporalmente:
   ```sql
   ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;
   ```

#### ❌ Errores de TypeScript (`npx tsc --noEmit`)

**Solución:** La mayoría de errores son por tipos faltantes. Puedes ignorarlos para desarrollo. Para producción:
```bash
npx tsc --noEmit --skipLibCheck
```

---

## 🎉 ¡Listo!

Si completaste todos los pasos, tu app Telodije debería estar funcionando correctamente.

**Próximos pasos:**
1. Registra tu primer usuario
2. Marcalo como premium (SQL del Paso 7)
3. Crea una quiniela de prueba
4. Agrega partidos desde el Panel Admin
5. Haz predicciones y verifica el ranking

**Para soporte adicional:** Revisa la documentación en `docs/INDEX.md`

---

*Última actualización: Julio 2026*
