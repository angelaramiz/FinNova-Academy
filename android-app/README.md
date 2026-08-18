# FinNova Staff — App Android (Kotlin)

App móvil nativa para el **Centro de Control del staff** del Simulador Laboral.
Consulta perfiles de alumnos, sus rutas del árbol de datos, progreso, y ejecuta
acciones de administración (cambiar/resetear ruta, resetear progreso/mundo).
Incluye el registro de alumnos con selección de especialidad y ruta.

## Requisitos

- **Android Studio** (incluye el JBR 17 necesario) o JDK 17
- **Android SDK** con platform `android-36` y build-tools `36.0.0`
- Backend desplegado en `https://finnova-back.onrender.com` (o cambiar la URL)

## Cómo compilar

Desde la carpeta `android-app`:

```powershell
# Windows (PowerShell) — usa el JBR de Android Studio si tu JDK por defecto es 25+
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Compilar y generar APK debug
.\gradlew.bat assembleDebug
```

El APK queda en:
```
app\build\outputs\apk\debug\app-debug.apk
```

> **Nota**: `JAVA_HOME` debe apuntar a un JDK 17. Gradle 8.9 no soporta Java 25.

## Estructura

```
android-app/
├── build.gradle              # AGP 8.7.3 + Kotlin 2.0.21
├── settings.gradle           # pluginManagement con google()/mavenCentral()
└── app/
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/finnova/staff/
        │   ├── data/
        │   │   ├── Models.kt        # Student, CareerInfo, Stats, etc.
        │   │   ├── ApiService.kt    # Retrofit endpoints
        │   │   ├── ApiClient.kt     # Base URL + OkHttp
        │   │   └── SessionManager.kt# Token en SharedPreferences
        │   └── ui/
        │       ├── LoginActivity.kt
        │       ├── MainActivity.kt          # Lista de alumnos + filtros
        │       ├── StudentAdapter.kt
        │       ├── StudentDetailActivity.kt # Detalle + acciones admin
        │       └── RegisterStudentActivity.kt # Alta de alumno con ruta
        └── res/                # layouts, themes, colors, drawables
```

## Endpoints usados

| Función | Endpoint |
|---------|----------|
| Login staff | `POST /api/auth/login-simulated` |
| Listar alumnos | `GET /api/staff/students` |
| Stats del panel | `GET /api/staff/stats` |
| Detalle alumno | `GET /api/staff/students/{id}` |
| Reset mundo | `POST /api/staff/students/{id}/reset-world` |
| Reset progreso | `POST /api/staff/students/{id}/reset-progress` |
| Reset ruta | `POST /api/staff/students/{id}/reset-career` |
| Cambiar especialidad | `POST /api/staff/students/{id}/specialty` |
| Opciones de registro | `GET /api/auth/career-options` |
| Registro alumno | `POST /api/auth/register-requests` |

## OTP

Actualmente el OTP está **en bypass**: el login usa `login-simulated` con un
correo autorizado (sin código OTP). Cuando se configure el flujo de correos vía
n8n + VPN/servidor, se reemplazará por el login con credenciales completo.
