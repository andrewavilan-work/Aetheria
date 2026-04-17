/**
 * economy.js - Sistema Económico Procedural
 * 
 * Genera recursos naturales por bioma, rutas de comercio
 * entre civilizaciones, y un sistema de monedas y valor.
 */

import { BIOME_DEFS } from './biomes.js';

// === RECURSOS POR BIOMA ===
const BIOME_RESOURCES = {
    OCEAN_DEEP: ['Perlas Abisales', 'Tentáculo de Kraken', 'Coral Oscuro', 'Lumisfera'],
    OCEAN_SHALLOW: ['Pesca Abundante', 'Sal Marina', 'Conchas Nacaradas', 'Alga Medicinal'],
    CORAL_REEF: ['Coral Luminoso', 'Perla de Sirena', 'Esponja Mágica', 'Tinte Coralino'],
    BEACH: ['Arena de Cristal', 'Ámbar Marino', 'Madera de Deriva', 'Concha Rúnica'],
    SWAMP: ['Turba Encantada', 'Savia Oscura', 'Hierba de Bruma', 'Huevo de Hidra'],
    JUNGLE: ['Madera Preciosa', 'Especias Raras', 'Veneno de Liana', 'Fruta del Sol', 'Pluma de Quetzal'],
    FOREST: ['Madera Ancestral', 'Resina Dorada', 'Setas Luminosas', 'Bayas Curativas', 'Miel Silvestre'],
    GRASSLAND: ['Grano Dorado', 'Cuero Fino', 'Hierba Medicinal', 'Miel de Pradera'],
    SAVANNA: ['Marfil de Bestia', 'Cuero Grueso', 'Semillas Resistentes', 'Especia Seca'],
    DESERT: ['Vidrio de Arena', 'Gema Solar', 'Escorpión Mágico', 'Incienso del Desierto', 'Mineral de Fuego'],
    TUNDRA: ['Pieles Gruesas', 'Cristal de Hielo', 'Hueso de Mamut', 'Raíz Helada'],
    TAIGA: ['Pino Ancestral', 'Piel de Lobo', 'Ámbar del Norte', 'Raíz de Frost'],
    MOUNTAIN: ['Hierro Rúnico', 'Gema Profunda', 'Cristal de Rayo', 'Piedra Rúnica', 'Mithril'],
    SNOW_PEAK: ['Plata de Cumbre', 'Nieve Eterna', 'Escama de Dragón', 'Aliento Helado'],
    VOLCANO: ['Obsidiana Viva', 'Magma Sólido', 'Llama Eterna', 'Azufre Arcano', 'Rubí de Fuego']
};

/** Categorías de recursos */
const RESOURCE_CATEGORIES = {
    alimento: ['Pesca Abundante', 'Grano Dorado', 'Fruta del Sol', 'Bayas Curativas', 'Miel de Pradera', 'Miel Silvestre'],
    material: ['Madera Preciosa', 'Madera Ancestral', 'Cuero Fino', 'Cuero Grueso', 'Pieles Gruesas', 'Piel de Lobo', 'Pino Ancestral', 'Madera de Deriva'],
    mágico: ['Cristal de Rayo', 'Gema Solar', 'Llama Eterna', 'Obsidiana Viva', 'Mithril', 'Lumisfera', 'Turba Encantada', 'Coral Luminoso'],
    mineral: ['Hierro Rúnico', 'Gema Profunda', 'Plata de Cumbre', 'Rubí de Fuego', 'Vidrio de Arena', 'Ámbar del Norte'],
    medicina: ['Hierba de Bruma', 'Hierba Medicinal', 'Alga Medicinal', 'Setas Luminosas', 'Raíz Helada'],
    lujo: ['Perlas Abisales', 'Especias Raras', 'Incienso del Desierto', 'Concha Rúnica', 'Escama de Dragón']
};

/**
 * Genera el sistema económico del mundo
 * @param {import('../engine/seed.js').SeededRNG} rng
 * @param {Object} biomeDistribution - Distribución de biomas
 * @param {Array} cultures - Civilizaciones generadas
 * @param {import('./names.js').NameGenerator} nameGen
 * @returns {Object} Sistema económico completo
 */
export function generateEconomy(rng, biomeDistribution, cultures, nameGen) {
    // Asignar recursos a cada civilización según su bioma
    const cultureResources = {};
    for (const culture of cultures) {
        const biomeRes = BIOME_RESOURCES[culture.homeBiome] || ['Recurso Genérico'];
        // Cada civilización tiene acceso a 2-4 recursos de su bioma
        const numResources = rng.intRange(2, Math.min(4, biomeRes.length));
        const resources = rng.shuffle([...biomeRes]).slice(0, numResources);
        
        cultureResources[culture.name] = {
            resources,
            specialty: resources[0], // El recurso principal
            abundance: rng.pick(['escasa', 'moderada', 'abundante', 'sobreabundante'])
        };
    }

    // Generar rutas de comercio
    const tradeRoutes = _generateTradeRoutes(rng, cultures, cultureResources, nameGen);

    // Sistema de monedas
    const currencies = _generateCurrencies(rng, cultures, nameGen);

    // Mercados y puntos de comercio
    const markets = _generateMarkets(rng, cultures, nameGen);

    return {
        resources: cultureResources,
        tradeRoutes,
        currencies,
        markets,
        // Resumen económico
        summary: _generateEconomicSummary(cultures, cultureResources, tradeRoutes)
    };
}

/**
 * Genera rutas de comercio entre civilizaciones
 * @private
 */
function _generateTradeRoutes(rng, cultures, cultureResources, nameGen) {
    const routes = [];

    for (let i = 0; i < cultures.length; i++) {
        for (let j = i + 1; j < cultures.length; j++) {
            const cA = cultures[i];
            const cB = cultures[j];
            
            // Solo hay ruta si la relación no es de guerra
            const rel = cA.relationships[cB.name];
            if (rel && rel.level < -2) continue;

            // Probabilidad de ruta basada en la relación
            const routeChance = 0.3 + (rel ? (rel.level + 3) / 6 * 0.5 : 0.3);
            if (rng.next() > routeChance) continue;

            const resA = cultureResources[cA.name];
            const resB = cultureResources[cB.name];

            routes.push({
                name: `Ruta ${nameGen.placeName()}`,
                from: cA.name,
                to: cB.name,
                exports: resA.specialty,
                imports: resB.specialty,
                danger: rng.pick(['segura', 'moderada', 'peligrosa', 'mortal']),
                active: rel ? rel.level >= 0 : true,
                description: `Conecta a los ${cA.name} con los ${cB.name}, intercambiando ${resA.specialty} por ${resB.specialty}.`
            });
        }
    }

    return routes;
}

/**
 * Genera monedas para las principales civilizaciones
 * @private
 */
function _generateCurrencies(rng, cultures, nameGen) {
    const materials = ['oro', 'plata', 'cristal', 'jade', 'obsidiana', 'coral', 'hueso rúnico', 'ámbar'];
    const forms = ['monedas', 'lingotes', 'gemas talladas', 'cuentas', 'fichas rúnicas', 'escamas', 'anillos'];
    
    return cultures.map(culture => {
        const material = rng.pick(materials);
        const form = rng.pick(forms);
        return {
            culture: culture.name,
            name: `${rng.pick(['Dracma', 'Talero', 'Corona', 'Sello', 'Marca', 'Runa', 'Florín', 'Áureo'])} de ${culture.name}`,
            material,
            form,
            description: `${form.charAt(0).toUpperCase() + form.slice(1)} de ${material}, usadas por los ${culture.name}.`
        };
    });
}

/**
 * Genera mercados y puntos de comercio
 * @private
 */
function _generateMarkets(rng, cultures, nameGen) {
    const marketTypes = ['Bazar', 'Mercado', 'Feria', 'Puerto', 'Encrucijada', 'Plaza de Intercambio'];
    const markets = [];

    // Al menos un mercado por cada civilización importante
    for (const culture of cultures.filter(c => c.populationScale >= 4)) {
        markets.push({
            name: `${rng.pick(marketTypes)} de ${nameGen.placeName()}`,
            owner: culture.name,
            type: rng.pick(marketTypes),
            size: culture.populationScale >= 7 ? 'grande' : culture.populationScale >= 4 ? 'mediano' : 'pequeño',
            specialty: rng.pick(['armas', 'especias', 'gemas', 'alimentos', 'pociones', 'animales', 'artefactos']),
            description: `Centro de comercio de la civilización ${culture.name}.`
        });
    }

    return markets;
}

/**
 * Genera resumen económico del mundo
 * @private
 */
function _generateEconomicSummary(cultures, resources, routes) {
    const activeTrade = routes.filter(r => r.active).length;
    const totalResources = Object.values(resources).reduce((sum, r) => sum + r.resources.length, 0);
    
    return {
        totalCivilizations: cultures.length,
        totalTradeRoutes: routes.length,
        activeTradeRoutes: activeTrade,
        totalUniqueResources: totalResources,
        economicStability: activeTrade > routes.length / 2 ? 'Estable' : 'Volátil'
    };
}
