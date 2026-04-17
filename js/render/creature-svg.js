/**
 * creature-svg.js - SVG Morphing de Criaturas
 * 
 * Genera siluetas estilizadas de criaturas usando SVG,
 * con variaciones morfológicas basadas en la semilla.
 * Estilo visual: grabado medieval con trazos en tinta.
 */

/**
 * Clase para generar representaciones SVG de criaturas
 */
export class CreatureSVG {
    constructor() {
        this.svgNS = 'http://www.w3.org/2000/svg';
        this._uid = 0;
    }

    /**
     * Genera un SVG completo para una criatura
     * @param {Object} creature - Datos de la criatura
     * @param {number} width - Ancho del SVG
     * @param {number} height - Alto del SVG
     * @returns {SVGElement}
     */
    generate(creature, width = 200, height = 200) {
        this._uid++;
        const uid = 'cs' + this._uid + '_' + Date.now();
        this._currentUid = uid;

        const svg = document.createElementNS(this.svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.classList.add('creature-svg');

        const vt = creature.visualTraits;
        const cx = width / 2;
        const cy = height / 2;

        // Definiciones (gradientes, filtros) con IDs únicos
        const defs = this._createDefs(vt, uid);
        svg.appendChild(defs);

        // Grupo principal con estilo de grabado
        const mainGroup = document.createElementNS(this.svgNS, 'g');
        mainGroup.setAttribute('stroke', `hsl(${vt.primaryHue}, ${vt.saturation}%, 70%)`);
        mainGroup.setAttribute('fill', `hsla(${vt.primaryHue}, ${vt.saturation}%, 40%, 0.3)`);
        mainGroup.setAttribute('stroke-width', '1.5');
        mainGroup.setAttribute('stroke-linecap', 'round');

        // Dibujar según tipo de cuerpo
        switch (creature.bodyType) {
            case 'serpentine':
            case 'serpentine_winged':
                this._drawSerpentine(mainGroup, cx, cy, vt, creature.bodyType === 'serpentine_winged');
                break;
            case 'winged_quad':
                this._drawWingedQuad(mainGroup, cx, cy, vt);
                break;
            case 'winged_humanoid':
                this._drawWingedHumanoid(mainGroup, cx, cy, vt);
                break;
            case 'winged':
                this._drawWinged(mainGroup, cx, cy, vt);
                break;
            case 'humanoid':
                this._drawHumanoid(mainGroup, cx, cy, vt);
                break;
            case 'quadruped':
                this._drawQuadruped(mainGroup, cx, cy, vt);
                break;
            case 'arachnid':
                this._drawArachnid(mainGroup, cx, cy, vt);
                break;
            case 'cephalopod':
                this._drawCephalopod(mainGroup, cx, cy, vt);
                break;
            default:
                this._drawAmorphous(mainGroup, cx, cy, vt);
                break;
        }

        // Decoración de patrón
        if (vt.pattern === 'scaled' || vt.pattern === 'striped') {
            this._addPatternOverlay(mainGroup, cx, cy, vt);
        }

        svg.appendChild(mainGroup);

        // Aura mágica para criaturas con alta magia
        if (creature.stats.magic > 7) {
            this._addMagicAura(svg, cx, cy, vt);
        }

        return svg;
    }

    /**
     * Genera HTML string del SVG (para inserción directa)
     */
    generateHTML(creature, width = 200, height = 200) {
        const svg = this.generate(creature, width, height);
        const container = document.createElement('div');
        container.appendChild(svg);
        return container.innerHTML;
    }

    /** @private */
    _createDefs(vt, uid) {
        const defs = document.createElementNS(this.svgNS, 'defs');
        
        // Gradiente radial para el cuerpo (ID único)
        const grad = document.createElementNS(this.svgNS, 'radialGradient');
        grad.setAttribute('id', `bodyGrad_${uid}`);
        const stop1 = document.createElementNS(this.svgNS, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', `hsla(${vt.primaryHue}, ${vt.saturation}%, 50%, 0.4)`);
        const stop2 = document.createElementNS(this.svgNS, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', `hsla(${vt.primaryHue}, ${vt.saturation}%, 25%, 0.2)`);
        grad.appendChild(stop1);
        grad.appendChild(stop2);
        defs.appendChild(grad);

        // Filtro de resplandor (ID único)
        const glow = document.createElementNS(this.svgNS, 'filter');
        glow.setAttribute('id', `creatureGlow_${uid}`);
        const feBlur = document.createElementNS(this.svgNS, 'feGaussianBlur');
        feBlur.setAttribute('stdDeviation', '2');
        glow.appendChild(feBlur);
        defs.appendChild(glow);

        return defs;
    }

    /** Helper to get gradient URL with current UID @private */
    _gradUrl() {
        return `url(#bodyGrad_${this._currentUid})`;
    }

    /** Helper to get glow filter URL with current UID @private */
    _glowUrl() {
        return `url(#creatureGlow_${this._currentUid})`;
    }

    /** Dibujar criatura serpenteante @private */
    _drawSerpentine(group, cx, cy, vt, hasWings) {
        const scale = vt.bodyScale;
        // Cuerpo ondulante
        const bodyPath = document.createElementNS(this.svgNS, 'path');
        const amplitude = 25 * scale;
        let d = `M ${cx - 60 * scale} ${cy}`;
        for (let i = 0; i < 8; i++) {
            const x1 = cx - 60 * scale + i * 15 * scale;
            const y1 = cy + (i % 2 === 0 ? -amplitude : amplitude) * 0.7;
            const x2 = cx - 60 * scale + (i + 1) * 15 * scale;
            const y2 = cy;
            d += ` Q ${x1} ${y1} ${x2} ${y2}`;
        }
        bodyPath.setAttribute('d', d);
        bodyPath.setAttribute('fill', this._gradUrl());
        bodyPath.setAttribute('stroke-width', `${3 * scale}`);
        group.appendChild(bodyPath);

        // Cabeza
        this._drawHead(group, cx - 60 * scale, cy, scale * 1.2, vt);

        // Cola
        const tail = document.createElementNS(this.svgNS, 'path');
        tail.setAttribute('d', `M ${cx + 60 * scale} ${cy} Q ${cx + 75 * scale} ${cy - 15 * scale} ${cx + 85 * scale} ${cy - 5 * scale}`);
        tail.setAttribute('fill', 'none');
        tail.setAttribute('stroke-width', `${2 * scale}`);
        group.appendChild(tail);

        // Alas opcionales
        if (hasWings) {
            this._drawWings(group, cx, cy - 15 * scale, vt.wingSpan * 40, scale);
        }
    }

    /** Dibujar cuadrúpedo alado @private */
    _drawWingedQuad(group, cx, cy, vt) {
        const s = vt.bodyScale;
        
        // Cuerpo
        const body = document.createElementNS(this.svgNS, 'ellipse');
        body.setAttribute('cx', cx);
        body.setAttribute('cy', cy + 10);
        body.setAttribute('rx', 35 * s);
        body.setAttribute('ry', 20 * s);
        body.setAttribute('fill', 'url(#bodyGrad)');
        group.appendChild(body);

        // Patas
        for (let i = 0; i < 4; i++) {
            const legX = cx + (i < 2 ? -20 : 20) * s;
            const legY = cy + 25 * s;
            const leg = document.createElementNS(this.svgNS, 'line');
            leg.setAttribute('x1', legX + (i % 2 === 0 ? -5 : 5) * s);
            leg.setAttribute('y1', legY);
            leg.setAttribute('x2', legX + (i % 2 === 0 ? -8 : 8) * s);
            leg.setAttribute('y2', legY + 25 * s);
            leg.setAttribute('stroke-width', `${2 * s}`);
            group.appendChild(leg);
        }

        // Cabeza
        this._drawHead(group, cx - 40 * s, cy - 5 * s, s, vt);

        // Alas
        this._drawWings(group, cx, cy - 10 * s, vt.wingSpan * 50, s);

        // Cola
        const tail = document.createElementNS(this.svgNS, 'path');
        tail.setAttribute('d', `M ${cx + 35 * s} ${cy + 10} Q ${cx + 55 * s} ${cy} ${cx + 65 * s} ${cy - 15 * s}`);
        tail.setAttribute('fill', 'none');
        tail.setAttribute('stroke-width', `${2 * s}`);
        group.appendChild(tail);
    }

    /** Dibujar humanoide alado @private */
    _drawWingedHumanoid(group, cx, cy, vt) {
        this._drawHumanoid(group, cx, cy, vt);
        this._drawWings(group, cx, cy - 25 * vt.bodyScale, vt.wingSpan * 45, vt.bodyScale);
    }

    /** Dibujar criatura alada @private */
    _drawWinged(group, cx, cy, vt) {
        const s = vt.bodyScale;
        // Cuerpo aerodinámico
        const body = document.createElementNS(this.svgNS, 'ellipse');
        body.setAttribute('cx', cx);
        body.setAttribute('cy', cy);
        body.setAttribute('rx', 20 * s);
        body.setAttribute('ry', 12 * s);
        body.setAttribute('fill', this._gradUrl());
        group.appendChild(body);

        this._drawHead(group, cx - 25 * s, cy - 5 * s, s * 0.8, vt);
        this._drawWings(group, cx, cy - 5 * s, vt.wingSpan * 55, s);

        // Cola de plumas
        const tail = document.createElementNS(this.svgNS, 'path');
        tail.setAttribute('d', `M ${cx + 20 * s} ${cy} Q ${cx + 40 * s} ${cy - 10 * s} ${cx + 55 * s} ${cy + 5 * s}`);
        tail.setAttribute('fill', 'none');
        group.appendChild(tail);
    }

    /** Dibujar humanoide @private */
    _drawHumanoid(group, cx, cy, vt) {
        const s = vt.bodyScale;
        
        // Torso
        const torso = document.createElementNS(this.svgNS, 'path');
        torso.setAttribute('d', `M ${cx - 15 * s} ${cy - 10 * s} Q ${cx} ${cy - 20 * s} ${cx + 15 * s} ${cy - 10 * s} L ${cx + 12 * s} ${cy + 20 * s} L ${cx - 12 * s} ${cy + 20 * s} Z`);
        torso.setAttribute('fill', this._gradUrl());
        group.appendChild(torso);

        // Cabeza
        this._drawHead(group, cx, cy - 35 * s, s, vt);

        // Brazos
        for (const side of [-1, 1]) {
            const arm = document.createElementNS(this.svgNS, 'path');
            arm.setAttribute('d', `M ${cx + side * 15 * s} ${cy - 8 * s} Q ${cx + side * 30 * s} ${cy} ${cx + side * 25 * s} ${cy + 20 * s}`);
            arm.setAttribute('fill', 'none');
            arm.setAttribute('stroke-width', `${2 * s}`);
            group.appendChild(arm);
        }

        // Piernas
        for (const side of [-1, 1]) {
            const leg = document.createElementNS(this.svgNS, 'line');
            leg.setAttribute('x1', cx + side * 8 * s);
            leg.setAttribute('y1', cy + 20 * s);
            leg.setAttribute('x2', cx + side * 12 * s);
            leg.setAttribute('y2', cy + 50 * s);
            leg.setAttribute('stroke-width', `${2.5 * s}`);
            group.appendChild(leg);
        }

        // Cuernos
        if (vt.horns > 0) {
            this._drawHorns(group, cx, cy - 40 * s, vt.horns, s);
        }
    }

    /** Dibujar cuadrúpedo @private */
    _drawQuadruped(group, cx, cy, vt) {
        const s = vt.bodyScale;
        
        // Cuerpo
        const body = document.createElementNS(this.svgNS, 'ellipse');
        body.setAttribute('cx', cx);
        body.setAttribute('cy', cy + 5);
        body.setAttribute('rx', 30 * s);
        body.setAttribute('ry', 18 * s);
        body.setAttribute('fill', this._gradUrl());
        group.appendChild(body);

        // Patas
        for (let i = 0; i < 4; i++) {
            const legX = cx + (i < 2 ? -18 : 18) * s;
            const leg = document.createElementNS(this.svgNS, 'line');
            leg.setAttribute('x1', legX);
            leg.setAttribute('y1', cy + 20 * s);
            leg.setAttribute('x2', legX + (i % 2 === 0 ? -3 : 3) * s);
            leg.setAttribute('y2', cy + 45 * s);
            leg.setAttribute('stroke-width', `${2.5 * s}`);
            group.appendChild(leg);
        }

        // Cabeza
        this._drawHead(group, cx - 38 * s, cy - 5 * s, s, vt);

        // Colas
        for (let t = 0; t < vt.tails; t++) {
            const tail = document.createElementNS(this.svgNS, 'path');
            const angle = (t - (vt.tails - 1) / 2) * 15;
            tail.setAttribute('d', `M ${cx + 30 * s} ${cy + 5} Q ${cx + 50 * s} ${cy - 10 + angle} ${cx + 60 * s} ${cy - 20 + angle}`);
            tail.setAttribute('fill', 'none');
            group.appendChild(tail);
        }
    }

    /** Dibujar arácnido @private */
    _drawArachnid(group, cx, cy, vt) {
        const s = vt.bodyScale;
        
        // Cefalotórax
        const head = document.createElementNS(this.svgNS, 'ellipse');
        head.setAttribute('cx', cx - 10 * s);
        head.setAttribute('cy', cy);
        head.setAttribute('rx', 15 * s);
        head.setAttribute('ry', 12 * s);
        head.setAttribute('fill', this._gradUrl());
        group.appendChild(head);

        // Abdomen
        const abdomen = document.createElementNS(this.svgNS, 'ellipse');
        abdomen.setAttribute('cx', cx + 20 * s);
        abdomen.setAttribute('cy', cy + 5);
        abdomen.setAttribute('rx', 20 * s);
        abdomen.setAttribute('ry', 16 * s);
        abdomen.setAttribute('fill', this._gradUrl());
        group.appendChild(abdomen);

        // 8 patas
        for (let i = 0; i < 8; i++) {
            const side = i < 4 ? -1 : 1;
            const idx = i % 4;
            const legX = cx - 10 * s + idx * 8 * s;
            const leg = document.createElementNS(this.svgNS, 'path');
            leg.setAttribute('d', `M ${legX} ${cy + side * 5} Q ${legX + side * 25 * s} ${cy + side * 20 * s} ${legX + side * 15 * s} ${cy + side * 40 * s}`);
            leg.setAttribute('fill', 'none');
            leg.setAttribute('stroke-width', `${1.5 * s}`);
            group.appendChild(leg);
        }

        // Ojos múltiples
        for (let e = 0; e < Math.min(vt.eyes, 6); e++) {
            const eye = document.createElementNS(this.svgNS, 'circle');
            eye.setAttribute('cx', cx - 18 * s + e * 4 * s);
            eye.setAttribute('cy', cy - 6 * s + (e % 2) * 4 * s);
            eye.setAttribute('r', 2 * s);
            eye.setAttribute('fill', `hsl(${vt.primaryHue + 120}, 80%, 70%)`);
            group.appendChild(eye);
        }
    }

    /** Dibujar cefalópodo @private */
    _drawCephalopod(group, cx, cy, vt) {
        const s = vt.bodyScale;
        
        // Manto
        const mantle = document.createElementNS(this.svgNS, 'path');
        mantle.setAttribute('d', `M ${cx - 15 * s} ${cy - 30 * s} Q ${cx} ${cy - 40 * s} ${cx + 15 * s} ${cy - 30 * s} Q ${cx + 20 * s} ${cy - 10 * s} ${cx + 15 * s} ${cy} Q ${cx} ${cy + 5 * s} ${cx - 15 * s} ${cy} Q ${cx - 20 * s} ${cy - 10 * s} ${cx - 15 * s} ${cy - 30 * s} Z`);
        mantle.setAttribute('fill', this._gradUrl());
        group.appendChild(mantle);

        // Tentáculos
        const tentCount = 8;
        for (let i = 0; i < tentCount; i++) {
            const angle = (i / tentCount) * Math.PI - Math.PI / 2;
            const tent = document.createElementNS(this.svgNS, 'path');
            const tx = cx + Math.cos(angle) * 10 * s;
            const ty = cy + 5 * s;
            const ex = cx + Math.cos(angle) * 40 * s;
            const ey = cy + 30 * s + Math.sin(angle + 1) * 15 * s;
            tent.setAttribute('d', `M ${tx} ${ty} Q ${(tx + ex) / 2 + Math.sin(angle) * 15} ${(ty + ey) / 2} ${ex} ${ey}`);
            tent.setAttribute('fill', 'none');
            tent.setAttribute('stroke-width', `${2 * s}`);
            group.appendChild(tent);
        }

        // Ojos
        for (const side of [-1, 1]) {
            const eye = document.createElementNS(this.svgNS, 'ellipse');
            eye.setAttribute('cx', cx + side * 8 * s);
            eye.setAttribute('cy', cy - 15 * s);
            eye.setAttribute('rx', 4 * s);
            eye.setAttribute('ry', 5 * s);
            eye.setAttribute('fill', `hsl(${vt.primaryHue + 60}, 70%, 60%)`);
            group.appendChild(eye);
        }
    }

    /** Dibujar forma amorfa @private */
    _drawAmorphous(group, cx, cy, vt) {
        const s = vt.bodyScale;
        const points = 8;
        let d = '';
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = (25 + Math.sin(angle * 3) * 10) * s;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) d = `M ${x} ${y}`;
            else {
                const prevAngle = ((i - 0.5) / points) * Math.PI * 2;
                const cpx = cx + Math.cos(prevAngle) * radius * 1.2;
                const cpy = cy + Math.sin(prevAngle) * radius * 1.2;
                d += ` Q ${cpx} ${cpy} ${x} ${y}`;
            }
        }
        d += ' Z';

        const shape = document.createElementNS(this.svgNS, 'path');
        shape.setAttribute('d', d);
        shape.setAttribute('fill', this._gradUrl());
        group.appendChild(shape);

        // Partículas internas
        for (let p = 0; p < 5; p++) {
            const particle = document.createElementNS(this.svgNS, 'circle');
            particle.setAttribute('cx', cx + Math.cos(p * 1.3) * 12 * s);
            particle.setAttribute('cy', cy + Math.sin(p * 1.3) * 12 * s);
            particle.setAttribute('r', 2 * s);
            particle.setAttribute('fill', `hsl(${vt.primaryHue}, ${vt.saturation}%, 70%)`);
            particle.setAttribute('opacity', '0.6');
            group.appendChild(particle);
        }
    }

    /** Dibujar cabeza genérica @private */
    _drawHead(group, x, y, scale, vt) {
        const s = scale;
        const head = document.createElementNS(this.svgNS, 'circle');
        head.setAttribute('cx', x);
        head.setAttribute('cy', y);
        head.setAttribute('r', 8 * s);
        head.setAttribute('fill', this._gradUrl());
        group.appendChild(head);

        // Ojos
        for (let e = 0; e < Math.min(vt.eyes, 4); e++) {
            const eye = document.createElementNS(this.svgNS, 'circle');
            const ex = x - 4 * s + e * 4 * s;
            const ey = y - 2 * s;
            eye.setAttribute('cx', ex);
            eye.setAttribute('cy', ey);
            eye.setAttribute('r', 1.5 * s);
            eye.setAttribute('fill', `hsl(${vt.primaryHue + 120}, 80%, 70%)`);
            group.appendChild(eye);
        }

        // Mandíbula
        if (vt.jawSize === 'large') {
            const jaw = document.createElementNS(this.svgNS, 'path');
            jaw.setAttribute('d', `M ${x - 6 * s} ${y + 3 * s} L ${x - 10 * s} ${y + 8 * s} L ${x + 2 * s} ${y + 5 * s}`);
            jaw.setAttribute('fill', 'none');
            group.appendChild(jaw);
        }
    }

    /** Dibujar alas @private */
    _drawWings(group, cx, cy, span, scale) {
        for (const side of [-1, 1]) {
            const wing = document.createElementNS(this.svgNS, 'path');
            const tipX = cx + side * span;
            const tipY = cy - span * 0.3;
            wing.setAttribute('d', `M ${cx} ${cy} Q ${cx + side * span * 0.5} ${cy - span * 0.6} ${tipX} ${tipY} Q ${cx + side * span * 0.7} ${cy + span * 0.1} ${cx} ${cy + 5 * scale}`);
            wing.setAttribute('fill', `hsla(${0}, 0%, 100%, 0.08)`);
            wing.setAttribute('stroke-width', `${1.5 * scale}`);
            group.appendChild(wing);

            // Nervaduras del ala
            for (let n = 1; n <= 3; n++) {
                const nerve = document.createElementNS(this.svgNS, 'line');
                const t = n / 4;
                nerve.setAttribute('x1', cx);
                nerve.setAttribute('y1', cy);
                nerve.setAttribute('x2', cx + side * span * t);
                nerve.setAttribute('y2', cy - span * 0.4 * t);
                nerve.setAttribute('stroke-width', `${0.5 * scale}`);
                nerve.setAttribute('opacity', '0.4');
                group.appendChild(nerve);
            }
        }
    }

    /** Dibujar cuernos @private */
    _drawHorns(group, cx, cy, count, scale) {
        for (let h = 0; h < count; h++) {
            const side = h % 2 === 0 ? -1 : 1;
            const offset = Math.floor(h / 2) * 5 * scale;
            const horn = document.createElementNS(this.svgNS, 'path');
            horn.setAttribute('d', `M ${cx + side * 6 * scale} ${cy + offset} Q ${cx + side * 15 * scale} ${cy - 10 * scale + offset} ${cx + side * 12 * scale} ${cy - 20 * scale + offset}`);
            horn.setAttribute('fill', 'none');
            horn.setAttribute('stroke-width', `${2 * scale}`);
            group.appendChild(horn);
        }
    }

    /** Agregar decoración de patrón @private */
    _addPatternOverlay(group, cx, cy, vt) {
        const s = vt.bodyScale;
        if (vt.pattern === 'striped') {
            for (let i = -3; i <= 3; i++) {
                const line = document.createElementNS(this.svgNS, 'line');
                line.setAttribute('x1', cx + i * 8 * s);
                line.setAttribute('y1', cy - 15 * s);
                line.setAttribute('x2', cx + i * 8 * s + 3 * s);
                line.setAttribute('y2', cy + 15 * s);
                line.setAttribute('stroke-width', '0.5');
                line.setAttribute('opacity', '0.3');
                group.appendChild(line);
            }
        }
    }

    /** Agregar aura mágica @private */
    _addMagicAura(svg, cx, cy, vt) {
        const aura = document.createElementNS(this.svgNS, 'circle');
        aura.setAttribute('cx', cx);
        aura.setAttribute('cy', cy);
        aura.setAttribute('r', 60 * vt.bodyScale);
        aura.setAttribute('fill', 'none');
        aura.setAttribute('stroke', `hsla(${vt.primaryHue}, ${vt.saturation}%, 60%, 0.15)`);
        aura.setAttribute('stroke-width', '8');
        aura.setAttribute('filter', this._glowUrl());
        aura.classList.add('magic-aura');
        svg.appendChild(aura);
    }
}
