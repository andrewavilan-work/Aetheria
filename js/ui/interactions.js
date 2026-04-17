/**
 * interactions.js - Interacciones del Mapa
 * 
 * Gestiona hover, clics, zoom con scroll,
 * paneo con arrastre, y soporte táctil para móviles.
 */

/**
 * Clase para gestionar todas las interacciones del mapa
 */
export class MapInteractions {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas del mapa
     * @param {import('../render/map-renderer.js').MapRenderer} renderer
     * @param {Function} onRegionHover - Callback al hacer hover en una región
     * @param {Function} onRegionClick - Callback al hacer clic en una región
     */
    constructor(canvas, renderer, onRegionHover, onRegionClick) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.onRegionHover = onRegionHover;
        this.onRegionClick = onRegionClick;

        // Estado del arrastre
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragThreshold = 5;
        this.dragDistance = 0;

        // Estado táctil
        this.touchStartDist = 0;
        this.touchStartScale = 1;

        // Throttle del hover
        this.hoverThrottleMs = 50;
        this.lastHoverTime = 0;

        // Loop de renderizado
        this.renderLoop = null;
        this.needsRender = true;

        this._bindEvents();
        this._startRenderLoop();
    }

    /**
     * Vincular todos los eventos de interacción
     * @private
     */
    _bindEvents() {
        // --- MOUSE ---
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
        this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

        // --- TOUCH ---
        this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e));

        // --- RESIZE ---
        window.addEventListener('resize', () => {
            this.renderer.resize();
            this.needsRender = true;
        });
    }

    /**
     * Iniciar el loop de renderizado con requestAnimationFrame
     * @private
     */
    _startRenderLoop() {
        const loop = () => {
            if (this.needsRender) {
                this.renderer.render();
                this.needsRender = false;
            }
            this.renderLoop = requestAnimationFrame(loop);
        };
        loop();
    }

    /**
     * Detener el loop de renderizado
     */
    stopRenderLoop() {
        if (this.renderLoop) {
            cancelAnimationFrame(this.renderLoop);
        }
    }

    /**
     * Solicitar un re-render
     */
    requestRender() {
        this.needsRender = true;
    }

    // === EVENTOS DE MOUSE ===

    /** @private */
    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging) {
            const dx = x - this.lastMouseX;
            const dy = y - this.lastMouseY;
            this.dragDistance += Math.abs(dx) + Math.abs(dy);
            this.renderer.pan(dx, dy);
            this.lastMouseX = x;
            this.lastMouseY = y;
            this.needsRender = true;
            return;
        }

        // Throttle hover
        const now = performance.now();
        if (now - this.lastHoverTime < this.hoverThrottleMs) return;
        this.lastHoverTime = now;

        // Obtener coordenadas del mapa
        const mapCoords = this.renderer.canvasToMap(x, y);
        if (mapCoords) {
            this.renderer.hoverX = mapCoords.x;
            this.renderer.hoverY = mapCoords.y;
            this.needsRender = true;

            if (this.onRegionHover) {
                this.onRegionHover(mapCoords.x, mapCoords.y);
            }
        } else {
            this.renderer.hoverX = -1;
            this.renderer.hoverY = -1;
            this.needsRender = true;
        }
    }

    /** @private */
    _onMouseDown(e) {
        this.isDragging = true;
        this.dragDistance = 0;
        const rect = this.canvas.getBoundingClientRect();
        this.lastMouseX = e.clientX - rect.left;
        this.lastMouseY = e.clientY - rect.top;
        this.canvas.style.cursor = 'grabbing';
    }

    /** @private */
    _onMouseUp(e) {
        this.canvas.style.cursor = 'crosshair';

        // Si el arrastre fue mínimo, considerarlo un clic
        if (this.isDragging && this.dragDistance < this.dragThreshold) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const mapCoords = this.renderer.canvasToMap(x, y);
            
            if (mapCoords && this.onRegionClick) {
                this.onRegionClick(mapCoords.x, mapCoords.y);
            }
        }

        this.isDragging = false;
    }

    /** @private */
    _onMouseLeave() {
        this.isDragging = false;
        this.renderer.hoverX = -1;
        this.renderer.hoverY = -1;
        this.canvas.style.cursor = 'crosshair';
        this.needsRender = true;
    }

    /** @private */
    _onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.renderer.zoom(e.deltaY > 0 ? -1 : 1, x, y);
        this.needsRender = true;
    }

    // === EVENTOS TÁCTILES ===

    /** @private */
    _onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.dragDistance = 0;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // Pinch zoom
            e.preventDefault();
            this.touchStartDist = this._getTouchDistance(e.touches);
            this.touchStartScale = this.renderer.scale;
        }
    }

    /** @private */
    _onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1 && this.isDragging) {
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const dx = x - this.lastMouseX;
            const dy = y - this.lastMouseY;
            this.dragDistance += Math.abs(dx) + Math.abs(dy);
            this.renderer.pan(dx, dy);
            this.lastMouseX = x;
            this.lastMouseY = y;
            this.needsRender = true;
        } else if (e.touches.length === 2) {
            const dist = this._getTouchDistance(e.touches);
            const scaleChange = dist / this.touchStartDist;
            const newScale = Math.max(
                this.renderer.minScale,
                Math.min(this.renderer.maxScale, this.touchStartScale * scaleChange)
            );
            this.renderer.scale = newScale;
            this.needsRender = true;
        }
    }

    /** @private */
    _onTouchEnd(e) {
        if (e.touches.length === 0) {
            // Tap = clic
            if (this.dragDistance < this.dragThreshold) {
                const rect = this.canvas.getBoundingClientRect();
                const x = this.lastMouseX - rect.left;
                const y = this.lastMouseY - rect.top;
                const mapCoords = this.renderer.canvasToMap(x, y);
                
                if (mapCoords && this.onRegionClick) {
                    this.onRegionClick(mapCoords.x, mapCoords.y);
                }
            }
            this.isDragging = false;
        }
    }

    /**
     * Calcular distancia entre dos puntos táctiles
     * @private
     */
    _getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
