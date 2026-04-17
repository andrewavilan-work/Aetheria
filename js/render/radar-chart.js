/**
 * radar-chart.js - Gráfico de Radar (Spider Chart)
 * 
 * Genera gráficos de radar animados para los atributos
 * de las criaturas del bestiario. 5 ejes:
 * Peligro, Magia, Agilidad, Inteligencia, Resistencia.
 */

/**
 * Clase para generar gráficos de radar en Canvas
 */
export class RadarChart {
    /**
     * @param {HTMLCanvasElement} canvas 
     * @param {Object} options - Opciones de configuración
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Configuración por defecto
        this.labels = options.labels || ['Peligro', 'Magia', 'Agilidad', 'Inteligencia', 'Resistencia'];
        this.maxValue = options.maxValue || 10;
        this.levels = options.levels || 5;
        this.padding = options.padding || 30;
        this.fontFamily = options.fontFamily || "'Quicksand', sans-serif";

        // Colores
        this.gridColor = options.gridColor || 'rgba(200, 180, 140, 0.2)';
        this.labelColor = options.labelColor || 'rgba(200, 180, 140, 0.8)';
        this.axisColor = options.axisColor || 'rgba(200, 180, 140, 0.3)';

        // Estado de animación
        this.animationProgress = 0;
        this.animationDuration = 800; // ms
        this.animating = false;
    }

    /**
     * Dibujar el gráfico con los datos de una criatura
     * @param {Object} stats - { danger, magic, agility, intelligence, resistance }
     * @param {string} color - Color HSL del relleno
     * @param {boolean} animate - Si debe animar la aparición
     */
    draw(stats, color = 'hsla(40, 70%, 50%, 0.4)', animate = true) {
        const values = [
            stats.danger || 0,
            stats.magic || 0,
            stats.agility || 0,
            stats.intelligence || 0,
            stats.resistance || 0
        ];

        this.currentValues = values;
        this.currentColor = color;

        if (animate) {
            this.animationProgress = 0;
            this.animating = true;
            this._animateFrame(performance.now(), values, color);
        } else {
            this.animationProgress = 1;
            this._render(values, color);
        }
    }

    /**
     * Frame de animación
     * @private
     */
    _animateFrame(startTime, values, color) {
        const now = performance.now();
        const elapsed = now - startTime;
        this.animationProgress = Math.min(1, elapsed / this.animationDuration);
        
        // Easing: ease-out cubic
        const eased = 1 - Math.pow(1 - this.animationProgress, 3);
        
        // Interpolar valores
        const animatedValues = values.map(v => v * eased);
        
        this._render(animatedValues, color);
        
        if (this.animationProgress < 1) {
            requestAnimationFrame(() => this._animateFrame(startTime, values, color));
        } else {
            this.animating = false;
        }
    }

    /**
     * Renderizado principal del gráfico
     * @private
     */
    _render(values, color) {
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(cx, cy) - this.padding;
        const numAxes = this.labels.length;
        const angleStep = (Math.PI * 2) / numAxes;
        const startAngle = -Math.PI / 2; // Empezar desde arriba

        // Limpiar
        ctx.clearRect(0, 0, w, h);

        // Dibujar niveles de la grilla (pentágonos concéntricos)
        for (let level = 1; level <= this.levels; level++) {
            const levelRadius = (radius / this.levels) * level;
            ctx.beginPath();
            for (let i = 0; i < numAxes; i++) {
                const angle = startAngle + i * angleStep;
                const x = cx + Math.cos(angle) * levelRadius;
                const y = cy + Math.sin(angle) * levelRadius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = this.gridColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Dibujar ejes
        for (let i = 0; i < numAxes; i++) {
            const angle = startAngle + i * angleStep;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.strokeStyle = this.axisColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Etiquetas
            const labelRadius = radius + 16;
            const lx = cx + Math.cos(angle) * labelRadius;
            const ly = cy + Math.sin(angle) * labelRadius;
            
            ctx.font = `11px ${this.fontFamily}`;
            ctx.fillStyle = this.labelColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.labels[i], lx, ly);
        }

        // Dibujar datos (polígono de valores)
        ctx.beginPath();
        for (let i = 0; i < numAxes; i++) {
            const angle = startAngle + i * angleStep;
            const valueRadius = (values[i] / this.maxValue) * radius;
            const x = cx + Math.cos(angle) * valueRadius;
            const y = cy + Math.sin(angle) * valueRadius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Relleno con transparencia
        ctx.fillStyle = color;
        ctx.fill();

        // Borde con resplandor
        ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.8)');
        ctx.lineWidth = 2;
        ctx.stroke();

        // Puntos en cada vértice
        for (let i = 0; i < numAxes; i++) {
            const angle = startAngle + i * angleStep;
            const valueRadius = (values[i] / this.maxValue) * radius;
            const x = cx + Math.cos(angle) * valueRadius;
            const y = cy + Math.sin(angle) * valueRadius;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color.replace(/[\d.]+\)$/, '0.9)');
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Valores numéricos junto a cada punto
        ctx.font = `bold 10px ${this.fontFamily}`;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        for (let i = 0; i < numAxes; i++) {
            const angle = startAngle + i * angleStep;
            const valueRadius = (values[i] / this.maxValue) * radius;
            const x = cx + Math.cos(angle) * (valueRadius + 10);
            const y = cy + Math.sin(angle) * (valueRadius + 10);
            ctx.fillText(Math.round(values[i]).toString(), x, y);
        }
    }
}
