/**
 * input.js - Gestión del Input de Semilla
 * 
 * Maneja la entrada del usuario, validación,
 * botón de semilla aleatoria, y la animación
 * de procesamiento al generar un mundo.
 */

/**
 * Clase para gestionar el input de semilla
 */
export class SeedInput {
    /**
     * @param {Function} onGenerate - Callback cuando se genera un mundo
     */
    constructor(onGenerate) {
        this.input = document.getElementById('seed-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.randomBtn = document.getElementById('random-btn');
        this.seedDisplay = document.getElementById('current-seed');
        this.onGenerate = onGenerate;
        
        this._bindEvents();
    }

    /**
     * Vincular eventos del formulario
     * @private
     */
    _bindEvents() {
        // Botón generar
        this.generateBtn.addEventListener('click', () => this._handleGenerate());

        // Enter en el input
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._handleGenerate();
            }
        });

        // Botón aleatorio
        this.randomBtn.addEventListener('click', () => {
            this.input.value = this._generateRandomSeed();
            this._handleGenerate();
        });

        // Efecto visual al escribir
        this.input.addEventListener('input', () => {
            this.input.classList.toggle('has-value', this.input.value.length > 0);
        });
    }

    /**
     * Procesar la generación del mundo
     * @private
     */
    _handleGenerate() {
        const seed = this.input.value.trim();
        if (!seed) {
            this.input.classList.add('shake');
            setTimeout(() => this.input.classList.remove('shake'), 500);
            return;
        }

        // Animación de procesamiento
        this._showProcessingAnimation();

        // Pequeño delay para que se vea la animación
        setTimeout(() => {
            if (this.seedDisplay) {
                this.seedDisplay.textContent = seed;
            }
            this.onGenerate(seed);
            this._hideProcessingAnimation();
        }, 600);
    }

    /**
     * Generar una semilla aleatoria legible
     * @private
     * @returns {string}
     */
    _generateRandomSeed() {
        const adjectives = ['Ancient', 'Dark', 'Crystal', 'Shadow', 'Golden', 'Silver', 'Storm', 'Fire', 'Frost', 'Iron'];
        const nouns = ['Dragon', 'Phoenix', 'Wolf', 'Tower', 'Crown', 'Blade', 'Moon', 'Star', 'Rune', 'Forge'];
        const num = Math.floor(Math.random() * 999);
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj}_${noun}_${num}`;
    }

    /**
     * Mostrar animación de procesamiento
     * @private
     */
    _showProcessingAnimation() {
        this.generateBtn.classList.add('processing');
        this.generateBtn.disabled = true;
        this.generateBtn.innerHTML = '<span class="spinner"></span> Generando...';
    }

    /**
     * Ocultar animación de procesamiento
     * @private
     */
    _hideProcessingAnimation() {
        this.generateBtn.classList.remove('processing');
        this.generateBtn.disabled = false;
        this.generateBtn.innerHTML = '⚔ Explorar';
    }
}
