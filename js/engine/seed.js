/**
 * seed.js - Sistema de Semillas Determinístico
 * 
 * Convierte cualquier cadena de texto en un número reproducible
 * que alimenta todo el generador de mundos. 
 * Misma semilla = Mismo mundo, siempre.
 * 
 * Usa MurmurHash3 para hashing y Mulberry32 para PRNG.
 */

/**
 * MurmurHash3 - Genera un hash de 32 bits a partir de una cadena.
 * Rápido, determinístico y con buena distribución.
 * @param {string} str - La semilla en texto
 * @returns {number} Hash de 32 bits
 */
export function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
}

/**
 * Generador de Números Pseudo-Aleatorios Determinístico (Mulberry32).
 * Cada instancia produce la misma secuencia para la misma semilla.
 */
export class SeededRNG {
    /**
     * @param {number|string} seed - Semilla numérica o texto
     */
    constructor(seed) {
        this.seed = typeof seed === 'string' ? hashSeed(seed) : seed;
        this.state = this.seed;
    }

    /**
     * Genera el siguiente número pseudo-aleatorio [0, 1)
     * @returns {number}
     */
    next() {
        let t = (this.state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Número aleatorio en rango [min, max)
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    range(min, max) {
        return min + this.next() * (max - min);
    }

    /**
     * Entero aleatorio en rango [min, max]
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    intRange(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    /**
     * Seleccionar un elemento aleatorio de un arreglo
     * @param {Array} arr 
     * @returns {*}
     */
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }

    /**
     * Mezclar un arreglo (Fisher-Yates determinístico)
     * @param {Array} arr - Arreglo a mezclar (se modifica in-place)
     * @returns {Array}
     */
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Crear una copia con una sub-semilla derivada
     * Útil para generar subsistemas independientes
     * @param {string} namespace - Nombre del subsistema
     * @returns {SeededRNG}
     */
    fork(namespace) {
        return new SeededRNG(hashSeed(this.seed.toString() + namespace));
    }
}
