# 📋 Guía de Configuración - Google OAuth

## 🎯 Objetivo
Configurar autenticación con Google en Supabase para Telodije.

---

## 📝 Pasos para Configurar Google OAuth

### 1. Crear Proyecto en Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Click en "Select a project" → "New Project"
3. Ingresar nombre: `Telodije`
4. Click en "Create"

### 2. Habilitar Google+ API

1. Ir a **APIs & Services** → **Library**
2. Buscar "Google+ API" o "People API"
3. Click en "Enable"

### 3. Crear OAuth 2.0 Credentials

1. Ir a **APIs & Services** → **Credentials**
2. Click en **Create Credentials** → **OAuth client ID**
3. Configurar:
   - **Application type**: `Web application`
   - **Name**: `Telodije Web`
   - **Authorized JavaScript origins**:
     - `http://localhost:8081` (desarrollo)
     - `https://telodije.app` (producción)
   - **Authorized redirect URIs**:
     - `https://tu-proyecto.supabase.co/auth/v1/callback`
4. Click en "Create"
5. Copiar **Client ID** y **Client Secret**

### 4. Configurar Pantalla de Consentimiento

1. Ir a **APIs & Services** → **OAuth consent screen**
2. Seleccionar **External** (para usuarios externos)
3. Completar información:
   - **App name**: `Telodije`
   - **User support email**: tu@email.com
   - **Developer contact**: tu@email.com
4. Agregar scopes:
   - `openid`
   - `email`
   - `profile`
5. Agregar usuarios de prueba (para testing)
6. Click en "Save and Continue"

### 5. Configurar en Supabase

1. Ir a Supabase Dashboard → **Authentication** → **Providers**
2. Habilitar **Google**
3. Ingresar:
   - **Client ID**: (copiado de Google Cloud)
   - **Client Secret**: (copiado de Google Cloud)
4. Click en "Save"

### 6. Configurar Redirect URLs en Supabase

1. Ir a Supabase Dashboard → **Authentication** → **URL Configuration**
2. Agregar a **Redirect URLs**:
   - `http://localhost:8081/**`
   - `https://telodije.app/**`

---

## 🔧 Código de Integración

### Login con Google (Expo)

```typescript
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

export async function signInWithGoogle() {
  const redirectUrl = makeRedirectUri({
    scheme: 'telodije',
    path: 'callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  // Open browser for authentication
  const res = await WebBrowser.openAuthSessionAsync(
    data?.url ?? '',
    redirectUrl
  );

  if (res.type === 'success') {
    // Handle the redirect
    const { url } = res;
    // Extract tokens from URL
  }

  return { data, error };
}
```

### Configurar Expo Auth Session

```bash
npx expo install expo-auth-session expo-web-browser
```

### Actualizar app.json

```json
{
  "expo": {
    "scheme": "telodije",
    "plugins": [
      "expo-auth-session"
    ]
  }
}
```

---

## 📱 Variables de Entorno

Actualizar archivo `.env.local`:

```env
# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789.apps.googleusercontent.com
```

---

## 🧪 Pruebas de Google OAuth

### Flujo de Prueba

1. Iniciar la app: `npm run web`
2. Click en "Continuar con Google"
3. Seleccionar cuenta de Google
4. Autorizar la app
5. Verificar redirección al Home

### Verificar en Supabase

1. Ir a Supabase Dashboard → **Authentication** → **Users**
2. Verificar que el usuario se creó con provider `google`

---

## ✅ Checklist de Configuración

- [ ] Proyecto Google Cloud creado
- [ ] Google+ API habilitada
- [ ] OAuth 2.0 credentials creadas
- [ ] Pantalla de consentimiento configurada
- [ ] Client ID y Secret copiados
- [ ] Google OAuth habilitado en Supabase
- [ ] Redirect URLs configurados
- [ ] Variables de entorno actualizadas
- [ ] Prueba de login exitosa

---

## 🚀 Próximos Pasos

Una vez configurado Google OAuth:

1. **B-10**: Crear función Edge para sincronizar perfil
2. **F-06**: Crear pantalla Login
3. **F-07**: Crear pantalla Registro
4. **I-01**: Integrar servicios de Auth con pantallas
