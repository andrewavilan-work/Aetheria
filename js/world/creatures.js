/**
 * creatures.js - Bestiario Procedural
 * 
 * Genera criaturas únicas basadas en el bioma dominante del mundo,
 * usando arquetipos de mitologías globales (griega, nórdica, 
 * mesoamericana, japonesa, hindú, eslava, africana, china y más).
 * Cada criatura tiene stats, descripción narrativa y adaptación al bioma.
 */

// === ARQUETIPOS BASE DE MITOLOGÍAS GLOBALES ===
// Cada arquetipo se adapta al bioma donde aparece

const ARCHETYPES = [
    // --- MITOLOGÍA GRIEGA ---
    { base: 'Hidra', origin: 'griega', bodyType: 'serpentine', biomes: ['SWAMP', 'OCEAN_SHALLOW', 'CORAL_REEF'], 
      traits: ['multi-cabeza', 'regeneración', 'veneno'], baseStats: { danger: 8, magic: 5, agility: 4, intelligence: 3, resistance: 9 } },
    { base: 'Grifo', origin: 'griega', bodyType: 'winged_quad', biomes: ['MOUNTAIN', 'GRASSLAND', 'SNOW_PEAK'],
      traits: ['vuelo', 'garras', 'visión aguda'], baseStats: { danger: 7, magic: 3, agility: 9, intelligence: 6, resistance: 5 } },
    { base: 'Minotauro', origin: 'griega', bodyType: 'humanoid', biomes: ['MOUNTAIN', 'FOREST', 'VOLCANO'],
      traits: ['fuerza bruta', 'cuernos', 'territorial'], baseStats: { danger: 7, magic: 2, agility: 5, intelligence: 4, resistance: 8 } },
    { base: 'Sátiro', origin: 'griega', bodyType: 'humanoid', biomes: ['FOREST', 'GRASSLAND', 'JUNGLE'],
      traits: ['música mágica', 'agilidad', 'empatía natural'], baseStats: { danger: 3, magic: 7, agility: 7, intelligence: 6, resistance: 3 } },
    { base: 'Quimera', origin: 'griega', bodyType: 'hybrid', biomes: ['VOLCANO', 'MOUNTAIN', 'DESERT'],
      traits: ['aliento de fuego', 'múltiples formas', 'furia'], baseStats: { danger: 9, magic: 6, agility: 6, intelligence: 3, resistance: 7 } },

    // --- MITOLOGÍA NÓRDICA ---
    { base: 'Fenrir', origin: 'nórdica', bodyType: 'quadruped', biomes: ['TUNDRA', 'TAIGA', 'SNOW_PEAK'],
      traits: ['mandíbulas titánicas', 'aullido helado', 'instinto alfa'], baseStats: { danger: 10, magic: 4, agility: 7, intelligence: 5, resistance: 9 } },
    { base: 'Jörmungandr', origin: 'nórdica', bodyType: 'serpentine', biomes: ['OCEAN_DEEP', 'OCEAN_SHALLOW'],
      traits: ['tamaño colosal', 'veneno mundial', 'mareas'], baseStats: { danger: 10, magic: 8, agility: 3, intelligence: 4, resistance: 10 } },
    { base: 'Valquiria', origin: 'nórdica', bodyType: 'winged_humanoid', biomes: ['SNOW_PEAK', 'MOUNTAIN', 'TUNDRA'],
      traits: ['vuelo celestial', 'espada rúnica', 'juicio'], baseStats: { danger: 7, magic: 8, agility: 8, intelligence: 9, resistance: 6 } },
    { base: 'Draugr', origin: 'nórdica', bodyType: 'humanoid', biomes: ['TUNDRA', 'SWAMP', 'MOUNTAIN'],
      traits: ['no-muerto', 'fuerza sobrenatural', 'maldición'], baseStats: { danger: 6, magic: 5, agility: 3, intelligence: 2, resistance: 8 } },

    // --- MITOLOGÍA MESOAMERICANA ---
    { base: 'Quetzalcóatl', origin: 'mesoamericana', bodyType: 'serpentine_winged', biomes: ['JUNGLE', 'MOUNTAIN', 'FOREST'],
      traits: ['serpiente emplumada', 'control del viento', 'sabiduría'], baseStats: { danger: 8, magic: 10, agility: 8, intelligence: 10, resistance: 6 } },
    { base: 'Nagual', origin: 'mesoamericana', bodyType: 'shapeshifter', biomes: ['JUNGLE', 'FOREST', 'SWAMP'],
      traits: ['cambiaformas', 'magia nocturna', 'sigilo'], baseStats: { danger: 6, magic: 8, agility: 7, intelligence: 7, resistance: 4 } },
    { base: 'Ahuízotl', origin: 'mesoamericana', bodyType: 'quadruped', biomes: ['SWAMP', 'JUNGLE', 'OCEAN_SHALLOW'],
      traits: ['mano en la cola', 'acuático', 'emboscador'], baseStats: { danger: 7, magic: 4, agility: 8, intelligence: 5, resistance: 5 } },
    { base: 'Cipactli', origin: 'mesoamericana', bodyType: 'reptilian', biomes: ['OCEAN_DEEP', 'SWAMP', 'CORAL_REEF'],
      traits: ['devorador primordial', 'bocas múltiples', 'creación'], baseStats: { danger: 9, magic: 7, agility: 4, intelligence: 3, resistance: 10 } },

    // --- MITOLOGÍA JAPONESA ---
    { base: 'Kitsune', origin: 'japonesa', bodyType: 'quadruped', biomes: ['FOREST', 'GRASSLAND', 'TAIGA'],
      traits: ['colas múltiples', 'ilusiones', 'fuego mágico'], baseStats: { danger: 5, magic: 9, agility: 8, intelligence: 9, resistance: 4 } },
    { base: 'Oni', origin: 'japonesa', bodyType: 'humanoid', biomes: ['MOUNTAIN', 'VOLCANO', 'FOREST'],
      traits: ['fuerza demoníaca', 'cuernos', 'kanabō'], baseStats: { danger: 8, magic: 4, agility: 5, intelligence: 4, resistance: 8 } },
    { base: 'Ryūjin', origin: 'japonesa', bodyType: 'serpentine', biomes: ['OCEAN_DEEP', 'OCEAN_SHALLOW', 'CORAL_REEF'],
      traits: ['control de mareas', 'joya de las mareas', 'sabiduría marina'], baseStats: { danger: 8, magic: 10, agility: 7, intelligence: 9, resistance: 7 } },
    { base: 'Tengu', origin: 'japonesa', bodyType: 'winged_humanoid', biomes: ['MOUNTAIN', 'FOREST', 'TAIGA'],
      traits: ['maestro espadachín', 'vuelo', 'arrogancia'], baseStats: { danger: 7, magic: 6, agility: 9, intelligence: 8, resistance: 5 } },
    { base: 'Tsuchigumo', origin: 'japonesa', bodyType: 'arachnid', biomes: ['FOREST', 'JUNGLE', 'SWAMP'],
      traits: ['telarañas mágicas', 'veneno', 'emboscada'], baseStats: { danger: 7, magic: 6, agility: 7, intelligence: 6, resistance: 5 } },

    // --- MITOLOGÍA HINDÚ ---
    { base: 'Garuda', origin: 'hindú', bodyType: 'winged_humanoid', biomes: ['MOUNTAIN', 'GRASSLAND', 'JUNGLE'],
      traits: ['rey de las aves', 'velocidad divina', 'enemigo de serpientes'], baseStats: { danger: 8, magic: 7, agility: 10, intelligence: 8, resistance: 6 } },
    { base: 'Naga', origin: 'hindú', bodyType: 'serpentine', biomes: ['JUNGLE', 'SWAMP', 'OCEAN_SHALLOW'],
      traits: ['guardián de tesoros', 'capucha de cobra', 'magia acuática'], baseStats: { danger: 7, magic: 8, agility: 6, intelligence: 8, resistance: 6 } },
    { base: 'Rakshasa', origin: 'hindú', bodyType: 'humanoid', biomes: ['JUNGLE', 'DESERT', 'FOREST'],
      traits: ['ilusionista', 'cambiaformas', 'devorador'], baseStats: { danger: 8, magic: 9, agility: 6, intelligence: 8, resistance: 5 } },

    // --- MITOLOGÍA ESLAVA ---
    { base: 'Leshy', origin: 'eslava', bodyType: 'humanoid', biomes: ['FOREST', 'TAIGA', 'JUNGLE'],
      traits: ['señor del bosque', 'cambio de tamaño', 'control de animales'], baseStats: { danger: 6, magic: 8, agility: 5, intelligence: 7, resistance: 7 } },
    { base: 'Rusalka', origin: 'eslava', bodyType: 'humanoid', biomes: ['SWAMP', 'OCEAN_SHALLOW', 'FOREST'],
      traits: ['canto hipnótico', 'acuática', 'melancolía'], baseStats: { danger: 5, magic: 8, agility: 6, intelligence: 6, resistance: 3 } },
    { base: 'Zmey Gorynych', origin: 'eslava', bodyType: 'winged_quad', biomes: ['MOUNTAIN', 'VOLCANO', 'FOREST'],
      traits: ['tres cabezas', 'aliento de fuego', 'escamas de hierro'], baseStats: { danger: 9, magic: 7, agility: 5, intelligence: 5, resistance: 9 } },
    { base: 'Baba Yaga', origin: 'eslava', bodyType: 'humanoid', biomes: ['FOREST', 'SWAMP', 'TAIGA'],
      traits: ['brujería', 'cabaña viviente', 'sabiduría oscura'], baseStats: { danger: 7, magic: 10, agility: 4, intelligence: 10, resistance: 5 } },

    // --- MITOLOGÍA AFRICANA ---
    { base: 'Anansi', origin: 'africana', bodyType: 'arachnid', biomes: ['JUNGLE', 'FOREST', 'SAVANNA'],
      traits: ['tejedor de historias', 'astucia', 'trampas'], baseStats: { danger: 4, magic: 8, agility: 7, intelligence: 10, resistance: 3 } },
    { base: 'Mokele-mbembe', origin: 'africana', bodyType: 'reptilian', biomes: ['JUNGLE', 'SWAMP', 'OCEAN_SHALLOW'],
      traits: ['tamaño colosal', 'herbívoro', 'antiguo'], baseStats: { danger: 7, magic: 3, agility: 3, intelligence: 3, resistance: 10 } },
    { base: 'Mami Wata', origin: 'africana', bodyType: 'serpentine', biomes: ['OCEAN_SHALLOW', 'CORAL_REEF', 'SWAMP'],
      traits: ['belleza hipnótica', 'curación', 'riqueza'], baseStats: { danger: 5, magic: 9, agility: 6, intelligence: 8, resistance: 4 } },
    { base: 'Impundulu', origin: 'africana', bodyType: 'winged', biomes: ['SAVANNA', 'GRASSLAND', 'MOUNTAIN'],
      traits: ['pájaro de trueno', 'rayo', 'vampirismo'], baseStats: { danger: 8, magic: 7, agility: 9, intelligence: 5, resistance: 5 } },

    // --- MITOLOGÍA CHINA ---
    { base: 'Qilin', origin: 'china', bodyType: 'quadruped', biomes: ['FOREST', 'GRASSLAND', 'MOUNTAIN'],
      traits: ['aura de paz', 'juicio moral', 'protector'], baseStats: { danger: 4, magic: 9, agility: 7, intelligence: 9, resistance: 7 } },
    { base: 'Fenghuang', origin: 'china', bodyType: 'winged', biomes: ['MOUNTAIN', 'JUNGLE', 'FOREST'],
      traits: ['inmortalidad', 'llamas cósmicas', 'armonía'], baseStats: { danger: 6, magic: 10, agility: 8, intelligence: 8, resistance: 6 } },
    { base: 'Pixiu', origin: 'china', bodyType: 'winged_quad', biomes: ['MOUNTAIN', 'DESERT', 'GRASSLAND'],
      traits: ['devorador de riquezas', 'guardián', 'sin ano'], baseStats: { danger: 6, magic: 7, agility: 6, intelligence: 5, resistance: 8 } },

    // --- CRIATURAS UNIVERSALES ---
    { base: 'Golem', origin: 'universal', bodyType: 'humanoid', biomes: ['MOUNTAIN', 'DESERT', 'VOLCANO', 'TUNDRA'],
      traits: ['cuerpo elemental', 'obediencia', 'resistencia extrema'], baseStats: { danger: 7, magic: 5, agility: 2, intelligence: 2, resistance: 10 } },
    { base: 'Elemental', origin: 'universal', bodyType: 'amorphous', biomes: ['VOLCANO', 'OCEAN_DEEP', 'SNOW_PEAK', 'DESERT'],
      traits: ['forma pura', 'conexión elemental', 'inmortal'], baseStats: { danger: 8, magic: 9, agility: 5, intelligence: 4, resistance: 8 } },
    { base: 'Espectro', origin: 'universal', bodyType: 'ethereal', biomes: ['SWAMP', 'TUNDRA', 'MOUNTAIN', 'FOREST'],
      traits: ['incorpóreo', 'frío mortal', 'lamento'], baseStats: { danger: 6, magic: 8, agility: 7, intelligence: 5, resistance: 2 } },
    { base: 'Wyrm', origin: 'universal', bodyType: 'serpentine', biomes: ['OCEAN_DEEP', 'DESERT', 'MOUNTAIN'],
      traits: ['cuerpo serpenteante', 'veneno', 'excavador'], baseStats: { danger: 8, magic: 5, agility: 6, intelligence: 4, resistance: 8 } },
    { base: 'Fénix', origin: 'universal', bodyType: 'winged', biomes: ['VOLCANO', 'DESERT', 'MOUNTAIN'],
      traits: ['renacimiento', 'llamas purificadoras', 'canto sanador'], baseStats: { danger: 6, magic: 10, agility: 8, intelligence: 7, resistance: 5 } },
    { base: 'Troll', origin: 'universal', bodyType: 'humanoid', biomes: ['MOUNTAIN', 'SWAMP', 'FOREST', 'TUNDRA'],
      traits: ['regeneración', 'piel de piedra', 'hambre insaciable'], baseStats: { danger: 7, magic: 2, agility: 3, intelligence: 3, resistance: 9 } },
    { base: 'Sílfide', origin: 'universal', bodyType: 'winged_humanoid', biomes: ['FOREST', 'GRASSLAND', 'JUNGLE'],
      traits: ['control del viento', 'invisibilidad', 'danza aérea'], baseStats: { danger: 3, magic: 8, agility: 10, intelligence: 7, resistance: 2 } },
    { base: 'Gusano de Arena', origin: 'universal', bodyType: 'serpentine', biomes: ['DESERT', 'BEACH', 'SAVANNA'],
      traits: ['tamaño titánico', 'detección de vibraciones', 'mandíbulas'], baseStats: { danger: 9, magic: 2, agility: 5, intelligence: 2, resistance: 9 } },
    { base: 'Kraken', origin: 'universal', bodyType: 'cephalopod', biomes: ['OCEAN_DEEP', 'OCEAN_SHALLOW'],
      traits: ['tentáculos colosales', 'tinta de oscuridad', 'inteligencia marina'], baseStats: { danger: 9, magic: 6, agility: 5, intelligence: 7, resistance: 8 } },
    { base: 'Leviatán', origin: 'universal', bodyType: 'serpentine', biomes: ['OCEAN_DEEP'],
      traits: ['destrucción marina', 'marejadas', 'antigüedad'], baseStats: { danger: 10, magic: 7, agility: 4, intelligence: 5, resistance: 10 } },
    
    // --- MITOLOGÍA LATINOAMERICANA E INDÍGENA ---
    { base: 'Chupacabras', origin: 'latinoamericana', bodyType: 'quadruped', biomes: ['SAVANNA', 'DESERT', 'GRASSLAND'],
      traits: ['vampirismo', 'sigilo nocturnal', 'terror del ganado'], baseStats: { danger: 6, magic: 3, agility: 9, intelligence: 4, resistance: 5 } },
    { base: 'Wendigo', origin: 'norteamericana', bodyType: 'humanoid', biomes: ['TAIGA', 'TUNDRA', 'SNOW_PEAK'],
      traits: ['hambre insaciable', 'mimetismo', 'corrupción de hielo'], baseStats: { danger: 9, magic: 8, agility: 8, intelligence: 6, resistance: 7 } },
      
    // --- OTRAS CRIATURAS FANTÁSTICAS ---
    { base: 'Behemoth', origin: 'universal', bodyType: 'hybrid', biomes: ['DESERT', 'SAVANNA', 'VOLCANO'],
      traits: ['fuerza continental', 'piel impenetrable', 'terremotos'], baseStats: { danger: 10, magic: 4, agility: 2, intelligence: 3, resistance: 10 } },
    { base: 'Banshee', origin: 'celta', bodyType: 'ethereal', biomes: ['SWAMP', 'FOREST', 'MOUNTAIN'],
      traits: ['grito mortal', 'presagio fúnebre', 'levitación'], baseStats: { danger: 7, magic: 9, agility: 8, intelligence: 6, resistance: 3 } },
    { base: 'Gárgola', origin: 'europea', bodyType: 'winged_humanoid', biomes: ['MOUNTAIN', 'VOLCANO', 'FOREST'],
      traits: ['piel de piedra', 'guardián', 'vuelo pesado'], baseStats: { danger: 6, magic: 4, agility: 5, intelligence: 5, resistance: 9 } }
];

/** Descripciones de comportamiento por tipo de cuerpo */
const BODY_DESCRIPTIONS = {
    serpentine: 'cuerpo sinuoso y escamas relucientes',
    serpentine_winged: 'cuerpo serpenteante coronado por alas majestuosas',
    winged_quad: 'cuatro patas poderosas y alas que oscurecen el cielo',
    winged_humanoid: 'forma humanoide con alas etéreas',
    winged: 'alas majestuosas que dominan su silueta',
    humanoid: 'forma humanoide imponente',
    quadruped: 'cuatro patas que pisan con autoridad la tierra',
    hybrid: 'forma híbrida que desafía la naturaleza',
    reptilian: 'escamas antiguas y cola devastadora',
    arachnid: 'múltiples extremidades articuladas con precisión letal',
    shapeshifter: 'forma cambiante que refleja sus emociones',
    amorphous: 'masa elemental en constante transformación',
    ethereal: 'presencia translúcida que hiela el alma',
    cephalopod: 'masa de tentáculos con inteligencia primordial'
};

/** Dietas posibles */
const DIETS = ['Carnívoro', 'Herbívoro', 'Omnívoro', 'Espiritual', 'Elemental', 'Parásito mágico', 'Fotosintético'];

/** Rarezas */
const RARITIES = [
    { name: 'Común', weight: 35, color: '#9a9a9a' },
    { name: 'Poco común', weight: 25, color: '#4a9e4a' },
    { name: 'Raro', weight: 20, color: '#4a7ab5' },
    { name: 'Épico', weight: 12, color: '#9a4ab5' },
    { name: 'Legendario', weight: 6, color: '#d4a017' },
    { name: 'Mítico', weight: 2, color: '#e04040' }
];

/** Tamaños */
const SIZES = ['Diminuto', 'Pequeño', 'Mediano', 'Grande', 'Enorme', 'Colosal', 'Titánico'];

/**
 * Genera el bestiario completo del mundo
 * @param {import('../engine/seed.js').SeededRNG} rng - Generador con semilla
 * @param {Object} biomeDistribution - Distribución de biomas del mapa
 * @param {import('./names.js').NameGenerator} nameGen - Generador de nombres
 * @param {string} seedText - Texto original de la semilla
 * @returns {Array} Lista de criaturas generadas
 */
export function generateBestiary(rng, biomeDistribution, nameGen, seedText) {
    const creatures = [];
    const dominantBiomes = Object.entries(biomeDistribution)
        .filter(([id]) => !id.startsWith('OCEAN') && id !== 'BEACH')
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 6)
        .map(([id]) => id);

    // Determinar número de criaturas (8-16 según diversidad del mundo)
    const creatureCount = 8 + Math.floor(dominantBiomes.length * 1.5);

    // Filtrar arquetipos relevantes para los biomas del mundo
    const relevantArchetypes = ARCHETYPES.filter(a =>
        a.biomes.some(b => dominantBiomes.includes(b) || biomeDistribution[b])
    );

    // Mezclar y seleccionar arquetipos
    const shuffled = [...relevantArchetypes];
    rng.shuffle(shuffled);
    const selected = shuffled.slice(0, Math.min(creatureCount, shuffled.length));

    for (const archetype of selected) {
        const creature = _generateCreature(rng, archetype, nameGen, biomeDistribution, seedText);
        creatures.push(creature);
    }

    // Ordenar por peligrosidad descendente
    creatures.sort((a, b) => b.stats.danger - a.stats.danger);

    return creatures;
}

/**
 * Genera una criatura individual a partir de un arquetipo
 * @private
 */
function _generateCreature(rng, archetype, nameGen, biomeDistribution, seedText) {
    // Nombre único
    const name = nameGen.creatureName();

    // Determinar bioma principal de esta criatura
    const availableBiomes = archetype.biomes.filter(b => biomeDistribution[b]);
    const homeBiome = availableBiomes.length > 0 ? rng.pick(availableBiomes) : rng.pick(archetype.biomes);

    // Modificar stats según el bioma
    const stats = { ...archetype.baseStats };
    _modifyStatsByBiome(stats, homeBiome, rng);

    // Determinar rareza con peso ponderado
    const rarity = _pickWeightedRarity(rng);

    // Ajustar stats según rareza (más raro = más fuerte)
    const rarityBonus = RARITIES.findIndex(r => r.name === rarity.name) * 0.1;
    for (const key in stats) {
        stats[key] = Math.min(10, Math.round(stats[key] + rng.range(-1, 1) + rarityBonus * 2));
        stats[key] = Math.max(1, stats[key]);
    }

    // Tamaño basado en stats
    const sizeIndex = Math.min(SIZES.length - 1, Math.floor((stats.danger + stats.resistance) / 3.5));
    const size = SIZES[sizeIndex];

    // Dieta
    const diet = rng.pick(DIETS);

    // Descripción narrativa
    const description = _generateDescription(name, archetype, homeBiome, stats, seedText, rng);

    // Atributos visuales para SVG morphing
    const visualTraits = _generateVisualTraits(rng, archetype.bodyType, stats);

    return {
        name,
        archetype: archetype.base,
        origin: archetype.origin,
        bodyType: archetype.bodyType,
        bodyDescription: BODY_DESCRIPTIONS[archetype.bodyType] || 'forma indescriptible',
        homeBiome,
        traits: archetype.traits,
        stats,
        rarity,
        size,
        diet,
        description,
        visualTraits
    };
}

/**
 * Modifica stats según las condiciones del bioma
 * @private
 */
function _modifyStatsByBiome(stats, biome, rng) {
    switch (biome) {
        case 'VOLCANO': case 'SNOW_PEAK':
            stats.resistance += 2;
            stats.danger += 1;
            break;
        case 'JUNGLE': case 'FOREST':
            stats.agility += 1;
            stats.magic += 1;
            break;
        case 'OCEAN_DEEP':
            stats.resistance += 2;
            stats.intelligence += 1;
            break;
        case 'DESERT':
            stats.resistance += 1;
            stats.agility -= 1;
            break;
        case 'TUNDRA': case 'TAIGA':
            stats.resistance += 1;
            stats.danger += 1;
            break;
        case 'GRASSLAND': case 'SAVANNA':
            stats.agility += 2;
            break;
        case 'MOUNTAIN':
            stats.resistance += 1;
            stats.danger += 1;
            break;
    }
}

/**
 * Selecciona rareza con peso ponderado
 * @private
 */
function _pickWeightedRarity(rng) {
    const totalWeight = RARITIES.reduce((sum, r) => sum + r.weight, 0);
    let roll = rng.next() * totalWeight;
    
    for (const rarity of RARITIES) {
        roll -= rarity.weight;
        if (roll <= 0) return rarity;
    }
    return RARITIES[0];
}

/**
 * Genera una descripción narrativa para la criatura
 * @private
 */
function _generateDescription(name, archetype, biome, stats, seedText, rng) {
    const biomeNames = {
        OCEAN_DEEP: 'los abismos oceánicos', OCEAN_SHALLOW: 'las costas cristalinas',
        BEACH: 'las playas doradas', SWAMP: 'los pantanos brumosos',
        JUNGLE: 'la selva de los susurros', FOREST: 'los bosques ancestrales',
        GRASSLAND: 'las praderas eternas', SAVANNA: 'la sabana crepuscular',
        DESERT: 'el desierto de ceniza', TUNDRA: 'la tundra silenciosa',
        MOUNTAIN: 'las montañas del trueno', SNOW_PEAK: 'los picos nevados',
        VOLCANO: 'las tierras del fuego', CORAL_REEF: 'los arrecifes vivientes',
        TAIGA: 'la taiga de los espíritus'
    };

    const habits = [
        `Habitante de ${biomeNames[biome] || 'tierras desconocidas'} en el mundo de ${seedText}`,
        `Criatura ${archetype.origin} que mora en ${biomeNames[biome] || 'regiones remotas'}`,
        `Ser legendario avistado en ${biomeNames[biome] || 'los confines del mapa'}`
    ];

    const behaviors = [
        'se dice que su canto guía a los perdidos.',
        'las leyendas cuentan que protege un tesoro ancestral.',
        'los viajeros evitan su territorio al caer la noche.',
        'solo aparece durante las lunas dobles.',
        'los sabios lo consideran un presagio de grandes cambios.',
        'su presencia bendice la tierra con fertilidad.',
        'marca su territorio con runas antiguas.',
        'los antiguos lo veneraban como mensajero divino.',
        'caza en manada con una coordinación sobrenatural.',
        'su mirada puede petrificar a los incautos.'
    ];

    const powerDesc = stats.magic > 7 
        ? ' Emana un aura de poder arcano que distorsiona la realidad a su alrededor.' 
        : stats.danger > 7 
        ? ' Su fuerza devastadora ha sido documentada en incontables crónicas.' 
        : ' Su naturaleza enigmática fascina a eruditos y aventureros por igual.';

    return `${rng.pick(habits)}, ${rng.pick(behaviors)}${powerDesc}`;
}

/**
 * Genera atributos visuales para el SVG morphing de la criatura
 * @private
 */
function _generateVisualTraits(rng, bodyType, stats) {
    return {
        // Número de extremidades (2-8)
        limbs: bodyType === 'arachnid' ? 8 : bodyType === 'serpentine' ? 0 : rng.intRange(2, 6),
        // Tamaño de alas (0 = sin alas)
        wingSpan: bodyType.includes('winged') ? rng.range(0.6, 1.5) : 0,
        // Número de ojos (1-6)
        eyes: rng.intRange(1, stats.intelligence > 7 ? 4 : 2),
        // Número de cuernos (0-4)
        horns: stats.danger > 6 ? rng.intRange(1, 4) : rng.intRange(0, 1),
        // Cola (0 = sin cola, hasta 3 colas)
        tails: bodyType === 'quadruped' ? rng.intRange(1, 3) : rng.intRange(0, 1),
        // Tamaño relativo del cuerpo
        bodyScale: 0.5 + (stats.resistance / 10) * 1.0,
        // Color primario basado en stats
        primaryHue: Math.floor(rng.next() * 360),
        saturation: 40 + Math.floor(stats.magic * 5),
        // Patrón de piel/escamas
        pattern: rng.pick(['solid', 'striped', 'spotted', 'scaled', 'feathered', 'crystalline', 'smoky']),
        // Mandíbulas/boca
        jawSize: stats.danger > 7 ? 'large' : stats.danger > 4 ? 'medium' : 'small'
    };
}

/**
 * Asigna criaturas a regiones específicas del mapa
 * @param {Array} creatures - Lista de criaturas generadas
 * @param {string[]} biomeMap - Mapa de biomas
 * @param {number} width - Ancho del mapa
 * @param {number} height - Alto del mapa
 * @param {import('../engine/seed.js').SeededRNG} rng
 * @returns {Array} Criaturas con coordenadas asignadas
 */
export function placeCreaturesOnMap(creatures, biomeMap, width, height, rng) {
    const placedCreatures = [];
    for (const creature of creatures) {
        // Encontrar celdas del bioma de la criatura
        const validCells = [];
        for (let i = 0; i < biomeMap.length; i++) {
            if (biomeMap[i] === creature.homeBiome) {
                validCells.push(i);
            }
        }

        if (validCells.length > 0) {
            const cellIdx = rng.pick(validCells);
            creature.mapX = cellIdx % width;
            creature.mapY = Math.floor(cellIdx / width);
            placedCreatures.push(creature);
        }
    }

    return placedCreatures;
}
