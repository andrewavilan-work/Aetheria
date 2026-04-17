/**
 * panels.js - Sistema de Paneles Flotantes
 * 
 * Gestiona las tarjetas de información que aparecen
 * al interactuar con el mapa. Soporta paneles de:
 * región, criatura, civilización, economía e historia.
 * Estilo: Glassmorphism + textura de pergamino.
 */

import { BIOME_DEFS } from '../world/biomes.js';
import { CreatureSVG } from '../render/creature-svg.js';
import { RadarChart } from '../render/radar-chart.js';

/**
 * Clase principal del sistema de paneles
 */
export class PanelManager {
    constructor() {
        this.activePanel = null;
        this.panelContainer = document.getElementById('panel-container');
        this.creatureSvgRenderer = new CreatureSVG();
    }

    /**
     * Mostrar panel de información de una región del mapa
     * @param {Object} regionData - Datos de la región
     */
    showRegionPanel(regionData) {
        const biome = BIOME_DEFS[regionData.biomeId];
        if (!biome) return;

        const content = `
            <div class="panel-header">
                <span class="panel-icon">${biome.icon}</span>
                <h2 class="panel-title font-medieval">${regionData.name || biome.name}</h2>
                <button class="panel-close" onclick="window.panelManager.closePanel()" aria-label="Cerrar panel">✕</button>
            </div>
            <div class="panel-body">
                <div class="panel-section">
                    <h3>Bioma</h3>
                    <p class="biome-name">${biome.name}</p>
                    <p class="biome-desc">${biome.description}</p>
                </div>
                <div class="panel-section">
                    <h3>Coordenadas</h3>
                    <p>X: ${regionData.x}, Y: ${regionData.y}</p>
                    <p>Elevación: ${(regionData.elevation * 100).toFixed(0)}m</p>
                    <p>Humedad: ${(regionData.moisture * 100).toFixed(0)}%</p>
                    <p>Temperatura: ${(regionData.temperature * 100).toFixed(0)}°</p>
                </div>
                <div class="panel-section">
                    <h3>Recursos Naturales</h3>
                    <ul class="resource-list">
                        ${biome.resources.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                ${regionData.creatures && regionData.creatures.length > 0 ? `
                <div class="panel-section">
                    <h3>Criaturas Avistadas</h3>
                    <ul class="creature-list-mini">
                        ${regionData.creatures.map(c => `
                            <li class="creature-link" data-creature-idx="${c.idx}">
                                <span class="rarity-dot" style="background:${c.rarity.color}"></span>
                                ${c.name} <span class="creature-rarity">(${c.rarity.name})</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>` : ''}
                ${regionData.culture ? `
                <div class="panel-section">
                    <h3>Civilización</h3>
                    <p><strong>${regionData.culture.name}</strong> (${regionData.culture.raceType})</p>
                    <p>${regionData.culture.government}</p>
                </div>` : ''}
            </div>
        `;

        this._showPanel(content, 'panel-region');
    }

    /**
     * Mostrar panel de ficha de criatura
     * @param {Object} creature - Datos de la criatura
     */
    showCreaturePanel(creature) {
        const biome = BIOME_DEFS[creature.homeBiome];

        // Generar mutaciones únicas usando CSS filters en base al nombre de la bestia
        const nameHash = Array.from(creature.name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const hueShift = (nameHash * 47) % 360; 
        const flip = nameHash % 2 === 0 ? -1 : 1;
        const contrast = 1 + ((nameHash % 5) * 0.1); // 1.0 a 1.4

        // Mapeo robusto a miles de vectores de la librería Game-Icons (cargan instantáneo, nunca fallan, arte heráldico)
        const bodyIcons = {
            'serpentine': ['sea-serpent', 'cobra'],
            'serpentine_winged': ['dragon-head', 'spiked-dragon-head', 'hydra'],
            'winged_quad': ['griffin-symbol'],
            'winged_humanoid': ['gargoyle', 'angel-wings', 'fairy'],
            'winged': ['bat', 'raven', 'eagle-head'],
            'humanoid': ['minotaur', 'oni', 'golem-head'],
            'quadruped': ['wolf-head', 'fox'],
            'hybrid': ['griffin-symbol', 'minotaur'],
            'reptilian': ['lizardman', 'dragon-head'],
            'arachnid': ['spider-face', 'spider-alt'],
            'shapeshifter': ['fox', 'wolf-head'],
            'amorphous': ['ifrit', 'spectre'],
            'ethereal': ['spectre', 'gargoyle'],
            'cephalopod': ['kraken-tentacle', 'mermaid']
        };

        const iconList = bodyIcons[creature.bodyType] || ['bat'];
        const gameIcon = iconList[nameHash % iconList.length];
        
        // URL a un SVG purista, dibujado con estilo de libro de tinta claro para mejor contraste
        const imageUrl = `https://api.iconify.design/game-icons:${gameIcon}.svg?color=%23e8dcc8`;

        const content = `
            <div class="panel-header">
                <span class="panel-icon">🐉</span>
                <h2 class="panel-title font-medieval">${creature.name}</h2>
                <button class="panel-close" onclick="window.panelManager.closePanel()" aria-label="Cerrar panel">✕</button>
            </div>
            <div class="panel-body">
                <div class="creature-visual">
                    <div class="creature-image-container" style="text-align:center; margin-bottom: 20px; background: rgba(0,0,0,0.1); border-radius: 12px; padding: 10px; overflow: hidden; border: 1px solid var(--gold-dark);">
                        <img src="${imageUrl}" alt="${creature.name}" style="width:200px; height:200px; object-fit:contain; filter: hue-rotate(${hueShift}deg) contrast(${contrast}) drop-shadow(0 0 15px rgba(0,0,0,0.4)); transform: scaleX(${flip}); opacity: 0.9;">
                    </div>
                    <div class="creature-meta">
                        <span class="rarity-badge" style="background:${creature.rarity.color}">${creature.rarity.name}</span>
                        <span class="origin-badge">${creature.origin}</span>
                    </div>
                </div>
                
                <div class="panel-section">
                    <p class="creature-description">${creature.description}</p>
                </div>

                <div class="panel-section creature-stats-section">
                    <h3>Atributos</h3>
                    <canvas class="radar-canvas" width="220" height="220"></canvas>
                </div>

                <div class="panel-section">
                    <h3>Información</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Arquetipo</span>
                            <span class="info-value">${creature.archetype}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Origen</span>
                            <span class="info-value">${creature.origin}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Bioma</span>
                            <span class="info-value">${biome ? biome.name : creature.homeBiome}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Tamaño</span>
                            <span class="info-value">${creature.size}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Dieta</span>
                            <span class="info-value">${creature.diet}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Cuerpo</span>
                            <span class="info-value">${creature.bodyDescription}</span>
                        </div>
                    </div>
                </div>

                <div class="panel-section">
                    <h3>Rasgos</h3>
                    <div class="traits-list">
                        ${creature.traits.map(t => `<span class="trait-tag">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        this._showPanel(content, 'panel-creature');

        // Renderizar SVG de la criatura después de insertar el DOM
        requestAnimationFrame(() => {
            if (!this.activePanel) return;

            // Renderizar radar chart
            const radarCanvas = this.activePanel.querySelector('.radar-canvas');
            if (radarCanvas) {
                const hue = creature.visualTraits.primaryHue;
                const chart = new RadarChart(radarCanvas);
                chart.draw(creature.stats, `hsla(${hue}, 60%, 50%, 0.35)`);
            }
        });
    }

    /**
     * Mostrar panel de civilización
     * @param {Object} culture 
     */
    showCulturePanel(culture) {
        const content = `
            <div class="panel-header">
                <span class="panel-icon">🏛️</span>
                <h2 class="panel-title font-medieval">${culture.name}</h2>
                <button class="panel-close" onclick="window.panelManager.closePanel()" aria-label="Cerrar panel">✕</button>
            </div>
            <div class="panel-body">
                <div class="panel-section">
                    <h3>Raza: ${culture.raceType}</h3>
                    <p>${culture.description}</p>
                </div>
                <div class="panel-section">
                    <h3>Gobierno</h3>
                    <p><strong>${culture.government}</strong> — ${culture.governmentDesc}</p>
                </div>
                <div class="panel-section">
                    <h3>Religión</h3>
                    <p>${culture.religion.description}</p>
                </div>
                <div class="panel-section">
                    <h3>Cultura</h3>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Arte</span><span class="info-value">${culture.culturalTraits.art}</span></div>
                        <div class="info-item"><span class="info-label">Costumbre</span><span class="info-value">${culture.culturalTraits.custom}</span></div>
                        <div class="info-item"><span class="info-label">Valor principal</span><span class="info-value">${culture.culturalTraits.primaryValue}</span></div>
                        <div class="info-item"><span class="info-label">Nivel tecnológico</span><span class="info-value">${culture.techLevel}</span></div>
                        <div class="info-item"><span class="info-label">Población</span><span class="info-value">${culture.population}</span></div>
                        <div class="info-item"><span class="info-label">Territorio</span><span class="info-value">${culture.biomeInfo}</span></div>
                    </div>
                </div>
                <div class="panel-section">
                    <h3>Relaciones Diplomáticas</h3>
                    <ul class="diplomacy-list">
                        ${Object.values(culture.relationships).map(rel => `
                            <li class="diplo-item diplo-${rel.level > 0 ? 'ally' : rel.level < 0 ? 'enemy' : 'neutral'}">
                                <strong>${rel.with}</strong>: ${rel.type}
                                <span class="diplo-desc">${rel.description}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;

        this._showPanel(content, 'panel-culture');
    }

    /**
     * Mostrar panel de economía
     * @param {Object} economy 
     */
    showEconomyPanel(economy) {
        const content = `
            <div class="panel-header">
                <span class="panel-icon">💰</span>
                <h2 class="panel-title font-medieval">Economía del Mundo</h2>
                <button class="panel-close" onclick="window.panelManager.closePanel()" aria-label="Cerrar panel">✕</button>
            </div>
            <div class="panel-body">
                <div class="panel-section">
                    <h3>Resumen</h3>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Civilizaciones</span><span class="info-value">${economy.summary.totalCivilizations}</span></div>
                        <div class="info-item"><span class="info-label">Rutas comerciales</span><span class="info-value">${economy.summary.totalTradeRoutes}</span></div>
                        <div class="info-item"><span class="info-label">Rutas activas</span><span class="info-value">${economy.summary.activeTradeRoutes}</span></div>
                        <div class="info-item"><span class="info-label">Estabilidad</span><span class="info-value">${economy.summary.economicStability}</span></div>
                    </div>
                </div>
                <div class="panel-section">
                    <h3>Rutas Comerciales</h3>
                    <ul class="trade-routes">
                        ${economy.tradeRoutes.map(route => `
                            <li class="trade-route ${route.active ? 'active' : 'inactive'}">
                                <strong>${route.name}</strong>
                                <p>${route.description}</p>
                                <span class="route-danger">Peligro: ${route.danger}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="panel-section">
                    <h3>Monedas</h3>
                    <ul class="currency-list">
                        ${economy.currencies.map(c => `
                            <li><strong>${c.name}</strong>: ${c.description}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;

        this._showPanel(content, 'panel-economy');
    }

    /**
     * Mostrar panel de historia
     * @param {Object} history 
     */
    showHistoryPanel(history) {
        const content = `
            <div class="panel-header">
                <span class="panel-icon">📜</span>
                <h2 class="panel-title font-medieval">Crónicas del Mundo</h2>
                <button class="panel-close" onclick="window.panelManager.closePanel()" aria-label="Cerrar panel">✕</button>
            </div>
            <div class="panel-body">
                <div class="panel-section">
                    <h3>Mito de Creación</h3>
                    <p class="creation-myth">${history.creationMyth}</p>
                </div>
                <div class="panel-section">
                    <p class="world-age">${history.worldAge}</p>
                </div>
                <div class="timeline">
                    ${history.eras.map(era => `
                        <div class="era-block era-${era.mood}">
                            <div class="era-header">
                                <h3 class="font-medieval">${era.name}</h3>
                                <span class="era-duration">${era.duration}</span>
                            </div>
                            <p class="era-desc">${era.description}</p>
                            <ul class="events-list">
                                ${era.events.map(ev => `
                                    <li class="event-item event-${ev.type}">
                                        <span class="event-type-badge">${ev.type}</span>
                                        <p>${ev.description}</p>
                                        <span class="event-significance">${ev.significance}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this._showPanel(content, 'panel-history');
    }

    /**
     * Mostrar panel genérico
     * @private
     */
    _showPanel(htmlContent, className) {
        this.closePanel();
        
        const panel = document.createElement('div');
        panel.className = `floating-panel ${className}`;
        panel.innerHTML = htmlContent;
        
        this.panelContainer.appendChild(panel);
        this.activePanel = panel;

        // Animación de entrada
        requestAnimationFrame(() => {
            panel.classList.add('panel-visible');
        });

        // Agregar listeners a enlaces internos
        panel.querySelectorAll('.creature-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.creatureIdx);
                if (window.worldData && window.worldData.creatures[idx]) {
                    this.showCreaturePanel(window.worldData.creatures[idx]);
                }
            });
        });
    }

    /**
     * Cerrar el panel activo
     */
    closePanel() {
        if (this.activePanel) {
            this.activePanel.classList.remove('panel-visible');
            this.activePanel.classList.add('panel-closing');
            
            const panel = this.activePanel;
            setTimeout(() => {
                panel.remove();
            }, 300);
            
            this.activePanel = null;
        }
    }
}
