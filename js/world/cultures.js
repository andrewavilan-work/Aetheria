/**
 * cultures.js - Sistema de Civilizaciones y Razas
 * 
 * Genera razas procedurales, formas de gobierno, religiones,
 * y relaciones diplomáticas adaptadas al mundo generado.
 * Cada civilización se adapta al bioma donde habita.
 */

import { BIOME_DEFS } from './biomes.js';

// === ARQUETIPOS DE RAZAS BASE ===

const RACE_ARCHETYPES = [
    { type: 'humanos', description: 'Mortales adaptables que dominan cualquier terreno.',
      preferredBiomes: ['GRASSLAND', 'FOREST', 'BEACH', 'SAVANNA'],
      traits: ['adaptabilidad', 'ambición', 'creatividad'], techLevel: 'media' },
    { type: 'elfos', description: 'Seres inmortales en armonía con la naturaleza.',
      preferredBiomes: ['FOREST', 'JUNGLE', 'TAIGA'],
      traits: ['longevidad', 'afinidad mágica', 'orgullo'], techLevel: 'alta' },
    { type: 'enanos', description: 'Maestros artesanos de las profundidades.',
      preferredBiomes: ['MOUNTAIN', 'VOLCANO', 'TUNDRA'],
      traits: ['resistencia', 'artesanía', 'terquedad'], techLevel: 'muy alta' },
    { type: 'nómadas', description: 'Pueblos errantes que siguen las estrellas.',
      preferredBiomes: ['DESERT', 'SAVANNA', 'GRASSLAND', 'TUNDRA'],
      traits: ['movilidad', 'comercio', 'astronomía'], techLevel: 'media' },
    { type: 'anfibios', description: 'Civilización que prospera entre tierra y agua.',
      preferredBiomes: ['SWAMP', 'CORAL_REEF', 'OCEAN_SHALLOW', 'BEACH'],
      traits: ['anfibio', 'magia acuática', 'memoria ancestral'], techLevel: 'media' },
    { type: 'gigantes', description: 'Titanes antiguos que moldean la tierra.',
      preferredBiomes: ['MOUNTAIN', 'SNOW_PEAK', 'TUNDRA'],
      traits: ['fuerza colosal', 'resistencia', 'sabiduría antigua'], techLevel: 'baja' },
    { type: 'feéricos', description: 'Seres del plano mágico, caprichosos y poderosos.',
      preferredBiomes: ['FOREST', 'JUNGLE', 'GRASSLAND', 'SWAMP'],
      traits: ['magia innata', 'ilusiones', 'capricho'], techLevel: 'mágica' },
    { type: 'reptilianos', description: 'Descendientes de dragones, sangre fría y mente aguda.',
      preferredBiomes: ['DESERT', 'VOLCANO', 'JUNGLE', 'SWAMP'],
      traits: ['sangre fría', 'escamas', 'visión térmica'], techLevel: 'media' },
    { type: 'aviar', description: 'Pueblos alados que dominan los cielos.',
      preferredBiomes: ['MOUNTAIN', 'GRASSLAND', 'SNOW_PEAK'],
      traits: ['vuelo', 'visión aguda', 'libertad'], techLevel: 'media' },
    { type: 'subterráneos', description: 'Civilizaciones de las profundidades, adaptadas a la oscuridad.',
      preferredBiomes: ['MOUNTAIN', 'VOLCANO', 'TUNDRA'],
      traits: ['visión nocturna', 'minería', 'secretismo'], techLevel: 'alta' },
    { type: 'hombres bestia', description: 'Guerreros feroces mitad hombre mitad lobo.',
      preferredBiomes: ['FOREST', 'TAIGA', 'SNOW'],
      traits: ['ferocidad', 'caza', 'sentidos agudos'], techLevel: 'baja' },
    { type: 'elementales', description: 'Seres compuestos de energía pura y materia elemental.',
      preferredBiomes: ['VOLCANO', 'SNOW_PEAK', 'DESERT', 'OCEAN'],
      traits: ['inmortalidad', 'control elemental', 'ausencia de fatiga'], techLevel: 'mágica' },
    { type: 'celestiales', description: 'Ángeles caídos y seres de pura luz y justicia.',
      preferredBiomes: ['MOUNTAIN', 'SNOW_PEAK', 'GRASSLAND'],
      traits: ['sanación', 'resplandor', 'búsqueda de la verdad'], techLevel: 'muy alta' },
    { type: 'no-muertos', description: 'Civilizaciones necróticas gobernadas por reyes exánimes.',
      preferredBiomes: ['SWAMP', 'TUNDRA', 'DESERT'],
      traits: ['inmunidad al dolor', 'esclavitud eterna', 'magia oscura'], techLevel: 'media' },
    { type: 'orcos', description: 'Tribus nómadas belicosas de brutal eficiencia táctica.',
      preferredBiomes: ['SAVANNA', 'DESERT', 'VOLCANO'],
      traits: ['furor de guerra', 'supervivencia extrema', 'culto a la fuerza'], techLevel: 'baja' }
];

/** Formas de gobierno posibles */
const GOVERNMENTS = [
    { type: 'Monarquía', desc: 'gobernada por un rey o reina hereditario' },
    { type: 'Teocracia', desc: 'regida por sacerdotes y profetas' },
    { type: 'Consejo de Ancianos', desc: 'dirigida por los más sabios' },
    { type: 'Meritocracia', desc: 'donde el más capaz lidera' },
    { type: 'República Mágica', desc: 'gobernada por un consejo de magos' },
    { type: 'Confederación Tribal', desc: 'unión de clanes independientes' },
    { type: 'Dictadura Militar', desc: 'bajo el puño de un general supremo' },
    { type: 'Anarquía Organizada', desc: 'sin líder formal, consenso colectivo' },
    { type: 'Oligarquía Mercantil', desc: 'controlada por las familias más ricas' },
    { type: 'Matriarcado', desc: 'guiada por la sabiduría de las madres' }
];

/** Dominios de deidades */
const DEITY_DOMAINS = [
    'el fuego y la forja', 'las tormentas y el cielo', 'la tierra y la cosecha',
    'el mar y las profundidades', 'la muerte y el renacimiento', 'la guerra y el honor',
    'la sabiduría y las estrellas', 'la naturaleza y los animales', 'el caos y el cambio',
    'el amor y la fertilidad', 'las sombras y los secretos', 'el tiempo y el destino',
    'la luna y los sueños', 'el sol y la justicia', 'la música y la alegría'
];

/** Relaciones diplomáticas posibles */
const RELATIONSHIPS = [
    { type: 'Alianza Eterna', level: 3, desc: 'unidos por un pacto sagrado' },
    { type: 'Comercio Activo', level: 2, desc: 'rutas comerciales prósperas' },
    { type: 'Paz Frágil', level: 1, desc: 'coexistencia tensa pero estable' },
    { type: 'Neutralidad', level: 0, desc: 'indiferencia mutua' },
    { type: 'Rivalidad', level: -1, desc: 'competencia constante por recursos' },
    { type: 'Conflicto Latente', level: -2, desc: 'tensiones al borde de la guerra' },
    { type: 'Guerra Abierta', level: -3, desc: 'conflicto armado sin tregua' }
];

/**
 * Genera todas las civilizaciones del mundo
 * @param {import('../engine/seed.js').SeededRNG} rng 
 * @param {Object} biomeDistribution - Distribución de biomas
 * @param {import('./names.js').NameGenerator} nameGen
 * @param {Array} creatures - Bestiario generado
 * @returns {Array} Civilizaciones generadas
 */
export function generateCultures(rng, biomeDistribution, nameGen, creatures) {
    const cultures = [];
    
    // Determinar cuántas civilizaciones (3-7 según tamaño de tierra)
    const landBiomes = Object.entries(biomeDistribution)
        .filter(([id]) => !id.startsWith('OCEAN') && id !== 'CORAL_REEF')
        .reduce((sum, [, data]) => sum + data.count, 0);
    
    const totalCells = Object.values(biomeDistribution).reduce((sum, data) => sum + data.count, 0);
    const landRatio = landBiomes / totalCells;
    const cultureCount = Math.max(3, Math.min(7, Math.floor(landRatio * 10)));

    // Seleccionar razas apropiadas para los biomas existentes
    const availableArchetypes = RACE_ARCHETYPES.filter(r =>
        r.preferredBiomes.some(b => biomeDistribution[b] && biomeDistribution[b].count > 0)
    );

    const shuffledRaces = rng.shuffle([...availableArchetypes]);
    const selectedRaces = shuffledRaces.slice(0, cultureCount);

    for (const raceArchetype of selectedRaces) {
        const culture = _generateCulture(rng, raceArchetype, biomeDistribution, nameGen, creatures);
        cultures.push(culture);
    }

    // Generar relaciones diplomáticas entre civilizaciones
    _generateDiplomacy(rng, cultures);

    return cultures;
}

/**
 * Genera una civilización individual
 * @private
 */
function _generateCulture(rng, archetype, biomeDistribution, nameGen, creatures) {
    const name = nameGen.cultureName();
    const government = rng.pick(GOVERNMENTS);
    
    // Determinar bioma principal de asentamiento
    const availableBiomes = archetype.preferredBiomes.filter(b => 
        biomeDistribution[b] && biomeDistribution[b].count > 0
    );
    const homeBiome = availableBiomes.length > 0 ? rng.pick(availableBiomes) : rng.pick(archetype.preferredBiomes);

    // Generar religión
    const deityName = nameGen.deityName();
    const deityDomain = rng.pick(DEITY_DOMAINS);
    
    // Criatura sagrada (de las del mundo)
    const biomCreatures = creatures.filter(c => c.homeBiome === homeBiome);
    const sacredCreature = biomCreatures.length > 0 ? rng.pick(biomCreatures).name : null;

    // Población (relativa)
    const populationScale = rng.intRange(1, 10);
    const populationTiers = ['Pequeña aldea', 'Asentamiento', 'Villa', 'Ciudad menor', 
        'Ciudad', 'Gran ciudad', 'Metrópolis', 'Capital regional', 'Gran capital', 'Imperio'];

    // Rasgos culturales únicos
    const culturalTraits = _generateCulturalTraits(rng, archetype, homeBiome);

    // Biome data
    const biomeDef = BIOME_DEFS[homeBiome];

    return {
        name,
        raceType: archetype.type,
        description: archetype.description,
        homeBiome,
        biomeInfo: biomeDef ? biomeDef.name : homeBiome,
        government: government.type,
        governmentDesc: government.desc,
        traits: archetype.traits,
        techLevel: archetype.techLevel,
        religion: {
            deityName,
            domain: deityDomain,
            sacredCreature,
            description: `Los ${name} veneran a ${deityName}, deidad de ${deityDomain}.${sacredCreature ? ` Consideran al ${sacredCreature} como su animal sagrado.` : ''}`
        },
        population: populationTiers[populationScale - 1],
        populationScale,
        culturalTraits,
        relationships: {} // Se llenan en _generateDiplomacy
    };
}

/**
 * Genera rasgos culturales únicos
 * @private
 */
function _generateCulturalTraits(rng, archetype, biome) {
    const arts = ['música ritual', 'pintura rupestre', 'escultura en cristal', 'danza ceremonial',
        'poesía épica', 'teatro de sombras', 'caligrafía rúnica', 'tejido mágico',
        'cerámica encantada', 'tallado en hueso'];
    
    const customs = ['celebran el solsticio con grandes festines', 'marcan el paso a la adultez con un ritual de fuego',
        'entierran a sus muertos con semillas', 'nombran a sus hijos según las estrellas del nacimiento',
        'resuelven disputas mediante duelos musicales', 'comercian solo durante la luna llena',
        'consideran sagrado el silencio al amanecer', 'tatúan runas protectoras en la piel',
        'construyen sus hogares siguiendo las líneas ley', 'ayunan tres días antes de cada batalla'];

    const values = ['honor', 'libertad', 'conocimiento', 'naturaleza', 'fuerza', 
        'comunidad', 'tradición', 'innovación', 'espiritualidad', 'justicia'];

    return {
        art: rng.pick(arts),
        custom: rng.pick(customs),
        primaryValue: rng.pick(values),
        secondaryValue: rng.pick(values.filter(v => v !== values[0])),
        specialAbility: `Los ${archetype.type} poseen ${rng.pick(archetype.traits)} como rasgo distintivo.`
    };
}

/**
 * Genera relaciones diplomáticas entre todas las civilizaciones
 * @private
 */
function _generateDiplomacy(rng, cultures) {
    for (let i = 0; i < cultures.length; i++) {
        for (let j = i + 1; j < cultures.length; j++) {
            const rel = rng.pick(RELATIONSHIPS);
            
            // Las civilizaciones del mismo bioma tienden a conflicto (recursos)
            let modRel = rel;
            if (cultures[i].homeBiome === cultures[j].homeBiome && rel.level > 0) {
                modRel = rng.pick(RELATIONSHIPS.filter(r => r.level <= 0));
            }
            
            cultures[i].relationships[cultures[j].name] = {
                type: modRel.type,
                level: modRel.level,
                description: modRel.desc,
                with: cultures[j].name
            };
            cultures[j].relationships[cultures[i].name] = {
                type: modRel.type,
                level: modRel.level,
                description: modRel.desc,
                with: cultures[i].name
            };
        }
    }
}
