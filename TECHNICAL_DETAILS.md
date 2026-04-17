# 📘 Especificaciones Técnicas Detalladas - Aetheria

Este documento profundiza en la implementación lógica de los módulos de Aetheria, explicando el "cómo" y el "por qué" de las funciones clave.

---

## 1. Núcleo Matemático (`/js/engine/`)

### `seed.js`: La Fuente de la Verdad
- **`hashSeed(str)`:** Implementa **MurmurHash3**. A diferencia de un hash criptográfico (como SHA-256), este es extremadamente rápido y está optimizado para procesadores modernos, ideal para ejecutarse en el hilo principal del navegador sin bloquear la UI.
- **`SeededRNG` (Clase):** Encapsula el algoritmo **Mulberry32**. 
    - **¿Por qué?** Permite generar una secuencia de números que parece aleatoria pero es 100% predecible. Esto es vital para que al compartir una semilla, el mundo sea idéntico para todos.
    - **`fork(domain)`:** Una función crítica que crea una nueva instancia de RNG basada en la semilla original más un "dominio" (ej. 'map', 'names'). Esto evita que cambios en la generación de nombres afecten la forma del terreno.

### `perlin.js`: La Escultura del Terreno
- **`PerlinNoise` (Clase):** Utiliza un arreglo de permutaciones barajado por la semilla. 
- **`noise2D(x, y)`:** Implementa el algoritmo de ruido de Ken Perlin. La clave es la función de **Fade** (o suavizado). Usamos la fórmula de 5to grado de Perlin: `t * t * t * (t * (t * 6 - 15) + 10)`. Esto ofrece derivadas segundas continuas, lo que eliminan las "costuras" visibles en el terreno.
- **`generateElevationMap`:** Aplica **fBm (fractal Brownian Motion)**. Combina múltiples frecuencias de ruido para imitar la erosión natural.

---

## 2. Lógica del Mundo (`/js/world/`)

### `biomes.js`: El Ecosistema
- **`BIOME_DEFS`:** Constantes que definen el color, iconos, recursos y descripciones.
- **`generateBiomeMap`:** Itera sobre cada entrada del buffer `Float32Array`. 
    - Cruza los datos de elevación, temperatura y humedad. 
    - **Regla Oro:** Si la elevación < `WATER_LEVEL` (0.32), el bioma se fuerza a `OCEAN` o `DEEP_OCEAN`.

### `creatures.js`: Biología Procedimental
- **`generateBestiary`:** Crea una lista de criaturas. 
- **`placeCreaturesOnMap`:** Utiliza una técnica de **muestreo estocástico**. No coloca criaturas al azar, busca celdas cuyo bioma coincida con el `homeBiome` de la especie y utiliza una probabilidad basada en la rareza (Common, Rare, Legendary).

---

## 3. Sistema de Visualización (`/js/render/`)

### `map-renderer.js`: El Pipeline Gráfico
- **`renderBaseMap()`:** 
    1. Obtiene el contexto 2D del Canvas.
    2. Utiliza `ImageData` para manipular píxeles directamente. Esto es órdenes de magnitud más rápido que usar `fillRect()` para cada celda de 1x1.
    3. Aplica los colores de los biomas al buffer y luego lo sube al Canvas con `putImageData`.
- **Coordenadas de Cámara:** Gestiona `offsetX`, `offsetY` y `zoom`. Transforma coordenadas de pantalla a coordenadas de mundo: `worldX = (screenX - offsetX) / zoom`.

### `creature-svg.js`: Dibujo Dinámico
- **`generate(creature)`:** Crea un elemento `<svg>` en tiempo de ejecución.
    - **Morfología Dinámica:** Las funciones `_drawSerpentine`, `_drawQuadruped`, etc., utilizan trazados de Bézier (`path d="M... Q..."`) cuyos puntos de control se ven alterados por las estadísticas de la criatura (ej: si tiene mucha magia, el radio del "aura" aumenta).

---

## 4. Interfaz y Experiencia (`/js/ui/`)

### `panels.js`: Gestión de Datos en el UI
- **`PanelManager`:** Centraliza la creación de tarjetas de información.
- **`RadarChart`:** Dibuja un polígono en un Canvas pequeño para mostrar los atributos de la criatura (Fuerza, Magia, Velocidad). Utiliza trigonometría básica (`cos`, `sin`) para posicionar los vértices del gráfico radial según los valores normalizados (0-10).

---

## 🚀 Optimización General
- **Inmutabilidad:** Los mapas de datos originales (`worldData.maps`) nunca se modifican después de la generación inicial.
- **Lazy Rendering:** El mapa solo se vuelve a renderizar cuando el usuario interactúa (zoom o pan), ahorrando ciclos de CPU/GPU.
- **Cero Dependencias:** El proyecto es resiliente al tiempo. No hay paquetes de `npm` que deban actualizarse ni riesgo de cambios de API en frameworks externos.
