# 📋 Guía de Configuración - Supabase Auth

## 🎯 Objetivo
Configurar autenticación por Email/Password y Google OAuth en Supabase.

---

## 📝 Pasos para Configurar Auth en Supabase Dashboard

### 1. Crear Proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Click en "New Project"
3. Seleccionar región más cercana
4. Ingresar nombre del proyecto: `telodije`
5. Ingresar contraseña segura para la base de datos
6. Click en "Create new project"

### 2. Obtener Credenciales

Una vez creado el proyecto:

1. Ir a **Settings** → **API**
2. Copiar:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API Key (anon)**: `eyJhbGciOiJIUzI1NiIs...`

### 3. Habilitar Proveedores de Auth

#### Email/Password (Ya habilitado por defecto)

1. Ir a **Authentication** → **Providers**
2. Verificar que **Email** esté habilitado
3. Configurar opciones:
   - ✅ Confirm email: `true` (producción) / `false` (desarrollo)
   - ✅ Allow sign up: `true`

#### Google OAuth

1. Ir a **Authentication** → **Providers**
2. Habilitar **Google**
3. Copiar **Client ID** y **Client Secret**

### 4. Configurar Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Seleccionar o crear proyecto
3. Ir a **APIs & Services** → **Credentials**
4. Click en **Create Credentials** → **OAuth client ID**
5. Configurar:
   - **Application type**: `Web application`
   - **Name**: `Telodije`
   - **Authorized redirect URIs**: 
     - `https://xxxxx.supabase.co/auth/v1/callback`
6. Copiar **Client ID** y **Client Secret**

### 5. Configurar Redirect URLs

En Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:8081` (desarrollo) o `https://telodije.app` (producción)
- **Redirect URLs**: 
  - `http://localhost:8081/**`
  - `https://telodije.app/**`

---

## 🔧 Configuración del Cliente Supabase

El cliente ya está configurado en `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## 📱 Variables de Entorno

Actualizar archivo `.env.local`:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-google-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-google-ios-client-id.apps.googleusercontent.com
```

---

## 🧪 Pruebas de Auth

### Registro con Email

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
});
```

### Login con Email

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123',
});
```

### Login con Google

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:8081',
  },
});
```

---

## ✅ Checklist de Configuración

- [ ] Proyecto Supabase creado
- [ ] Credenciales copiadas (URL + anon key)
- [ ] Auth Email habilitado
- [ ] Google OAuth configurado
- [ ] Redirect URLs configurados
- [ ] Variables de entorno actualizadas
- [ ] Pruebas de registro/login exitosas

---

## 🚀 Próximos Pasos

Una vez configurado Supabase Auth:

1. **B-09**: Configurar Google OAuth
2. **B-10**: Crear función Edge para sincronizar perfil
3. **F-06**: Crear pantalla Login
4. **F-07**: Crear pantalla Registro
