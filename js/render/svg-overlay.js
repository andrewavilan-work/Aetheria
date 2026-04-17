/**
 * svg-overlay.js - Capa SVG Animada
 * 
 * Genera nubes animadas y ríos con flujo visual
 * como una capa SVG encima del canvas del mapa.
 * Los ríos fluyen desde montañas hacia el mar,
 * y las nubes se mueven suavemente.
 */

/**
 * Clase para la capa SVG sobre el mapa
 */
export class SVGOverlay {
    /**
     * @param {HTMLElement} container - Contenedor SVG
     * @param {number} mapWidth - Ancho del mapa
     * @param {number} mapHeight - Alto del mapa
     */
    constructor(container, mapWidth, mapHeight) {
        this.container = container;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.svgNS = 'http://www.w3.org/2000/svg';
    }

    /**
     * Genera la capa SVG completa con ríos y nubes
     * @param {Float32Array} elevationMap 
     * @param {string[]} biomeMap
     * @param {import('../engine/seed.js').SeededRNG} rng
     */
    generate(elevationMap, biomeMap, rng) {
        // Crear SVG principal
        const svg = document.createElementNS(this.svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${this.mapWidth} ${this.mapHeight}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.classList.add('svg-overlay');

        // Definiciones (filtros, gradientes)
        const defs = document.createElementNS(this.svgNS, 'defs');
        this._addFilters(defs);
        svg.appendChild(defs);

        // Generar ríos
        const rivers = this._generateRivers(elevationMap, rng);
        const riversGroup = document.createElementNS(this.svgNS, 'g');
        riversGroup.classList.add('rivers-group');
        
        for (const river of rivers) {
            const path = this._createRiverPath(river);
            riversGroup.appendChild(path);
        }
        svg.appendChild(riversGroup);

        // Generar nubes
        const cloudsGroup = document.createElementNS(this.svgNS, 'g');
        cloudsGroup.classList.add('clouds-group');
        
        const cloudCount = rng.intRange(4, 8);
        for (let i = 0; i < cloudCount; i++) {
            const cloud = this._createCloud(rng, i);
            cloudsGroup.appendChild(cloud);
        }
        svg.appendChild(cloudsGroup);

        // Limpiar y agregar al contenedor
        this.container.innerHTML = '';
        this.container.appendChild(svg);
    }

    /**
     * Agregar filtros SVG para efectos visuales
     * @private
     */
    _addFilters(defs) {
        // Filtro de desenfoque para nubes
        const blur = document.createElementNS(this.svgNS, 'filter');
        blur.setAttribute('id', 'cloudBlur');
        const feBlur = document.createElementNS(this.svgNS, 'feGaussianBlur');
        feBlur.setAttribute('stdDeviation', '3');
        blur.appendChild(feBlur);
        defs.appendChild(blur);

        // Filtro de resplandor para ríos
        const glow = document.createElementNS(this.svgNS, 'filter');
        glow.setAttribute('id', 'riverGlow');
        const feGlow = document.createElementNS(this.svgNS, 'feGaussianBlur');
        feGlow.setAttribute('stdDeviation', '1');
        feGlow.setAttribute('result', 'blur');
        glow.appendChild(feGlow);
        const feMerge = document.createElementNS(this.svgNS, 'feMerge');
        const mergeNode1 = document.createElementNS(this.svgNS, 'feMergeNode');
        mergeNode1.setAttribute('in', 'blur');
        const mergeNode2 = document.createElementNS(this.svgNS, 'feMergeNode');
        mergeNode2.setAttribute('in', 'SourceGraphic');
        feMerge.appendChild(mergeNode1);
        feMerge.appendChild(mergeNode2);
        glow.appendChild(feMerge);
        defs.appendChild(glow);
    }

    /**
     * Genera ríos que fluyen de montañas al mar
     * Usa un algoritmo de descenso de gradiente simple
     * @private
     */
    _generateRivers(elevationMap, rng) {
        const rivers = [];
        const riverCount = rng.intRange(3, 7);

        for (let r = 0; r < riverCount; r++) {
            // Buscar punto de inicio en zonas altas
            let startX, startY, startElev;
            let attempts = 0;
            
            do {
                startX = rng.intRange(20, this.mapWidth - 20);
                startY = rng.intRange(20, this.mapHeight - 20);
                startElev = elevationMap[startY * this.mapWidth + startX];
                attempts++;
            } while (startElev < 0.6 && attempts < 50);

            if (startElev < 0.5) continue;

            // Seguir el camino descendente
            const points = [{ x: startX, y: startY }];
            let cx = startX;
            let cy = startY;

            for (let step = 0; step < 120; step++) {
                const currentElev = elevationMap[cy * this.mapWidth + cx];
                if (currentElev < 0.32) break; // Llegó al mar

                // Buscar el vecino más bajo
                let bestX = cx, bestY = cy;
                let bestElev = currentElev;

                for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                    const nx = cx + dx;
                    const ny = cy + dy;
                    if (nx < 0 || nx >= this.mapWidth || ny < 0 || ny >= this.mapHeight) continue;
                    
                    const nElev = elevationMap[ny * this.mapWidth + nx];
                    // Añadir un poco de aleatoriedad para ríos más naturales
                    const adjustedElev = nElev - rng.next() * 0.02;
                    if (adjustedElev < bestElev) {
                        bestElev = adjustedElev;
                        bestX = nx;
                        bestY = ny;
                    }
                }

                // Si no se puede descender más, parar
                if (bestX === cx && bestY === cy) break;

                cx = bestX;
                cy = bestY;
                points.push({ x: cx, y: cy });
            }

            // Solo guardar ríos con longitud suficiente
            if (points.length > 10) {
                rivers.push(points);
            }
        }

        return rivers;
    }

    /**
     * Crear un path SVG para un río
     * @private
     */
    _createRiverPath(points) {
        const path = document.createElementNS(this.svgNS, 'path');
        
        // Construir path con curvas suavizadas
        let d = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length - 1; i += 2) {
            const p1 = points[i];
            const p2 = points[Math.min(i + 1, points.length - 1)];
            d += ` Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
        }

        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'rgba(100, 180, 255, 0.6)');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('filter', 'url(#riverGlow)');
        path.classList.add('river-path');

        // Calcular longitud para la animación
        const totalLen = points.length * 1.5;
        path.style.strokeDasharray = `${totalLen * 0.3} ${totalLen * 0.15}`;
        
        return path;
    }

    /**
     * Crear una nube SVG animada
     * @private
     */
    _createCloud(rng, index) {
        const group = document.createElementNS(this.svgNS, 'g');
        group.classList.add('cloud');
        
        const y = rng.range(10, this.mapHeight - 30);
        const x = rng.range(-40, this.mapWidth);
        const scale = rng.range(0.5, 1.5);
        const opacity = rng.range(0.06, 0.15);
        
        group.setAttribute('transform', `translate(${x}, ${y}) scale(${scale})`);
        group.style.opacity = opacity;

        // Crear forma de nube con elipses
        const blobCount = rng.intRange(3, 5);
        for (let i = 0; i < blobCount; i++) {
            const ellipse = document.createElementNS(this.svgNS, 'ellipse');
            ellipse.setAttribute('cx', i * 12);
            ellipse.setAttribute('cy', rng.range(-5, 5));
            ellipse.setAttribute('rx', rng.range(10, 20));
            ellipse.setAttribute('ry', rng.range(6, 12));
            ellipse.setAttribute('fill', 'white');
            ellipse.setAttribute('filter', 'url(#cloudBlur)');
            group.appendChild(ellipse);
        }

        // Animación de movimiento horizontal
        const duration = rng.range(60, 120);
        const animate = document.createElementNS(this.svgNS, 'animateTransform');
        animate.setAttribute('attributeName', 'transform');
        animate.setAttribute('type', 'translate');
        animate.setAttribute('from', `${x} ${y}`);
        animate.setAttribute('to', `${this.mapWidth + 60} ${y}`);
        animate.setAttribute('dur', `${duration}s`);
        animate.setAttribute('repeatCount', 'indefinite');
        group.appendChild(animate);

        return group;
    }
}
