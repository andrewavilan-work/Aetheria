# 🌍 Aetheria: Manual Técnico y de Ingeniería

Aetheria es un generador de mundos procedimentales de alta fidelidad construido íntegramente con **tecnologías web nativas (Vanilla JS)**. Este documento sirve como manual técnico maestro, explicando cada algoritmo, decisión arquitectónica y componente funcional del motor.

**Desarrollador:** [andrewavilan-work](https://github.com/andrewavilan-work/Aetheria)

---

## 🏗 Filosofía Arquitectónica

Aetheria fue diseñado siguiendo el principio de **"Motor Limpio"**: 0 frameworks, 0 librerías pesadas, 100% control.

- **Núcleo sin Frameworks:** Sin la sobrecarga de React o Vue. Manipulación directa del DOM y la API de Canvas para alcanzar el máximo rendimiento posible.
- **Módulos ES6:** La lógica está fragmentada en módulos especializados (Motor, Mundo, Renderizado, Interfaz) para permitir un escalado independiente y mantenible.
- **Flujo de Estado:** Flujo de datos unidireccional: Semilla -> Mapas Matemáticos -> Entidades del Mundo -> Pipeline de Renderizado.

---

## 🧮 Algoritmos Principales y Matemáticas

La "magia" de Aetheria reside en su naturaleza determinística. Una misma cadena de texto (Semilla) siempre producirá el mismo universo exacto mediante el uso de dos algoritmos primarios:

### 1. Sistema de Semillas (`engine/seed.js`)
- **MurmurHash3 (32 bits):** Se utiliza para convertir cualquier cadena arbitraria en un entero estable de 32 bits. Utiliza operaciones de desplazamiento de bits y mezcla de constantes para asegurar una distribución alta (pocas colisiones).
- **Mulberry32 (PRNG):** Un generador de números pseudoaleatorios de 32 bits basado en estado. A diferencia de `Math.random()`, es determinístico. Permite "ramificar" semillas (ej: una para el terreno, otra para nombres) para que cambiar un aspecto no rompa los demás.

### 2. Generación de Terreno (`engine/perlin.js`)
- **Ruido Perlin 2D:** En lugar de aleatoriedad lineal, utilizamos una función de ruido de gradiente.
    - **Interpolación:** Usamos la función de quinto grado (`6t⁵ - 15t⁴ + 10t³`) para transiciones más suaves entre los nodos de ruido.
- **Movimiento Browniano Fractal (fBm):** Apilamos 6 "Octavas" de ruido.
    - **Persistencia (0.5):** Cada octava sucesiva tiene la mitad del impacto.
    - **Lacunaridad (2.0):** Cada octava sucesiva tiene el doble de frecuencia (detalle).
- **Modelado Continental:** Para evitar que el mapa sea una "sopa de ruido", aplicamos un **Caída de Distancia Euclidiana**. Esto fuerza que los bordes del mapa sean océano, creando una masa de tierra centralizada o archipiélago.

### 3. Matriz de Clima y Biomas (`world/biomes.js`)
Los biomas no son aleatorios; siguen una **Matriz Ecológica basada en Whittaker**:
1. **Mapa de Elevación:** Generado vía Perlin.
2. **Mapa de Temperatura:** Calculado como función de la Latitud (posición Y) y la Elevación (más alto = más frío).
3. **Mapa de Humedad:** Ruido Perlin secundario ajustado por la proximidad al agua (Humedad Costera).
4. **Bioma Final:** Una búsqueda en 3D (Elevación x Temperatura x Humedad) selecciona entre más de 15 biomas.

---

## 🐉 Bestiario Procedimental (`world/creatures.js`)

Cada criatura en Aetheria es una entrada única en la base de datos del mundo.
- **Morfismo Visual:** En `creature-svg.js`, utilizamos teoría del color HSL y manipulación de rutas SVG.
    - **Cambio de Tono:** Basado en el bioma de origen (ej: criaturas del desierto tienen tonos más cálidos).
    - **Morfología:** El motor decide tipos de cuerpo (serpenteante, alado, humanoide) y los escala usando la semilla determinística.
- **Estadísticas e Historia:** Algoritmos heurísticos asignan "Niveles de Poder" basados en la rareza y el nivel de peligro del bioma.

---

## 🏛 Civilización y Economía (`world/cultures.js` y `economy.js`)

Aetheria no solo dibuja mapas; simula sociedades.
1. **Ubicación:** Las civilizaciones se sitúan usando una "Heurística de Idoneidad" (cerca del agua, en biomas templados).
2. **Simulación Económica:** Basada en la distribución de biomas. Un mundo con muchas celdas de "Tundra Congelada" tendrá una economía basada en *Pieles* y *Aceite de Ballena*, mientras que un mundo de "Desierto" dependerá de *Especias* y *Cristal*.
3. **Generación de Historia:** Un enfoque similar a las cadenas de Markov para generar eventos (Eras, Guerras, Descubrimientos) arraigados en las características reales del mundo.

---

## 🎨 Renderizado de Alto Rendimiento (`render/map-renderer.js`)

- **Buffer de Canvas:** En lugar de miles de elementos DOM, pintamos directamente en un buffer de píxeles.
- **Cámara Virtual:** Implementa un sistema de Zoom/Pan sin matrices pesadas que calcula la transformación del viewport al mundo en tiempo real.
- **Culling de POIs:** Solo los iconos y etiquetas dentro del viewport actual se renderizan para mantener 60fps incluso en dispositivos móviles.

---

## 🛠 Instalación y Uso

```bash
# Clonar
git clone https://github.com/andrewavilan-work/Aetheria.git

# ¡Sin pasos de compilación! Solo usa un servidor local:
npx serve .
```

---

> *Proyecto Aetheria - Documentado con precisión por andrewavilan-work.*
