/**
 * map-renderer.js - Renderizado del Mapa en Canvas 2D
 * 
 * Pinta el mapa completo a pantalla completa con estilo pixel-art nítido.
 * Dibuja ríos, POIs con iconos ricos (castillos, criaturas),
 * hover dorado, zoom y paneo.
 * Los ríos se integran directamente en el canvas para seguir las transformaciones.
 */

import { BIOME_DEFS, WATER_LEVEL } from '../world/biomes.js';

/**
 * Clase principal del renderizador de mapas
 */
export class MapRenderer {
    /**
     * @param {HTMLCanvasElement} canvas - Elemento canvas del DOM
     * @param {number} mapWidth - Ancho del mapa en celdas
     * @param {number} mapHeight - Alto del mapa en celdas
     */
    constructor(canvas, mapWidth, mapHeight) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        
        // Estado de zoom y paneo
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.minScale = 0.5;
        this.maxScale = 6;

        // Estado del hover
        this.hoverX = -1;
        this.hoverY = -1;
        this.hoverRadius = 12;

        // Cache de imagen renderizada
        this.mapImageData = null;
        this.needsFullRender = true;

        // POIs marcadores
        this.pois = [];

        // Ríos generados (se dibujan sobre el canvas)
        this.rivers = [];

        this.tradeRoutesData = { routes: [], cultures: [] };

        // Datos del mundo
        this.biomeMap = null;
        this.elevationMap = null;

        // Tamaño de celda para que el mapa llene la pantalla
        this.cellSize = 1;
    }

    /**
     * Ajustar el canvas al tamaño del contenedor
     */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
        this.needsFullRender = true;
    }

    /**
     * Asignar datos del mundo al renderizador
     */
    setWorldData(biomeMap, elevationMap) {
        this.biomeMap = biomeMap;
        this.elevationMap = elevationMap;
        this.needsFullRender = true;
    }

    /**
     * Asignar POIs al mapa
     */
    setPOIs(pois) {
        this.pois = pois;
    }

    /**
     * Asignar ríos pre-calculados
     */
    setRivers(rivers) {
        this.rivers = rivers;
    }

    /**
     * Establecer rutas de comercio a dibujar
     */
    setTradeRoutes(routes, cultures) {
        this.tradeRoutesData = { routes, cultures };
        this.needsFullRender = true;
    }

    /**
     * Parsear color hexadecimal a componentes RGB
     */
    _hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    }

    /**
     * Renderizar el mapa base a mayor resolución en un offscreen canvas
     * Se renderiza con 3px por celda para mejor calidad visual
     */
    renderBaseMap() {
        if (!this.biomeMap || !this.elevationMap) return;

        // Escala de renderizado: 3 pixels por celda para nitidez
        const RENDER_SCALE = 3;
        const rw = this.mapWidth * RENDER_SCALE;
        const rh = this.mapHeight * RENDER_SCALE;

        const offscreen = document.createElement('canvas');
        offscreen.width = rw;
        offscreen.height = rh;
        const offCtx = offscreen.getContext('2d');
        const imageData = offCtx.createImageData(rw, rh);
        const data = imageData.data;

        for (let my = 0; my < this.mapHeight; my++) {
            for (let mx = 0; mx < this.mapWidth; mx++) {
                const idx = my * this.mapWidth + mx;
                const biome = this.biomeMap[idx];
                const elevation = this.elevationMap[idx];
                const def = BIOME_DEFS[biome];
                
                if (!def) continue;

                let [r, g, b] = this._hexToRgb(def.color);

                // Variación de color natural por bioma y elevación
                let elevFactor = 0;
                if (elevation > WATER_LEVEL) {
                    elevFactor = (elevation - WATER_LEVEL) * 0.4;
                }

                r = r + r * elevFactor;
                g = g + g * elevFactor;
                b = b + b * elevFactor;

                // Iluminación direccional realista (Sol desde el noroeste)
                let shadowFactor = 0;
                let coastalFoam = false;

                if (mx > 0 && my > 0 && mx < this.mapWidth - 1 && my < this.mapHeight - 1) {
                    const leftE = this.elevationMap[idx - 1];
                    const rightE = this.elevationMap[idx + 1];
                    const topE = this.elevationMap[idx - this.mapWidth];
                    const bottomE = this.elevationMap[idx + this.mapWidth];

                    // Gradiente de elevación
                    const dx = rightE - leftE;
                    const dy = bottomE - topE;
                    
                    // Producto punto aproximado con vector de sol (-1, -1)
                    shadowFactor = -(dx + dy) * 3.5; 

                    // Detectar la línea de costa
                    if (elevation >= WATER_LEVEL && (leftE < WATER_LEVEL || rightE < WATER_LEVEL || topE < WATER_LEVEL || bottomE < WATER_LEVEL)) {
                        coastalFoam = true;
                    }
                }

                // Aplicar luces y sombras topográficas
                if (elevation > WATER_LEVEL) {
                    const light = shadowFactor * 200; // Intensidad de la luz
                    r = Math.max(0, Math.min(255, r + light));
                    g = Math.max(0, Math.min(255, g + light));
                    b = Math.max(0, Math.min(255, b + light));
                    
                    // Brillo en la línea de costa (simula espuma o arena reflectante)
                    if (coastalFoam && def.name !== 'DESERT') {
                        r = Math.min(255, r + 45);
                        g = Math.min(255, g + 40);
                        b = Math.min(255, b + 25);
                    }
                } else {
                    // Océano - efecto de profundidad volumétrico
                    const waterDepth = (WATER_LEVEL - elevation) / WATER_LEVEL;
                    const oceanDarkness = waterDepth * 0.65;
                    const waterLight = shadowFactor * 70; // Las olas reflejan un poco
                    
                    r = Math.max(0, Math.min(255, r * (1 - oceanDarkness) + waterLight));
                    g = Math.max(0, Math.min(255, g * (1 - oceanDarkness) + waterLight));
                    b = Math.max(0, Math.min(255, b * (1 - oceanDarkness) + waterLight));
                }

                // Pintar cada celda como bloque de RENDER_SCALE x RENDER_SCALE
                // Añadiendo un ruido MUY sutil por pixel para evadir la planitud total
                const baseR = r, baseG = g, baseB = b;
                
                for (let cdy = 0; cdy < RENDER_SCALE; cdy++) {
                    for (let cdx = 0; cdx < RENDER_SCALE; cdx++) {
                        const pxNoise = (Math.sin((mx * RENDER_SCALE + cdx) * 12.9898 + (my * RENDER_SCALE + cdy) * 78.233) * 43758.5453) % 1;
                        // Tierra = más granulosa, Agua = más suave
                        const grain = elevation > WATER_LEVEL ? (pxNoise - 0.5) * 14 : (pxNoise - 0.5) * 5;

                        const px = ((my * RENDER_SCALE + cdy) * rw + (mx * RENDER_SCALE + cdx)) * 4;
                        data[px] = Math.max(0, Math.min(255, baseR + grain));
                        data[px + 1] = Math.max(0, Math.min(255, baseG + grain));
                        data[px + 2] = Math.max(0, Math.min(255, baseB + grain));
                        data[px + 3] = 255;
                    }
                }
            }
        }

        offCtx.putImageData(imageData, 0, 0);

        // Dibujar elementos físicos (montañas, ríos)
        this._drawMountainsOnCanvas(offCtx, RENDER_SCALE);
        this._drawRiversOnCanvas(offCtx, RENDER_SCALE);

        this.mapImageData = offscreen;
        this.renderScale = RENDER_SCALE;
        this.needsFullRender = false;
    }

    /**
     * Dibuja iconos/picos de montañas basadas en la elevación alta
     * @private
     */
    _drawMountainsOnCanvas(ctx, scale) {
        if (!this.elevationMap) return;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(60, 50, 40, 0.4)';
        ctx.fillStyle = 'rgba(80, 70, 60, 0.3)';

        for (let i = 0; i < this.elevationMap.length; i += 7) { // Muestrear
            const elev = this.elevationMap[i];
            if (elev > 0.72) {
                const x = (i % this.mapWidth) * scale;
                const y = Math.floor(i / this.mapWidth) * scale;
                
                // Dibujar pico (triángulo)
                const h = (elev - 0.7) * 45 * scale; // Altura
                const w = h * 0.8;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w/2, y - h);
                ctx.lineTo(x + w, y);
                ctx.fill();
                ctx.stroke();

                // Nieve en el pico
                if (elev > 0.85) {
                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    ctx.beginPath();
                    ctx.moveTo(x + w/4, y - h/2);
                    ctx.lineTo(x + w/2, y - h);
                    ctx.lineTo(x + w*0.75, y - h/2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(80, 70, 60, 0.3)';
                }
            }
        }
        ctx.restore();
    }

    /**
     * Dibujar ríos directamente en el canvas del mapa (siguen zoom/pan)
     * @private
     */
    _drawRiversOnCanvas(ctx, scale) {
        if (!this.rivers || this.rivers.length === 0) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const river of this.rivers) {
            if (river.length < 5) continue;

            // El grosor del río aumenta río abajo (nace delgado, muere ancho)
            const segmentCount = river.length;

            ctx.beginPath();
            ctx.moveTo(river[0].x * scale, river[0].y * scale);

            for (let i = 1; i < river.length - 1; i += 2) {
                const p1 = river[i];
                const p2 = river[Math.min(i + 1, river.length - 1)];
                ctx.quadraticCurveTo(p1.x * scale, p1.y * scale, p2.x * scale, p2.y * scale);
            }

            // Grosor progresivo
            const lineWidth = Math.max(1.5, 3 * scale / 3);
            ctx.strokeStyle = 'rgba(80, 160, 240, 0.5)';
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // Brillo interior del río
            ctx.strokeStyle = 'rgba(140, 200, 255, 0.2)';
            ctx.lineWidth = lineWidth * 0.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Calcular parámetros de dibujo del mapa
     * @private
     */
    _getDrawParams() {
        const w = this.displayWidth;
        const h = this.displayHeight;
        
        // Que el mapa llene TODA la pantalla
        const scaleX = w / this.mapWidth;
        const scaleY = h / this.mapHeight;
        const fitScale = Math.max(scaleX, scaleY); // MAX para llenar todo

        const mapDrawW = this.mapWidth * fitScale;
        const mapDrawH = this.mapHeight * fitScale;
        const drawX = (w - mapDrawW) / 2;
        const drawY = (h - mapDrawH) / 2;

        return { w, h, fitScale, mapDrawW, mapDrawH, drawX, drawY };
    }

    /**
     * Frame principal de renderizado
     */
    render() {
        if (this.needsFullRender) {
            this.renderBaseMap();
        }

        if (!this.mapImageData) return;

        const ctx = this.ctx;
        const { w, h, mapDrawW, mapDrawH, drawX, drawY } = this._getDrawParams();

        // Limpiar canvas
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);

        // Aplicar transformaciones de zoom y paneo
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        // Renderizado NÍTIDO del mapa (sin suavizado para look de atlas)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.mapImageData, drawX, drawY, mapDrawW, mapDrawH);

        // Dibujar hover dorado
        if (this.hoverX >= 0 && this.hoverY >= 0) {
            this._renderHover(ctx, drawX, drawY, mapDrawW, mapDrawH);
        }

        // Dibujar rutas de comercio
        this._renderTradeRoutes(ctx, drawX, drawY, mapDrawW, mapDrawH);

        // Dibujar POIs con iconos ricos
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        this._renderPOIs(ctx, drawX, drawY, mapDrawW, mapDrawH);

        ctx.restore();

        // Viñeta decorativa
        this._renderVignette(ctx, w, h);
    }

    /**
     * Hover dorado suave sobre la región
     * @private
     */
    _renderHover(ctx, drawX, drawY, mapW, mapH) {
        const hx = drawX + (this.hoverX / this.mapWidth) * mapW;
        const hy = drawY + (this.hoverY / this.mapHeight) * mapH;
        const cellW = mapW / this.mapWidth;
        const hr = cellW * this.hoverRadius;

        const gradient = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(0.4, 'rgba(255, 200, 50, 0.12)');
        gradient.addColorStop(1, 'rgba(255, 180, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Dibuja líneas punteadas conectando capitales comerciales
     * @private
     */
    _renderTradeRoutes(ctx, drawX, drawY, mapW, mapH) {
        if (!this.tradeRoutesData || !this.tradeRoutesData.routes || this.tradeRoutesData.routes.length === 0) return;
        
        ctx.save();
        ctx.setLineDash([8, 12]);
        ctx.lineDashOffset = (Date.now() / 50) % 20; // Anima la ruta
        ctx.lineWidth = 2.5 / Math.max(0.5, this.scale * 0.5);
        ctx.strokeStyle = 'rgba(218, 165, 32, 0.6)'; // Oro translúcido
        ctx.shadowColor = 'rgba(218, 165, 32, 0.4)';
        ctx.shadowBlur = 4;
        
        for (const route of this.tradeRoutesData.routes) {
            if (!route.active) continue;

            const cFrom = this.tradeRoutesData.cultures.find(c => c.name === route.from);
            const cTo = this.tradeRoutesData.cultures.find(c => c.name === route.to);

            if (cFrom && cTo && cFrom.mapX && cTo.mapX) {
                const x1 = drawX + (cFrom.mapX / this.mapWidth) * mapW;
                const y1 = drawY + (cFrom.mapY / this.mapHeight) * mapH;
                const x2 = drawX + (cTo.mapX / this.mapWidth) * mapW;
                const y2 = drawY + (cTo.mapY / this.mapHeight) * mapH;

                // Curva cuadrática sutil basándose en la distancia
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const cx = (x1 + x2) / 2 - dy * 0.15;
                const cy = (y1 + y2) / 2 + dx * 0.15;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.quadraticCurveTo(cx, cy, x2, y2);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }

    /**
     * Renderizar marcadores ricos de POI
     * Cada tipo tiene su propio icono visual dibujado en Canvas
     * @private
     */
    _renderPOIs(ctx, drawX, drawY, mapW, mapH) {
        const cellW = mapW / this.mapWidth;
        const baseSize = Math.max(16, cellW * 3.5);

        for (const poi of this.pois) {
            const px = drawX + (poi.x / this.mapWidth) * mapW;
            const py = drawY + (poi.y / this.mapHeight) * mapH;
            const size = baseSize / Math.max(1, this.scale * 0.5);

            ctx.save();

            if (poi.type === 'creature') {
                this._drawCreatureMarker(ctx, px, py, size, poi.color || '#e04040', poi.data);
            } else if (poi.type === 'city') {
                this._drawCityMarker(ctx, px, py, size, poi.color || '#ffd700');
            } else if (poi.type === 'capital') {
                this._drawCapitalMarker(ctx, px, py, size * 1.3, poi.color || '#ffd700');
            } else {
                this._drawGenericMarker(ctx, px, py, size, poi.color || '#ffffff');
            }

            // Nombre del POI si hay zoom suficiente
            if (this.scale > 1.5 && poi.label) {
                ctx.font = `bold ${Math.max(8, 11 / this.scale)}px 'Quicksand', sans-serif`;
                ctx.fillStyle = 'rgba(255, 245, 220, 0.9)';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.lineWidth = 2;
                ctx.textAlign = 'center';
                ctx.strokeText(poi.label, px, py - size - 4);
                ctx.fillText(poi.label, px, py - size - 4);
            }

            ctx.restore();
        }
    }

    /**
     * Marcador de criatura utilizando miniatura de Emoji según su tipo
     * @private
     */
    _drawCreatureMarker(ctx, x, y, size, color, data) {
        const s = size * 1.2;

        // Fondo con resplandor para visibilidad en el mapa
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - s*0.3, s * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Emoji mapping por arquetipo/cuerpo
        const emojiMap = {
            'serpentine': '🐍', 'serpentine_winged': '🐉', 'winged_quad': '🦁', 
            'winged_humanoid': '🧚', 'winged': '🦅', 'humanoid': '🧌', 
            'quadruped': '🐺', 'hybrid': '👹', 'reptilian': '🦖', 
            'arachnid': '🕷️', 'shapeshifter': '🦊', 'amorphous': '☄️', 
            'ethereal': '👻', 'cephalopod': '🦑'
        };

        const emoji = data && data.bodyType ? (emojiMap[data.bodyType] || '👾') : '👾';
        
        ctx.font = `${s}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, x, y - s*0.3);
    }

    /**
     * Marcador de ciudad/civilización: torre de castillo
     * @private
     */
    _drawCityMarker(ctx, x, y, size, color) {
        const s = size * 0.5;

        // Resplandor
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;

        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1;

        // Torre principal
        ctx.beginPath();
        ctx.rect(x - s * 0.4, y - s * 1.2, s * 0.8, s * 1.5);
        ctx.fill();
        ctx.stroke();

        // Almenas (3 picos en la parte superior)
        ctx.shadowBlur = 0;
        const almenWidth = s * 0.3;
        for (let i = -1; i <= 1; i++) {
            ctx.fillRect(x + i * almenWidth - almenWidth * 0.35, y - s * 1.6, almenWidth * 0.7, s * 0.4);
        }

        // Puerta (arco)
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(x, y + s * 0.05, s * 0.2, Math.PI, 0, false);
        ctx.lineTo(x + s * 0.2, y + s * 0.3);
        ctx.lineTo(x - s * 0.2, y + s * 0.3);
        ctx.fill();

        // Bandera
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y - s * 1.6);
        ctx.lineTo(x, y - s * 2.2);
        ctx.stroke();

        // Bandera triangular
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - s * 2.2);
        ctx.lineTo(x + s * 0.5, y - s * 1.9);
        ctx.lineTo(x, y - s * 1.7);
        ctx.fill();
    }

    /**
     * Marcador de capital: castillo grande con murallas
     * @private
     */
    _drawCapitalMarker(ctx, x, y, size, color) {
        const s = size * 0.5;

        // Resplandor dorado
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;

        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.2;

        // Muralla base
        ctx.beginPath();
        ctx.rect(x - s * 1.2, y - s * 0.6, s * 2.4, s * 1.0);
        ctx.fill();
        ctx.stroke();

        // Torres laterales
        ctx.shadowBlur = 0;
        for (const side of [-1, 1]) {
            ctx.fillRect(x + side * s * 1.0 - s * 0.25, y - s * 1.3, s * 0.5, s * 1.7);
            // Almenas de torres
            ctx.fillRect(x + side * s * 1.0 - s * 0.3, y - s * 1.6, s * 0.2, s * 0.3);
            ctx.fillRect(x + side * s * 1.0 + s * 0.1, y - s * 1.6, s * 0.2, s * 0.3);
        }

        // Torre central (más alta)
        ctx.fillRect(x - s * 0.3, y - s * 1.6, s * 0.6, s * 2.0);
        // Almenas centrales
        for (let i = -1; i <= 1; i++) {
            ctx.fillRect(x + i * s * 0.22 - s * 0.08, y - s * 1.9, s * 0.16, s * 0.3);
        }

        // Puerta con arco
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(x, y, s * 0.2, Math.PI, 0, false);
        ctx.lineTo(x + s * 0.2, y + s * 0.4);
        ctx.lineTo(x - s * 0.2, y + s * 0.4);
        ctx.fill();

        // Bandera real
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - s * 1.9);
        ctx.lineTo(x, y - s * 2.7);
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 2.7);
        ctx.lineTo(x + s * 0.6, y - s * 2.4);
        ctx.lineTo(x, y - s * 2.1);
        ctx.fill();

        // Estrella en la bandera
        ctx.fillStyle = '#0a0a12';
        ctx.beginPath();
        ctx.arc(x + s * 0.2, y - s * 2.4, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Marcador genérico: punto con anillo
     * @private
     */
    _drawGenericMarker(ctx, x, y, size, color) {
        const s = size * 0.3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, s * 1.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Efecto de viñeta en las esquinas
     * @private
     */
    _renderVignette(ctx, w, h) {
        const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.75);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    /**
     * Convertir coordenadas del canvas a coordenadas del mapa
     */
    canvasToMap(canvasX, canvasY) {
        const { mapDrawW, mapDrawH, drawX, drawY } = this._getDrawParams();

        // Invertir transformaciones
        const worldX = (canvasX - this.offsetX) / this.scale;
        const worldY = (canvasY - this.offsetY) / this.scale;

        const mapX = Math.floor(((worldX - drawX) / mapDrawW) * this.mapWidth);
        const mapY = Math.floor(((worldY - drawY) / mapDrawH) * this.mapHeight);

        if (mapX >= 0 && mapX < this.mapWidth && mapY >= 0 && mapY < this.mapHeight) {
            return { x: mapX, y: mapY };
        }
        return null;
    }

    /**
     * Zoom centrado en un punto
     */
    zoom(delta, cx, cy) {
        const zoomFactor = delta > 0 ? 1.12 : 0.88;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoomFactor));
        
        const scaleChange = newScale / this.scale;
        this.offsetX = cx - (cx - this.offsetX) * scaleChange;
        this.offsetY = cy - (cy - this.offsetY) * scaleChange;
        this.scale = newScale;
    }

    /**
     * Mover el paneo del mapa
     */
    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    }

    /**
     * Resetear zoom y posición
     */
    resetView() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }
}
