/**
 * biomes.js - Sistema de Biomas Dinámicos
 * 
 * Determina el bioma de cada celda del mapa cruzando
 * elevación × humedad × temperatura.
 * Cada bioma tiene colores, nombres temáticos y criaturas asociadas.
 */

/**
 * Definiciones de todos los biomas del mundo.
 * Cada bioma incluye colores para renderizado y metadatos descriptivos.
 */
export const BIOME_DEFS = {
    OCEAN_DEEP: {
        id: 'OCEAN_DEEP',
        name: 'Océano Profundo',
        nameEn: 'Deep Ocean',
        color: '#0a1628',
        colorAlt: '#0d1e3a',
        icon: '🌊',
        description: 'Abismos insondables donde la luz nunca llega.',
        resources: ['perlas abisales', 'coral oscuro', 'algas luminosas'],
        habitability: 0.1,
        danger: 0.8
    },
    OCEAN_SHALLOW: {
        id: 'OCEAN_SHALLOW',
        name: 'Mar Costero',
        nameEn: 'Shallow Sea',
        color: '#1a4a6e',
        colorAlt: '#1e5580',
        icon: '🐚',
        description: 'Aguas cristalinas ricas en vida marina.',
        resources: ['pesca abundante', 'sal marina', 'conchas mágicas'],
        habitability: 0.3,
        danger: 0.3
    },
    BEACH: {
        id: 'BEACH',
        name: 'Costa Dorada',
        nameEn: 'Golden Coast',
        color: '#d4b96a',
        colorAlt: '#c9a94f',
        icon: '🏖️',
        description: 'Playas de arena fina donde las olas cantan.',
        resources: ['arena de cristal', 'ámbar marino', 'madera flotante'],
        habitability: 0.6,
        danger: 0.2
    },
    SWAMP: {
        id: 'SWAMP',
        name: 'Pantano de las Brumas',
        nameEn: 'Mist Swamp',
        color: '#3a5a3a',
        colorAlt: '#2d4a2d',
        icon: '🌿',
        description: 'Tierras anegadas donde la niebla nunca se disipa.',
        resources: ['hierbas medicinales', 'turba encantada', 'savia de pantano'],
        habitability: 0.3,
        danger: 0.6
    },
    JUNGLE: {
        id: 'JUNGLE',
        name: 'Selva de los Susurros',
        nameEn: 'Whispering Jungle',
        color: '#1a6b2a',
        colorAlt: '#157525',
        icon: '🌴',
        description: 'Vegetación impenetrable donde los árboles hablan entre sí.',
        resources: ['frutas exóticas', 'madera preciosa', 'veneno de liana', 'especias raras'],
        habitability: 0.5,
        danger: 0.7
    },
    FOREST: {
        id: 'FOREST',
        name: 'Bosque Ancestral',
        nameEn: 'Ancient Forest',
        color: '#2d6b3f',
        colorAlt: '#1f5c30',
        icon: '🌲',
        description: 'Bosques milenarios que recuerdan los orígenes del mundo.',
        resources: ['madera ancestral', 'bayas silvestres', 'setas luminosas', 'resina dorada'],
        habitability: 0.7,
        danger: 0.4
    },
    GRASSLAND: {
        id: 'GRASSLAND',
        name: 'Pradera Eterna',
        nameEn: 'Eternal Prairie',
        color: '#7caa2d',
        colorAlt: '#6b9a1f',
        icon: '🌾',
        description: 'Llanuras ondulantes donde el viento canta libremente.',
        resources: ['grano dorado', 'miel silvestre', 'caballos salvajes', 'hierba medicinal'],
        habitability: 0.9,
        danger: 0.2
    },
    SAVANNA: {
        id: 'SAVANNA',
        name: 'Sabana del Crepúsculo',
        nameEn: 'Twilight Savanna',
        color: '#b8a040',
        colorAlt: '#a89030',
        icon: '🦁',
        description: 'Tierras secas bañadas por un sol perpetuo.',
        resources: ['marfil de bestia', 'cuero endurecido', 'semillas resistentes'],
        habitability: 0.6,
        danger: 0.5
    },
    DESERT: {
        id: 'DESERT',
        name: 'Desierto de Ceniza',
        nameEn: 'Ash Desert',
        color: '#c4a35a',
        colorAlt: '#d4b060',
        icon: '🏜️',
        description: 'Extensiones infinitas de arena donde el tiempo se detiene.',
        resources: ['vidrio de arena', 'minerales secos', 'gemas solares', 'escorpiones mágicos'],
        habitability: 0.2,
        danger: 0.7
    },
    TUNDRA: {
        id: 'TUNDRA',
        name: 'Tundra del Silencio',
        nameEn: 'Silent Tundra',
        color: '#8a9a8a',
        colorAlt: '#7a8a7a',
        icon: '❄️',
        description: 'Tierras heladas donde solo sobreviven los más fuertes.',
        resources: ['pieles gruesas', 'huesos de mamut', 'cristales de hielo', 'musgo resistente'],
        habitability: 0.2,
        danger: 0.6
    },
    MOUNTAIN: {
        id: 'MOUNTAIN',
        name: 'Montañas del Trueno',
        nameEn: 'Thunder Mountains',
        color: '#6a6a6a',
        colorAlt: '#5a5a5a',
        icon: '⛰️',
        description: 'Picos imponentes donde los dioses observan el mundo.',
        resources: ['mineral de hierro', 'gemas profundas', 'cristal de rayo', 'piedra rúnica'],
        habitability: 0.3,
        danger: 0.7
    },
    SNOW_PEAK: {
        id: 'SNOW_PEAK',
        name: 'Pico Nevado',
        nameEn: 'Snow Peak',
        color: '#e8e8f0',
        colorAlt: '#d8d8e8',
        icon: '🏔️',
        description: 'Cumbres cubiertas de nieve eterna donde habitan los dragones.',
        resources: ['nieve eterna', 'plata de cumbre', 'aliento de dragón'],
        habitability: 0.1,
        danger: 0.9
    },
    VOLCANO: {
        id: 'VOLCANO',
        name: 'Tierras del Fuego',
        nameEn: 'Fire Lands',
        color: '#8b2500',
        colorAlt: '#a03000',
        icon: '🌋',
        description: 'Regiones volcánicas donde la tierra arde sin cesar.',
        resources: ['obsidiana', 'magma solidificado', 'llama eterna', 'azufre mágico'],
        habitability: 0.1,
        danger: 0.95
    },
    CORAL_REEF: {
        id: 'CORAL_REEF',
        name: 'Arrecife Viviente',
        nameEn: 'Living Reef',
        color: '#2a8a8a',
        colorAlt: '#1a7a7a',
        icon: '🐠',
        description: 'Formaciones coralinas que brillan con luz propia.',
        resources: ['coral luminoso', 'perlas marinas', 'algas curativas'],
        habitability: 0.4,
        danger: 0.3
    },
    TAIGA: {
        id: 'TAIGA',
        name: 'Taiga de los Espíritus',
        nameEn: 'Spirit Taiga',
        color: '#2a5a4a',
        colorAlt: '#1a4a3a',
        icon: '🌲',
        description: 'Bosques de coníferas donde los espíritus del norte deambulan.',
        resources: ['pino ancestral', 'pieles de lobo', 'ámbar del norte', 'raíces heladas'],
        habitability: 0.4,
        danger: 0.5
    }
};

/** Nivel del mar por defecto */
export const WATER_LEVEL = 0.35;

/**
 * Determina el bioma de una celda según sus valores ambientales
 * @param {number} elevation - Elevación [0, 1]
 * @param {number} moisture - Humedad [0, 1]
 * @param {number} temperature - Temperatura [0, 1]
 * @returns {string} ID del bioma
 */
export function getBiome(elevation, moisture, temperature) {
    // --- AGUA ---
    if (elevation < 0.2) return 'OCEAN_DEEP';
    if (elevation < WATER_LEVEL) {
        if (temperature > 0.6 && moisture > 0.5) return 'CORAL_REEF';
        return 'OCEAN_SHALLOW';
    }

    // --- COSTA ---
    if (elevation < 0.4) {
        if (moisture > 0.7 && temperature > 0.5) return 'SWAMP';
        if (moisture < 0.3) return 'BEACH';
    }

    // --- TIERRAS ALTAS ---
    if (elevation > 0.85) return 'SNOW_PEAK';
    if (elevation > 0.75) {
        if (temperature > 0.6) return 'VOLCANO';
        return 'MOUNTAIN';
    }

    // --- TIERRAS MEDIAS ---
    // Frío
    if (temperature < 0.25) {
        if (moisture > 0.5) return 'TAIGA';
        return 'TUNDRA';
    }

    // Cálido y húmedo
    if (temperature > 0.6) {
        if (moisture > 0.65) return 'JUNGLE';
        if (moisture > 0.4) return 'FOREST';
        if (moisture > 0.2) return 'SAVANNA';
        return 'DESERT';
    }

    // Templado
    if (moisture > 0.6) return 'FOREST';
    if (moisture > 0.35) return 'GRASSLAND';
    if (moisture > 0.15) return 'SAVANNA';
    return 'DESERT';
}

/**
 * Genera el mapa completo de biomas
 * @param {Float32Array} elevationMap 
 * @param {Float32Array} moistureMap 
 * @param {Float32Array} temperatureMap 
 * @param {number} width 
 * @param {number} height 
 * @returns {string[]} Array con el ID del bioma para cada celda
 */
export function generateBiomeMap(elevationMap, moistureMap, temperatureMap, width, height) {
    const biomeMap = new Array(width * height);

    for (let i = 0; i < width * height; i++) {
        biomeMap[i] = getBiome(elevationMap[i], moistureMap[i], temperatureMap[i]);
    }

    return biomeMap;
}

/**
 * Analiza la distribución de biomas en el mapa
 * Útil para determinar qué criaturas y civilizaciones generar
 * @param {string[]} biomeMap 
 * @returns {Object} Conteo y porcentaje de cada bioma
 */
export function analyzeBiomeDistribution(biomeMap) {
    const counts = {};
    const total = biomeMap.length;

    for (const biome of biomeMap) {
        counts[biome] = (counts[biome] || 0) + 1;
    }

    const distribution = {};
    for (const [biome, count] of Object.entries(counts)) {
        distribution[biome] = {
            count,
            percentage: (count / total * 100).toFixed(1),
            def: BIOME_DEFS[biome]
        };
    }

    return distribution;
}
