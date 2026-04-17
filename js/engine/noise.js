/**
 * noise.js - Generadores de Ruido Adicionales
 * 
 * Genera mapas de humedad y temperatura para complementar
 * la elevación y determinar los biomas del mundo.
 */

import { PerlinNoise } from './perlin.js';

/**
 * Genera mapa de humedad usando Perlin con offset de semilla
 * La humedad se combina con la elevación para determinar biomas
 * @param {import('./seed.js').SeededRNG} rng - Generador con semilla derivada
 * @param {number} width - Ancho del mapa
 * @param {number} height - Alto del mapa
 * @returns {Float32Array} Mapa de humedad [0, 1]
 */
export function generateMoistureMap(rng, width, height) {
    const perlin = new PerlinNoise(rng);
    const map = new Float32Array(width * height);
    const scale = 0.006;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Usar coordenadas con offset para que no coincida con elevación
            let moisture = perlin.fractal(
                (x + 500) * scale,
                (y + 500) * scale,
                5, 0.5, 2.0
            );

            // Añadir variación costera: cercanía al agua = más humedad
            map[y * width + x] = Math.max(0, Math.min(1, moisture));
        }
    }

    return map;
}

/**
 * Genera mapa de temperatura basado en latitud + ruido
 * Las zonas ecuatoriales (centro Y) son más cálidas
 * @param {import('./seed.js').SeededRNG} rng - Generador con semilla derivada
 * @param {number} width - Ancho del mapa
 * @param {number} height - Alto del mapa
 * @param {Float32Array} elevationMap - Mapa de elevación (mayor altura = más frío)
 * @returns {Float32Array} Mapa de temperatura [0, 1]
 */
export function generateTemperatureMap(rng, width, height, elevationMap) {
    const perlin = new PerlinNoise(rng);
    const map = new Float32Array(width * height);
    const scale = 0.005;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Base: gradiente latitudinal (centro = cálido, polos = frío)
            const latFactor = 1 - Math.abs((y / height) * 2 - 1);
            
            // Variación de ruido para romper la uniformidad
            const noiseVar = perlin.fractal(
                (x + 1000) * scale,
                (y + 1000) * scale,
                4, 0.45, 2.0
            ) * 0.3;

            // La altitud reduce la temperatura
            const elevation = elevationMap[y * width + x];
            const altitudePenalty = Math.max(0, (elevation - 0.5) * 0.6);

            let temp = latFactor * 0.7 + noiseVar - altitudePenalty;
            map[y * width + x] = Math.max(0, Math.min(1, temp));
        }
    }

    return map;
}

/**
 * Aplica modificador de humedad costera.
 * Las celdas cercanas al agua tienen más humedad.
 * @param {Float32Array} moistureMap - Mapa de humedad a modificar
 * @param {Float32Array} elevationMap - Mapa de elevación
 * @param {number} width - Ancho del mapa
 * @param {number} height - Alto del mapa
 * @param {number} waterLevel - Nivel del agua [0, 1]
 */
export function applyCoastalMoisture(moistureMap, elevationMap, width, height, waterLevel = 0.35) {
    const radius = 12;
    const tempMap = new Float32Array(moistureMap);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (elevationMap[idx] <= waterLevel) continue;

            // Buscar agua cercana en un radio
            let nearWater = false;
            let minDist = radius + 1;

            for (let dy = -radius; dy <= radius && !nearWater; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    
                    if (elevationMap[ny * width + nx] <= waterLevel) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < minDist) {
                            minDist = dist;
                            nearWater = true;
                        }
                    }
                }
            }

            if (nearWater) {
                // Incrementar humedad proporcionalmente a la cercanía al agua
                const boost = (1 - minDist / radius) * 0.3;
                tempMap[idx] = Math.min(1, moistureMap[idx] + boost);
            }
        }
    }

    // Copiar resultado de vuelta
    moistureMap.set(tempMap);
}
