# Guía del Sistema de Diseño UX/UI - AuraFi / FinNova Academy

Esta guía documenta las especificaciones del sistema de diseño global, la paleta de colores, la tipografía y las pautas UX/UI adoptadas para el desarrollo del portal de alumnos, portal del staff y los dashboards embebidos. Su propósito es prevenir problemas de contraste, consistencia de componentes o inconsistencias de estilo al expandir o mantener la plataforma.

---

## 1. Filosofía de Diseño: Soft Neo-Brutalismo / Minimalist Flat

AuraFi Academy adopta una estética **Neo-brutalista Suave (Soft Neo-Brutalism)** combinada con **Flat Design**. Sus principios fundamentales son:
*   **Bordes Nítidos y Definidos**: Todos los bloques, botones y tarjetas usan bordes sólidos gruesos (generalmente de `2px`) en lugar de sombras borrosas.
*   **Sombras Sólidas y Planas (Hard Offsets)**: Las tarjetas y los botones interactivos utilizan sombras proyectadas planas, sin desenfoque (`box-shadow: 4px 4px 0px 0px [color-borde]`), logrando un efecto físico retro-moderno tridimensional.
*   **Ausencia de Degradados Complejos**: Se priorizan bloques de color plano para facilitar la lectura de los datos de mercado y mantener la ligereza de la interfaz.
*   **Tipografía Técnica**: Se combina una fuente sans-serif limpia y geométrica para títulos junto con una fuente monoespaciada para todos los datos numéricos y métricas estadísticas.

---

## 2. Paleta de Colores Corporativa

La paleta se inspira en tonos minerales y terrosos cálidos (estilo Oro COMEX), con nombres representativos y roles definidos para el Modo Claro (Light) y Modo Oscuro (Dark).

| Nombre del Color | Hex Code | Rol Principal |
| :--- | :--- | :--- |
| **Palladian** | `#EEE9DF` | Fondo en Light Mode / Texto y Bordes en Dark Mode |
| **Oatmeal** | `#C9C1B1` | Bloques secundarios en Light Mode / Muted Text en Dark Mode |
| **Burning Flame** | `#FFB162` | Acento Primario / Botón Destacado / Señal Alcista |
| **Truffle Trouble** | `#A35139` | Acento Secundario / Botones Alternativos / Señal Bajista / Gráficas |
| **Abyssal Anchorfish Blue** | `#1B2632` | Fondo en Dark Mode / Texto y Bordes en Light Mode |
| **Blue Fantastic** | `#2C3B4D` | Bloques y Tarjetas en Dark Mode / Texto Secundario en Light Mode |

### ☀️ Mapeo en Modo Claro (Light Mode)
*   **Fondo General (Canvas)**: `#EEE9DF` (Palladian)
*   **Tarjetas principales (Cards)**: `#FFFFFF` (Blanco puro para limpieza y contraste)
*   **Contenedores Secundarios/Banners**: `#C9C1B1` (Oatmeal)
*   **Texto Principal / Bordes de Tarjetas**: `#1B2632` (Abyssal Blue)
*   **Texto Muted / Secundario**: `#2C3B4D` (Blue Fantastic)
*   **Sombra Plana (Offset)**: `#1B2632`

### 🌙 Mapeo en Modo Oscuro (Dark Mode)
*   **Fondo General (Canvas)**: `#1B2632` (Abyssal Blue)
*   **Tarjetas principales (Cards)**: `#2C3B4D` (Blue Fantastic)
*   **Contenedores Secundarios/Banners**: `#1F2937` (Gris oscuro/azuloso)
*   **Texto Principal / Bordes de Tarjetas**: `#EEE9DF` (Palladian)
*   **Texto Muted / Secundario**: `#C9C1B1` (Oatmeal)
*   **Sombra Plana (Offset)**: `#EEE9DF`

---

## 3. Estándares de Contraste y Accesibilidad (Reglas Críticas)

> [!IMPORTANT]
> **Regla de Oro del Contraste Activo**:
> Cuando un componente interactivo cambie de color de fondo a un acento brillante (como `Burning Flame` `#FFB162` u `Oatmeal` `#C9C1B1`), **NUNCA** utilices las variables dinámicas de texto del tema directamente. 
> Forzar siempre colores oscuros fijos de alto contraste (como `#1B2632` o `#2C3B4D`) sobre fondos de acento claros.

### Ejemplo de Implementación en React (Selector de Niveles):
```tsx
// INCORRECTO: Causa ilegibilidad en modo oscuro al renderizar texto claro sobre fondo naranja
<button style={{ background: active ? colors.primary : colors.cardBg }}>
  <span style={{ color: colors.text }}>{lvl.label}</span>
</button>

// CORRECTO: El texto siempre tiene contraste
<button style={{ background: active ? colors.primary : colors.cardBg }}>
  <span style={{ color: active ? '#1B2632' : colors.text }}>{lvl.label}</span>
</button>
```

---

## 4. Tipografía y Estilo de Texto

Se utiliza Google Fonts de forma estática en la aplicación.

*   **Títulos y Textos de Lectura (Sans-Serif)**: `Space Grotesk`
    *   Títulos principales (`h1`): `font-weight: 800; tracking-tight; line-height: 1.1;`
    *   Subtítulos (`h2`/`h3`): `font-weight: 700; tracking-wide;`
*   **Métricas y Datos Financieros (Monospace)**: `Space Mono` o `DM Mono`
    *   Precios, porcentajes, tablas y leyendas de ejes de gráficas deben ir estrictamente en tipografía monoespaciada para asegurar que los números no se desalineen.
    *   Tamaño de leyendas: `9px` o `10px`.

---

## 5. Pautas para Canvases Dinámicos y Gráficas de Mercado

Al dibujar directamente en el contexto 2D de un HTML5 Canvas (`ctx`), los colores fijos rompen la estética en el cambio de tema.

### ⚙️ Protocolo de Dibujo en Canvas
1.  **Leer variables en tiempo de ejecución**: Usar `getThemeColors()` basado en la lectura del estado actual o de las propiedades computadas del CSS.
2.  **Transparencias**: Utilizar canales alfa para los fondos de área (`rgba(...)`) y colores sólidos para las líneas críticas de tendencia.
3.  **Redibujar al cambiar de tema**: Vincular el evento `themechange` o un efecto en React (`useEffect`) con la dependencia del tema actual, limpiando el canvas anterior (`ctx.clearRect`) y volviéndolo a trazar inmediatamente.

### Código de Ejes y Rejilla Recomendado:
```javascript
const colors = getThemeColors();

// Para líneas de rejilla (Soft Grid)
ctx.strokeStyle = colors.grid;
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(x, y);
ctx.lineTo(x2, y2);
ctx.stroke();

// Para textos de precios en los ejes
ctx.fillStyle = colors.text;
ctx.font = '9px "Space Mono", monospace';
ctx.fillText(valor.toFixed(2), x, y);
```

---

## 6. Sincronización de Iframes y Contenido Incrustado

Los dashboards avanzados que se sirven como archivos HTML estáticos (`public/*.html`) deben adaptarse automáticamente al tema seleccionado por el portal de alumnos.

*   **Detección en Caliente**: Los iframes leen la clave `theme` desde el `localStorage`.
*   **Eventos**: Escuchan los eventos `storage` (por si hay cambios de pestaña) y `themechange` (despachados desde React).
*   **Respaldo**: Mantienen un intervalo de control de 500ms (`setInterval`) que refresca el tema para capturar transiciones rápidas.

### Script de Sincronización Estándar para Iframes:
```html
<script>
  function applyTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg', '#EEE9DF');
      root.style.setProperty('--bg2', '#FFFFFF');
      root.style.setProperty('--border', 'rgba(27, 38, 50, 0.15)');
      root.style.setProperty('--text', '#1B2632');
      root.style.setProperty('--text2', '#2C3B4D');
    } else {
      root.style.removeProperty('--bg');
      root.style.removeProperty('--bg2');
      root.style.removeProperty('--border');
      root.style.removeProperty('--text');
      root.style.removeProperty('--text2');
    }
  }
  applyTheme();
  window.addEventListener('storage', applyTheme);
  window.addEventListener('themechange', applyTheme);
  setInterval(applyTheme, 500);
</script>
```
