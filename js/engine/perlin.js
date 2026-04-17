/**
 * perlin.js - Motor de Generación de Terreno Basado en Ruido Perlin 2D
 * 
 * Implementación optimizada del algoritmo de ruido de Ken Perlin para la creación
 * de topologías naturales y determinísticas. Este módulo es el corazón geográfico
 * de Aetheria, permitiendo que una misma semilla produzca paisajes idénticos.
 * 
 * Características:
 * - Tabla de permutación determinística barajada mediante Fisher-Yates.
 * - Interpolación quintil (Fade function) para suavizado de derivadas segundas.
 * - Soporte para fBm (fractal Brownian Motion) con octavas configurables.
 * - Generador de máscaras continentales dinámicas (Pangea, Archipiélagos).
 */

/**
 * Clase PerlinNoise
 * Encapsula la lógica de generación de ruido de gradiente.
 */
export class PerlinNoise {
    /**
     * @param {import('./seed.js').SeededRNG} rng - Instancia del generador pseudoaleatorio determinístico.
     */
    constructor(rng) {
        /**
         * Tabla de permutación: Arreglo de 512 bytes que contiene dos copias del rango [0, 255]
         * barajado de forma aleatoria según la semilla. La duplicación evita el desbordamiento
         * en los índices durante el cálculo de las 4 esquinas de la celda.
         */
        this.perm = new Uint8Array(512);
        const p = Array.from({ length: 256 }, (_, i) => i);
        
        // Mezcla Fisher-Yates: Algoritmo O(n) para barajar el arreglo uniformemente.
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Carga de la tabla duplicada
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
        
        /**
         * Gradientes 2D: Conjunto de vectores unitarios que definen las direcciones de inclinación
         * en los nodos de la rejilla. Se utilizan 8 direcciones para una cobertura uniforme.
         */
        this.grads = [
            [1, 1], [-1, 1], [1, -1], [-1, -1],
            [1, 0], [-1, 0], [0, 1], [0, -1]
        ];
    }

    /**
     * Función de Suavizado (Fade): t * t * t * (t * (t * 6 - 15) + 10)
     * Proporciona una transición cuya derivada primera y segunda es cero en los límites [0, 1],
     * eliminando las discontinuidades visuales que produciría una interpolación lineal o cúbica simple.
     * @param {number} t - Parámetro de progresión relativa [0, 1].
     */
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Interpolación Lineal (LERP)
     * Calcula un valor intermedio entre 'a' y 'b' según un factor 't'.
     */
    lerp(a, b, t) {
        return a + t * (b - a);
    }

    /**
     * Producto Punto Gradiente (dotGrad)
     * Calcula la contribución del gradiente de una esquina al punto (x, y) relativo.
     * @param {number} hash - Índice extraído de la tabla de permutación.
     */
    dotGrad(hash, x, y) {
        const g = this.grads[hash & 7];
        return g[0] * x + g[1] * y;
    }

    /**
     * Generación de Ruido Base
     * Mapea coordenadas continuas al espacio de ruido.
     * @returns {number} Valor en el rango aproximado [-1, 1].
     */
    noise(x, y) {
        // Determinación de las coordenadas de la rejilla (grid cells)
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        
        // Coordenadas locales dentro de la celda [0, 1]
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        // Aplicación de la curva de suavizado a las coordenadas locales
        const u = this.fade(xf);
        const v = this.fade(yf);
        
        // Hashing de las 4 esquinas de la celda unitaria
        const aa = this.perm[this.perm[xi] + yi];
        const ab = this.perm[this.perm[xi] + yi + 1];
        const ba = this.perm[this.perm[xi + 1] + yi];
        const bb = this.perm[this.perm[xi + 1] + yi + 1];
        
        // Interpolación bilineal de las contribuciones de gradiente
        // 'x1' representa la interpolación en el eje X para la fila inferior
        // 'x2' representa la interpolación en el eje X para la fila superior
        const x1 = this.lerp(this.dotGrad(aa, xf, yf), this.dotGrad(ba, xf - 1, yf), u);
        const x2 = this.lerp(this.dotGrad(ab, xf, yf - 1), this.dotGrad(bb, xf - 1, yf - 1), u);
        
        return this.lerp(x1, x2, v); // Resultado final interpolado en el eje Y
    }

    /**
     * Ruido Fractal (fBm - Fractal Brownian Motion)
     * Superpone múltiples capas de ruido a diferentes escalas para imitar la autosimilitud
     * de la naturaleza (erosión, sedimentación).
     * @param {number} octaves - Cantidad de capas de detalle.
     * @param {number} persistence - Decaimiento de la amplitud (detalles más finos son menos prominentes).
     * @param {number} lacunarity - Escalado de la frecuencia (detalles más finos ocurren en menor espacio).
     * @returns {number} Valor normalizado [0, 1].
     */
    fractal(x, y, octaves = 6, persistence = 0.5, lacunarity = 2.0) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return (total / maxValue + 1) / 2;
    }
}

/**
 * Generador de Mapa de Elevación (Pipeline Principal)
 * 
 * Crea un buffer Float32Array que representa la "altura" de cada píxel del mundo.
 * Aplica lógica de modelado continental para asegurar que el centro sea tierra
 * y los bordes sean mar, evitando cortes abruptos.
 */
export function generateElevationMap(perlin, width, height, rngOrScale = 0.008, options = {}) {
    const scale = typeof rngOrScale === 'number' ? rngOrScale : 0.008;
    const rng = typeof rngOrScale === 'object' ? rngOrScale : { next: () => 0.5 };
    
    const { octaves = 6, persistence = 0.5, lacunarity = 2.0 } = options;
    const map = new Float32Array(width * height);

    /**
     * Diversidad de Mapas: Determinamos el tipo de distribución de tierra.
     * 0: Pangea (un solo supercontinente central)
     * 1: Archipiélago (muchas islas pequeñas esparcidas)
     * 2: Multinodal (varios continentes medianos)
     */
    const worldType = rng.next() > 0.6 ? 2 : (rng.next() > 0.5 ? 1 : 0);
    
    // Generación de centros de gravedad continental según el tipo de mundo
    const numContinents = worldType === 1 ? Math.floor(rng.next() * 5) + 6 : (worldType === 2 ? Math.floor(rng.next() * 3) + 2 : 1);
    const continents = [];
    for(let c=0; c<numContinents; c++) {
        continents.push({
            x: (rng.next() * 0.6 + 0.2) * 2 - 1, 
            y: (rng.next() * 0.6 + 0.2) * 2 - 1,
            size: worldType === 1 ? rng.next() * 0.3 + 0.1 : rng.next() * 0.5 + 0.3
        });
    }

    // Iteración espacial sobre cada celda del lienzo del mundo
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // 1. Obtención del ruido perlin base con detalle fractal
            let elevation = perlin.fractal(
                x * scale, y * scale,
                octaves, persistence, lacunarity
            );

            // 2. Coordenadas normalizadas al centro para manipulación geométrica
            const nx = (x / width) * 2 - 1;
            const ny = (y / height) * 2 - 1;
            
            // 3. Cálculo de Caída de Borde (Edge Falloff)
            // Asegura que las coordenadas periféricas tiendan a elevación 0 (agua).
            const edgeDist = Math.max(Math.abs(nx), Math.abs(ny));
            const edgeFalloff = Math.max(0, 1 - Math.pow(edgeDist, 3.0));

            // 4. Modelado de la Máscara Continental (Shape Mask)
            let shapeMask = 0;
            if (worldType === 0) {
                // Modelo Pangea: Función de distancia radial + ruido de deformación
                const pangeaDist = Math.sqrt(nx * nx + ny * ny);
                const noiseMask = perlin.fractal(x * scale * 0.5, y * scale * 0.5, 3, 0.5, 2.0);
                shapeMask = 1.0 - pangeaDist * 0.8 + noiseMask * 0.4;
            } else {
                // Modelo Multinodal: Heurística de proximidad a centros de masa
                for(const cont of continents) {
                    const dx = nx - cont.x;
                    const dy = ny - cont.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const influence = Math.max(0, cont.size - dist) / cont.size;
                    shapeMask = Math.max(shapeMask, Math.pow(influence, 1.5));
                }
                const noiseMask = perlin.fractal(x * scale * 0.3, y * scale * 0.3, 3, 0.5, 2);
                shapeMask = shapeMask * 0.6 + noiseMask * 0.4;
            }

            // Integración de la máscara con el ruido fractal
            shapeMask *= edgeFalloff;
            elevation = elevation * 0.55 + shapeMask * 0.45;
            
            // 5. Exponenciación de Cordilleras (Mountain Accentuation)
            // Aplica una curva de potencia a las elevaciones altas para crear picos escarpados.
            if (elevation > 0.6) {
                elevation += Math.pow(elevation - 0.6, 1.5);
            }
            
            // Clump y guardado en buffer
            elevation = Math.max(0, Math.min(1, elevation));
            map[y * width + x] = elevation;
        }
    }

    return map;
}

