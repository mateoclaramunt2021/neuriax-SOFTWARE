# ✅ CHECKLIST LOCAL - PRESENTACIÓN MAÑANA

## 🚀 ANTES DE PRESENTAR

### 1. INICIAR SERVIDORES
```bash
# Terminal 1 - Backend (Puerto 3001)
cd server
npm start

# Terminal 2 - Frontend (Puerto 3000)
cd client
npm start
```

**Esperar a que veas:**
- ✅ Backend: "Servidor corriendo en http://localhost:3001"
- ✅ Frontend: "webpack compiled successfully" (compilación verde)

---

### 2. VERIFICAR LANDING PAGE
**URL:** http://localhost:3000

#### Header (Navbar)
- ✅ Logo NEURIAX a la izquierda
- ✅ 1 botón único: **"🔍 Buscar Peluquerías"** (VERDE)
- ✅ Links en navbar: Cómo Funciona, Funciones, Precios, FAQ
- ✅ Sin botones de "Soy Cliente" / "Soy Profesional" en navbar

#### Hero Section
- ✅ Título atractivo
- ✅ **DOS botones principales:**
  - 👤 **"Soy Cliente"** (Verde) - Subtítulo: "Buscar y reservar en salones"
  - 💼 **"Soy Profesional"** (Púrpura) - Subtítulo: "7 días de prueba GRATIS" + Badge TRIAL oro
- ✅ Botón "▶ Ver Cómo Funciona"
- ✅ Texto de confianza: "🔒 Sin tarjeta de crédito"

---

### 3. FLUJO: REGISTRO CLIENTE
**Ruta:** `/register-client`

**Pasos:**
1. Click en "Soy Cliente"
2. Llenar formulario:
   - Nombre: "Test Cliente"
   - Email: "cliente@test.com"
   - Teléfono: "600123456"
   - Contraseña: "Test@12345"
   - Confirmar: "Test@12345"
3. ✅ Debe redirigir a `/dashboard/cliente`
4. ✅ Navbar debe mostrar opciones de cliente
5. ✅ localStorage debe tener `tipoUsuario: 'cliente'`

---

### 4. FLUJO: REGISTRO PROFESIONAL (TRIAL)
**Ruta:** `/register-business`

**Paso 1 - Datos de empresa:**
- Nombre Empresa: "Salón Premium Beauty"
- Tu Nombre: "María García"
- Click "Siguiente"

**Paso 2 - Credenciales:**
- Email: "maria@salon.com"
- Teléfono: "601987654"
- Contraseña: "Test@12345"
- Confirmar: "Test@12345"
- Click "Crear Cuenta"

**Verificaciones:**
- ✅ Redirige a `/dashboard/profesional`
- ✅ Navbar muestra "7 días de prueba"
- ✅ localStorage: 
  - `tipoUsuario: 'profesional'`
  - `usuario.plan: 'trial'`
  - `usuario.diasPruebaRestantes: 7`
- ✅ Dashboard muestra conteo regresivo

---

### 5. FLUJO: LOGIN PROFESIONAL
**Ruta:** `/login-profesional`

**Ingresar:**
- Usuario: `maria@salon.com`
- Contraseña: `Test@12345`

**Verificaciones:**
- ✅ Login exitoso
- ✅ Redirige a `/dashboard/profesional`
- ✅ Muestra "7 días de prueba restantes"

---

### 6. FLUJO: LOGOUT Y LOGIN CLIENTE
**Logout desde dashboard**
- ✅ Botón de logout funciona
- ✅ Vuelve a login

**Login Cliente:**
- ✅ Navegar a `/login-cliente`
- Ingresar credenciales de cliente
- ✅ Redirige a `/dashboard/cliente`

---

### 7. MARKETPLACE
**Ruta:** `/marketplace`

**Cómo llegar:**
- Click en "🔍 Buscar Peluquerías" del navbar
- O Click en "🏪 Marketplace" del footer

**Verificaciones:**
- ✅ Carga lista de peluquerías
- ✅ Se pueden filtrar por ubicación
- ✅ Se puede hacer click en una peluquería
- ✅ Se ve detalle de servicios y precios

---

### 8. RESPONSIVE & ESTILOS
**Desktop (1920px):**
- ✅ CTAs duales lado a lado
- ✅ Espaciado adecuado
- ✅ Textos legibles

**Tablet (768px):**
- ✅ CTAs apilados
- ✅ Navegación funcional
- ✅ Botones clickeables

**Mobile (375px):**
- ✅ CTAs en stack vertical 100% ancho
- ✅ Texto centrado
- ✅ Iconos visibles
- ✅ Badge TRIAL visible

---

### 9. ERRORES COMUNES A EVITAR

❌ **Si ves esto:**
- "No se puede conectar a localhost:3001" → Backend no está corriendo
- "Límite de API calls" → Ya está solucionado (visto anteriormente)
- "Botones de login en navbar" → Cambios no están cargados (F5 cache)
- "CTAs no son verdes/púrpuras" → CSS no cargó bien

✅ **Soluciones rápidas:**
```bash
# Limpiar cache del navegador
Ctrl+Shift+Delete (Chrome)
Cmd+Shift+Delete (Firefox)
Cmd+Option+E (Safari)

# Recargar página
Ctrl+Shift+R (Hard reload)

# Si backend no responde
Ctrl+C en terminal
npm start
```

---

### 10. CREDENCIALES DE PRUEBA

**Cliente:**
- Email: `cliente@test.com`
- Contraseña: `Test@12345`

**Profesional:**
- Email: `maria@salon.com`
- Contraseña: `Test@12345`

---

## 🎯 SCRIPT DE PRESENTACIÓN

**Introducción (30 seg):**
"NEURIAX es una plataforma SaaS para gestionar salones de belleza. Tenemos dos tipos de usuarios: clientes que buscan servicios, y profesionales que gestionan su negocio."

**Demo Landing (1 min):**
1. Mostrar navbar limpio con botón marketplace
2. Scroll down mostrando Hero
3. Destacar CTAs duales: Cliente (verde) y Profesional (púrpura con trial)
4. Explicar "7 días gratis sin tarjeta"

**Demo Registro Cliente (2 min):**
1. Click en "Soy Cliente"
2. Llenar rápidamente
3. Mostrar dashboard cliente
4. Explicar funciones de búsqueda de salones

**Demo Registro Profesional (2 min):**
1. Click en "Soy Profesional"
2. Dos pasos: datos empresa + credenciales
3. Mostrar dashboard con "7 días de prueba"
4. Explicar límites de trial

**Demo Marketplace (1 min):**
1. Navegar a marketplace
2. Mostrar listado de peluquerías
3. Explicar flujo de reservas

**Cierre (30 seg):**
"Con NEURIAX, profesionales pueden gestionar su negocio desde el primer día, con 7 días de prueba sin riesgo. Los clientes tienen un marketplace centralizado para encontrar servicios."

---

## ⏱️ TIMELINE RECOMENDADO

| Hora | Actividad |
|------|-----------|
| 22:00 | Iniciar ambos servidores |
| 22:05 | Hacer todas las pruebas del checklist |
| 22:15 | Abrir documentación (backup) |
| 22:30 | Revisar credenciales test |
| 22:45 | Último test rápido |
| 22:50 | Estar listo para presentar |

---

## 🆘 TROUBLESHOOTING RÁPIDO

**"No veo cambios"**
- Hard refresh: `Ctrl+Shift+R`
- Limpiar node_modules: `npm install`

**"Login no funciona"**
- Verificar backend está corriendo
- Ver console (F12) para errores
- Revisar credenciales

**"Marketplace vacío"**
- Ir a `/marketplace` directamente
- Si sigue vacío, es error de data (avisar)

**"Respuesta lenta"**
- Normal en localhost
- Si muy lenta, reiniciar npm

---

## 📱 VIEWPORT PARA PRESENTAR

**Recomendación:**
- Mostrar en **1920x1080** (Desktop)
- Para responsive: Usar DevTools (F12)
- No presentar directamente en móvil (lento)

---

**¡LISTO PARA PRESENTAR MAÑANA! 🎉**

Cualquier problema, avisar rápidamente.
