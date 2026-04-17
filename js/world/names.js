/**
 * names.js - Generador de Toponimia Fantástica
 * 
 * Crea nombres procedurales para regiones, criaturas, civilizaciones,
 * dioses y lugares, combinando prefijos, raíces y sufijos
 * de múltiples tradiciones lingüísticas fantásticas.
 */

// === POOLS LINGÜÍSTICOS ORGANIZADOS POR ESTILO ===

/** Prefijos inspirados en diversas tradiciones */
const PREFIXES = {
    elfico: ['Ael', 'Cel', 'Eil', 'Gal', 'Lor', 'Mel', 'Nal', 'Sil', 'Thal', 'Vel', 'Ith', 'Fael'],
    nordico: ['Brun', 'Drak', 'Fen', 'Grim', 'Hjal', 'Krag', 'Mjol', 'Nid', 'Rag', 'Skar', 'Tor', 'Vald'],
    nahuatl: ['Chal', 'Huit', 'Itz', 'Mix', 'Nez', 'Quetz', 'Tepe', 'Tlal', 'Xochi', 'Yao', 'Zac', 'Cip'],
    arabe: ['Az', 'Bah', 'Dar', 'Faz', 'Gha', 'Haz', 'Jas', 'Kha', 'Maz', 'Nah', 'Sha', 'Zul'],
    japones: ['Aka', 'Hika', 'Izu', 'Kage', 'Mizu', 'Nami', 'Ryu', 'Shin', 'Tsu', 'Yama', 'Kuro', 'Sora'],
    eslavo: ['Bel', 'Cher', 'Drev', 'Grom', 'Kras', 'Mogh', 'Nov', 'Pol', 'Rad', 'Svat', 'Vol', 'Zhar'],
    africano: ['Aba', 'Chi', 'Dun', 'Eku', 'Ima', 'Kwa', 'Mba', 'Ngo', 'Oba', 'San', 'Zan', 'Ugu'],
    chino: ['Chang', 'Feng', 'Huan', 'Jin', 'Long', 'Ming', 'Shan', 'Tian', 'Xian', 'Yu', 'Zhen', 'Bai']
};

/** Raíces centrales */
const ROOTS = {
    tierra: ['gor', 'mon', 'ter', 'rok', 'val', 'dur', 'bor', 'pek', 'sar', 'dal'],
    agua: ['mar', 'riv', 'lak', 'aqu', 'nav', 'ond', 'flu', 'tid', 'cor', 'pel'],
    fuego: ['pyr', 'ign', 'vol', 'braz', 'ard', 'cal', 'fla', 'sol', 'lav', 'cin'],
    aire: ['ven', 'aer', 'cel', 'nub', 'tor', 'bri', 'zef', 'ali', 'eth', 'cir'],
    vida: ['vit', 'bio', 'flo', 'syl', 'ger', 'sem', 'rad', 'lum', 'vig', 'sav'],
    muerte: ['mor', 'nec', 'som', 'vac', 'fin', 'ten', 'nox', 'umb', 'cen', 'cad']
};

/** Sufijos para nombres de lugares */
const PLACE_SUFFIXES = [
    'heim', 'gard', 'thal', 'mere', 'vale', 'hold', 'fell', 'reach',
    'mund', 'rath', 'gor', 'peak', 'deep', 'watch', 'haven', 'gate',
    'moor', 'glen', 'crest', 'forge', 'spire', 'ash', 'bane', 'dawn',
    'ark', 'rim', 'root', 'veil', 'ward', 'keep', 'stead', 'mark'
];

/** Sufijos para nombres de criaturas */
const CREATURE_SUFFIXES = [
    'rax', 'gon', 'wyr', 'phen', 'thos', 'lock', 'mar', 'ven',
    'dris', 'gal', 'nix', 'thor', 'kin', 'shade', 'maw', 'fang',
    'wing', 'claw', 'horn', 'tail', 'eye', 'spine', 'scale', 'beak',
    'taur', 'pent', 'drake', 'bolt', 'fyre', 'storm', 'frost', 'bloom'
];

/** Sufijos para civilizaciones */
const CULTURE_SUFFIXES = [
    'ani', 'ari', 'eni', 'iri', 'oni', 'uri', 'ade', 'ite',
    'dar', 'kor', 'zan', 'mir', 'val', 'wen', 'thi', 'lor'
];

/** Sufijos para dioses/entidades */
const DEITY_SUFFIXES = [
    'us', 'is', 'os', 'ra', 'an', 'el', 'oth', 'iel',
    'atl', 'mun', 'zar', 'nir', 'pha', 'kai', 'rin', 'vos'
];

/**
 * Clase principal del generador de nombres
 */
export class NameGenerator {
    /**
     * @param {import('../engine/seed.js').SeededRNG} rng
     */
    constructor(rng) {
        this.rng = rng;
        this.usedNames = new Set();
    }

    /**
     * Selecciona un estilo lingüístico aleatorio
     * @returns {string} Nombre del estilo
     */
    _randomStyle() {
        const styles = Object.keys(PREFIXES);
        return this.rng.pick(styles);
    }

    /**
     * Selecciona una raíz elemental aleatoria
     * @returns {string}
     */
    _randomRoot() {
        const elements = Object.keys(ROOTS);
        const element = this.rng.pick(elements);
        return this.rng.pick(ROOTS[element]);
    }

    /**
     * Genera un nombre único, reintentando si hay colisiones
     * @param {Function} generator - Función generadora de nombres
     * @param {number} maxAttempts - Intentos máximos
     * @returns {string}
     */
    _unique(generator, maxAttempts = 20) {
        for (let i = 0; i < maxAttempts; i++) {
            const name = generator();
            if (!this.usedNames.has(name)) {
                this.usedNames.add(name);
                return name;
            }
        }
        // Si no se encuentra uno único, generar con hash extra
        const fallback = generator() + "'" + this.rng.pick(['ar', 'en', 'ir', 'on', 'un']);
        this.usedNames.add(fallback);
        return fallback;
    }

    /**
     * Capitalizar primera letra
     * @param {string} str
     * @returns {string}
     */
    _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Genera un nombre de región/lugar
     * @param {string} [biomeType] - Tipo de bioma para influenciar el estilo
     * @returns {string}
     */
    placeName(biomeType) {
        return this._unique(() => {
            const style = this._randomStyle();
            const prefix = this.rng.pick(PREFIXES[style]);
            
            // Opcionalmente incluir raíz según probabilidad
            let root = '';
            if (this.rng.next() > 0.4) {
                root = this._randomRoot();
            }

            const suffix = this.rng.pick(PLACE_SUFFIXES);
            const name = prefix + root + suffix;
            return this._capitalize(name);
        });
    }

    /**
     * Genera un nombre de criatura
     * @returns {string}
     */
    creatureName() {
        return this._unique(() => {
            const style = this._randomStyle();
            const prefix = this.rng.pick(PREFIXES[style]);
            const suffix = this.rng.pick(CREATURE_SUFFIXES);
            
            // A veces agregar un título descriptivo
            if (this.rng.next() > 0.7) {
                const titles = ['de las Sombras', 'del Alba', 'Ancestral', 'Eterno',
                    'de Ceniza', 'de Cristal', 'del Viento', 'Primordial',
                    'Carmesí', 'del Abismo', 'Lunar', 'Solar'];
                return this._capitalize(prefix + suffix) + ' ' + this.rng.pick(titles);
            }
            
            return this._capitalize(prefix + suffix);
        });
    }

    /**
     * Genera un nombre de civilización/raza
     * @returns {string}
     */
    cultureName() {
        return this._unique(() => {
            const style = this._randomStyle();
            const prefix = this.rng.pick(PREFIXES[style]);
            const suffix = this.rng.pick(CULTURE_SUFFIXES);
            return this._capitalize(prefix + suffix);
        });
    }

    /**
     * Genera un nombre de deidad
     * @returns {string}
     */
    deityName() {
        return this._unique(() => {
            const style = this._randomStyle();
            const prefix = this.rng.pick(PREFIXES[style]);
            const root = this._randomRoot();
            const suffix = this.rng.pick(DEITY_SUFFIXES);
            return this._capitalize(prefix + root + suffix);
        });
    }

    /**
     * Genera un nombre de recurso mágico
     * @returns {string}
     */
    resourceName() {
        const adjectives = ['Etéreo', 'Arcano', 'Primordial', 'Radiante', 'Sombrío',
            'Cristalino', 'Fundido', 'Susurrante', 'Estelar', 'Profundo'];
        const nouns = ['Ónix', 'Ámbar', 'Coral', 'Cuarzo', 'Jade', 'Ópalo',
            'Rúnite', 'Aether', 'Mytril', 'Éldrium', 'Obsidiana', 'Adamantio'];
        return this.rng.pick(adjectives) + ' ' + this.rng.pick(nouns);
    }

    /**
     * Genera un nombre de era/época histórica
     * @returns {string}
     */
    eraName() {
        const types = ['Era', 'Época', 'Edad', 'Ciclo', 'Amanecer', 'Crepúsculo'];
        const qualities = ['del Fuego', 'de las Sombras', 'del Despertar', 'del Silencio',
            'de los Dioses', 'del Hierro', 'de las Estrellas', 'del Caos',
            'de la Unión', 'del Exilio', 'de la Floración', 'del Trueno'];
        return this.rng.pick(types) + ' ' + this.rng.pick(qualities);
    }
}
