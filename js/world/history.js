/**
 * history.js - Generador de Historia Procedural
 * 
 * Crea una línea temporal con eras y eventos clave ligados
 * a las civilizaciones, criaturas y geografía del mundo.
 * Cada mundo tiene entre 3-6 eras con múltiples eventos por era.
 */

/**
 * Plantillas de eventos por tipo
 * Cada plantilla usa {0}, {1}, etc. como placeholders
 */
const EVENT_TEMPLATES = {
    guerra: [
        'La Gran Guerra entre los {0} y los {1} devastó {2} durante décadas.',
        'Los {0} invadieron las tierras de los {1}, dando inicio al Conflicto de {2}.',
        'Un asedio de {0} contra la capital de los {1} en {2} cambió el equilibrio de poder.',
        'Los ejércitos de los {0} y los {1} se encontraron en la Batalla de {2}.'
    ],
    descubrimiento: [
        'Los {0} descubrieron una antigua ruina en {1}, revelando secretos de una era olvidada.',
        'Un explorador de los {0} halló un nuevo continente más allá de {1}.',
        'Los sabios de los {0} descifraron las runas de {1}, desbloqueando magia ancestral.',
        'Se descubrió un vasto yacimiento de {2} cerca de {1}, transformando la economía.'
    ],
    cataclismo: [
        'Un gran terremoto sacudió {1}, hundiendo ciudades enteras bajo tierra.',
        'Una plaga mágica conocida como la {2} diezmó a los {0}.',
        'Un volcán despertó en {1}, cubriendo de ceniza las tierras de los {0}.',
        'Una tormenta mágica sin precedentes alteró la geografía de {1}.'
    ],
    alianza: [
        'Los {0} y los {1} sellaron el Pacto de {2}, una alianza que perduraría siglos.',
        'El matrimonio entre líderes de los {0} y los {1} unió ambas naciones.',
        'Bajo la amenaza de {2}, los {0} y los {1} dejaron sus diferencias y se aliaron.',
        'El tratado de {2} estableció paz duradera entre los {0} y los {1}.'
    ],
    ascenso: [
        'Un héroe legendario de los {0}, conocido como {2}, unificó las tribus dispersas.',
        'Los {0} construyeron la gran ciudad de {1}, un monumento a su civilización.',
        'La era dorada de los {0} comenzó con el descubrimiento de {2}.',
        'Un profeta de los {0} fundó la Orden de {2} en {1}.'
    ],
    criatura: [
        'El despertar del {2} en {1} causó pánico entre los {0}.',
        'Los {0} domaron al {2}, convirtiéndolo en su montura de guerra.',
        'Una bestia conocida como {2} fue avistada por primera vez en {1}.',
        'Los cazadores de los {0} lucharon contra el temible {2} en la Cacería de {1}.'
    ]
};

/** Nombres para cataclismos y plagas */
const CATACLYSM_NAMES = [
    'Muerte Gris', 'Llanto de las Estrellas', 'Noche Eterna', 'Fuego del Abismo',
    'Tormenta del Caos', 'Ruptura del Velo', 'Despertar Oscuro', 'Aullido del Vacío',
    'Gran Marchitamiento', 'Eclipse Perpetuo', 'Marea Carmesí', 'Susurro de Cenizas'
];

/**
 * Genera la historia completa del mundo
 * @param {import('../engine/seed.js').SeededRNG} rng
 * @param {Array} cultures - Civilizaciones
 * @param {Array} creatures - Bestiario
 * @param {import('./names.js').NameGenerator} nameGen
 * @returns {Object} Historia completa con eras y eventos
 */
export function generateHistory(rng, cultures, creatures, nameGen) {
    // Número de eras (3-6)
    const eraCount = rng.intRange(3, 6);
    const eras = [];
    const allEvents = [];

    for (let i = 0; i < eraCount; i++) {
        const era = _generateEra(rng, i, eraCount, cultures, creatures, nameGen, allEvents);
        eras.push(era);
    }

    return {
        eras,
        totalEvents: allEvents.length,
        currentEra: eras[eras.length - 1].name,
        worldAge: `${eraCount * rng.intRange(500, 2000)} años desde la Creación`,
        creationMyth: _generateCreationMyth(rng, cultures, nameGen)
    };
}

/**
 * Genera una era individual
 * @private
 */
function _generateEra(rng, index, totalEras, cultures, creatures, nameGen, allEvents) {
    const eraName = nameGen.eraName();
    
    // Características de la era según su posición en la línea temporal
    let mood;
    if (index === 0) mood = 'primordial';
    else if (index === totalEras - 1) mood = 'actual';
    else mood = rng.pick(['prosperidad', 'conflicto', 'descubrimiento', 'oscuridad', 'renacimiento']);

    // Eventos por era (2-5)
    const eventCount = rng.intRange(2, 5);
    const events = [];

    for (let e = 0; e < eventCount; e++) {
        const event = _generateEvent(rng, mood, cultures, creatures, nameGen);
        events.push(event);
        allEvents.push(event);
    }

    // Descripción general de la era
    const descriptions = {
        primordial: `Los primeros pueblos emergieron y las bases del mundo fueron establecidas.`,
        prosperidad: `Una época de paz y crecimiento, donde las civilizaciones florecieron.`,
        conflicto: `Guerras y rivalidades definieron esta era turbulenta.`,
        descubrimiento: `Grandes hallazgos y avances marcaron este período de exploración.`,
        oscuridad: `Tiempos de prueba donde la supervivencia fue la mayor hazaña.`,
        renacimiento: `Tras la oscuridad, las culturas resurgieron con fuerza renovada.`,
        actual: `La era presente, donde las tensiones entre civilizaciones alcanzan nuevos puntos.`
    };

    return {
        name: eraName,
        index: index + 1,
        mood,
        description: descriptions[mood] || 'Una era de cambios inevitables.',
        events,
        duration: `${rng.intRange(200, 1500)} años`
    };
}

/**
 * Genera un evento individual
 * @private
 */
function _generateEvent(rng, mood, cultures, creatures, nameGen) {
    // Seleccionar tipo de evento según el mood de la era
    const typeWeights = {
        primordial: { ascenso: 4, descubrimiento: 3, criatura: 3 },
        prosperidad: { alianza: 4, descubrimiento: 3, ascenso: 3 },
        conflicto: { guerra: 5, criatura: 2, cataclismo: 3 },
        descubrimiento: { descubrimiento: 5, ascenso: 2, alianza: 3 },
        oscuridad: { cataclismo: 4, guerra: 3, criatura: 3 },
        renacimiento: { alianza: 4, ascenso: 3, descubrimiento: 3 },
        actual: { guerra: 2, alianza: 2, descubrimiento: 2, criatura: 2, ascenso: 2 }
    };

    const weights = typeWeights[mood] || typeWeights.actual;
    const eventType = _pickWeightedType(rng, weights);

    // Seleccionar participantes
    const cultureA = cultures.length > 0 ? rng.pick(cultures) : { name: 'los Antiguos' };
    const cultureB = cultures.length > 1 ? rng.pick(cultures.filter(c => c !== cultureA)) : { name: 'los Desconocidos' };
    const place = nameGen.placeName();
    const creature = creatures.length > 0 ? rng.pick(creatures).name : 'una bestia legendaria';
    const cataclysmName = rng.pick(CATACLYSM_NAMES);

    // Seleccionar plantilla
    const templates = EVENT_TEMPLATES[eventType];
    const template = rng.pick(templates);

    // Llenar plantilla
    let fillers;
    switch (eventType) {
        case 'guerra': case 'alianza':
            fillers = [cultureA.name, cultureB.name, place];
            break;
        case 'descubrimiento': case 'ascenso':
            fillers = [cultureA.name, place, nameGen.resourceName()];
            break;
        case 'cataclismo':
            fillers = [cultureA.name, place, cataclysmName];
            break;
        case 'criatura':
            fillers = [cultureA.name, place, creature];
            break;
        default:
            fillers = [cultureA.name, place, 'algo misterioso'];
    }

    const description = template.replace(/\{(\d+)\}/g, (_, i) => fillers[i] || '???');

    return {
        type: eventType,
        description,
        participants: [cultureA.name, cultureB?.name].filter(Boolean),
        location: place,
        significance: rng.pick(['menor', 'notable', 'importante', 'trascendental'])
    };
}

/**
 * Selecciona tipo ponderado
 * @private
 */
function _pickWeightedType(rng, weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = rng.next() * total;

    for (const [type, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return type;
    }
    return entries[0][0];
}

/**
 * Genera el mito de creación del mundo
 * @private
 */
function _generateCreationMyth(rng, cultures, nameGen) {
    const creators = [
        `un titán primordial llamado ${nameGen.deityName()}`,
        `dos deidades gemelas, ${nameGen.deityName()} y ${nameGen.deityName()}`,
        `el canto cósmico de ${nameGen.deityName()}`,
        `la explosión de un huevo cósmico custodiado por ${nameGen.deityName()}`,
        `el sueño eterno de ${nameGen.deityName()}, la Entidad Durmiente`,
        `la batalla entre ${nameGen.deityName()} y ${nameGen.deityName()}`
    ];

    const methods = [
        'moldeó la tierra con sus manos y lloró los océanos.',
        'tejió la realidad desde los hilos del vacío.',
        'esculpió las montañas y sopló vida en las llanuras.',
        'fragmentó su propia esencia para dar forma al mundo.',
        'forjó el mundo como un herrero forja una espada.',
        'cantó las melodías que dieron forma a cada río y cada monte.'
    ];

    return `Según las leyendas, ${rng.pick(creators)} ${rng.pick(methods)}`;
}
