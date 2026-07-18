# 📋 Edge Function: sync-profile

## 🎯 Objetivo
Sincronizar automáticamente el perfil del usuario cuando se registra o actualiza en Supabase Auth.

---

## 📁 Estructura

```
supabase/functions/sync-profile/
├── index.ts          # Código principal de la Edge Function
└── README.md         # Esta documentación
```

---

## 🔧 Funcionamiento

### Trigger de Supabase

La función se ejecuta automáticamente cuando:

1. **Nuevo usuario se registra** → `INSERT` en `auth.users`
2. **Usuario actualiza perfil** → `UPDATE` en `auth.users`

### Datos Sincronizados

| Campo | Fuente | Descripción |
|-------|--------|-------------|
| `id` | `auth.users.id` | ID único del usuario |
| `email` | `auth.users.email` | Correo electrónico |
| `full_name` | `raw_user_meta_data` | Nombre completo |
| `avatar_url` | `raw_user_meta_data` | URL del avatar |
| `provider` | `raw_user_meta_data` | Proveedor (email, google) |
| `provider_id` | `raw_user_meta_data` | ID del proveedor |
| `plan_type` | Default: 'free' | Tipo de plan |

---

## 🚀 Despliegue

### Desarrollo Local

```bash
# Iniciar Supabase local
supabase start

# Ejecutar migraciones
supabase db push

# Probar la función
supabase functions invoke sync-profile --no-verify-jwt
```

### Producción

```bash
# Desplegar a Supabase
supabase functions deploy sync-profile

# Configurar secrets (si es necesario)
supabase secrets set MY_SECRET_KEY=my_secret_value
```

---

## 📊 Respuestas

### Éxito (200)

```json
{
  "message": "Profile synced successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Juan Pérez",
    "avatar_url": "https://...",
    "provider": "google",
    "plan_type": "free"
  }
}
```

### Error (400)

```json
{
  "error": "Error message"
}
```

---

## 🔐 Seguridad

- La función usa `SECURITY DEFINER` para acceder a `auth.users`
- Solo se ejecuta en eventos `INSERT` y `UPDATE`
- No expone datos sensibles

---

## 🧪 Pruebas

### Prueba con cURL

```bash
curl -X POST \
  'https://tu-proyecto.supabase.co/functions/v1/sync-profile' \
  -H 'Authorization: Bearer tu-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "INSERT",
    "table": "users",
    "record": {
      "id": "test-user-id",
      "email": "test@example.com",
      "raw_user_meta_data": {
        "full_name": "Test User",
        "avatar_url": "https://example.com/avatar.jpg",
        "provider": "google"
      }
    }
  }'
```

---

## 📝 Notas

- La función maneja tanto `INSERT` como `UPDATE`
- Usa `upsert` para evitar duplicados
- Los campos opcionales tienen valores por defecto
- Los errores se loguean para debugging
