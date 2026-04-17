/**
 * main.js - Orquestador Principal de Aetheria
 * 
 * Punto de entrada de la aplicación.
 * Coordina la generación del mundo completo y renderizado.
 * Gestiona:
 *  1. Procesamiento de la semilla
 *  2. Generación de mapas de terreno
 *  3. Cálculo de biomas y ríos
 *  4. Bestiario, civilizaciones, economía, historia
 *  5. Renderizado Canvas con POIs ricos (castillos, criaturas)
 *  6. Interactividad (hover, click, zoom, pan)
 */

import { SeededRNG, hashSeed } from './engine/seed.js';
import { PerlinNoise, generateElevationMap } from './engine/perlin.js';
import { generateMoistureMap, generateTemperatureMap, applyCoastalMoisture } from './engine/noise.js';
import { generateBiomeMap, analyzeBiomeDistribution, BIOME_DEFS, WATER_LEVEL } from './world/biomes.js';
import { NameGenerator } from './world/names.js';
import { generateBestiary, placeCreaturesOnMap } from './world/creatures.js';
import { generateCultures } from './world/cultures.js';
import { generateEconomy } from './world/economy.js';
import { generateHistory } from './world/history.js';
import { MapRenderer } from './render/map-renderer.js';
import { PanelManager } from './ui/panels.js';
import { SeedInput } from './ui/input.js';
import { MapInteractions } from './ui/interactions.js';

// === CONFIGURACIÓN GLOBAL ===
const MAP_WIDTH = 256;
const MAP_HEIGHT = 256;

// === ESTADO GLOBAL ===
let worldData = null;
let mapRenderer = null;
let panelManager = null;
let interactions = null;

/**
 * Inicialización de la aplicación
 */
function init() {
    panelManager = new PanelManager();
    window.panelManager = panelManager;

    new SeedInput(generateWorld);

    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.classList.remove('hidden');

    console.log('🌍 Aetheria - The Seeded World Generator inicializado');
}

/**
 * Genera ríos que fluyen desde montañas al mar (para dibujar en Canvas)
 * @param {Float32Array} elevationMap
 * @param {import('./engine/seed.js').SeededRNG} rng
 * @returns {Array} Lista de ríos (cada uno es un array de {x, y})
 */
function generateRivers(elevationMap, rng) {
    const rivers = [];
    const riverCount = rng.intRange(4, 8);

    for (let r = 0; r < riverCount; r++) {
        let startX, startY, startElev;
        let attempts = 0;
        
        do {
            startX = rng.intRange(20, MAP_WIDTH - 20);
            startY = rng.intRange(20, MAP_HEIGHT - 20);
            startElev = elevationMap[startY * MAP_WIDTH + startX];
            attempts++;
        } while (startElev < 0.6 && attempts < 80);

        if (startElev < 0.5) continue;

        const points = [{ x: startX, y: startY }];
        let cx = startX, cy = startY;

        for (let step = 0; step < 150; step++) {
            const currentElev = elevationMap[cy * MAP_WIDTH + cx];
            if (currentElev < 0.32) break;

            let bestX = cx, bestY = cy, bestElev = currentElev;

            for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
                
                const nElev = elevationMap[ny * MAP_WIDTH + nx] - rng.next() * 0.015;
                if (nElev < bestElev) {
                    bestElev = nElev;
                    bestX = nx;
                    bestY = ny;
                }
            }

            if (bestX === cx && bestY === cy) break;
            cx = bestX;
            cy = bestY;
            points.push({ x: cx, y: cy });
        }

        if (points.length > 12) rivers.push(points);
    }

    return rivers;
}

/**
 * Coloca civilizaciones en el mapa y devuelve POIs de ciudades
 * @param {Array} cultures - Civilizaciones generadas
 * @param {string[]} biomeMap
 * @param {import('./engine/seed.js').SeededRNG} rng
 * @returns {Array} POIs de ciudades/capitales
 */
function placeCulturesOnMap(cultures, biomeMap, rng) {
    const cityPois = [];

    for (const culture of cultures) {
        // Encontrar celdas del bioma de la cultura
        const validCells = [];
        for (let i = 0; i < biomeMap.length; i++) {
            if (biomeMap[i] === culture.homeBiome) {
                validCells.push(i);
            }
        }

        if (validCells.length === 0) continue;

        // Capital de la civilización
        const capitalIdx = rng.pick(validCells);
        const capitalX = capitalIdx % MAP_WIDTH;
        const capitalY = Math.floor(capitalIdx / MAP_WIDTH);

        culture.mapX = capitalX;
        culture.mapY = capitalY;

        // Marcador de capital
        const isImportant = culture.populationScale >= 6;
        cityPois.push({
            x: capitalX,
            y: capitalY,
            type: isImportant ? 'capital' : 'city',
            color: '#ffd700',
            label: culture.name,
            data: culture,
            dataType: 'culture'
        });

        // Ciudades secundarias para civilizaciones grandes
        if (culture.populationScale >= 5 && validCells.length > 50) {
            const numCities = Math.min(3, Math.floor(culture.populationScale / 3));
            for (let c = 0; c < numCities; c++) {
                // Buscar celda alejada de la capital
                let bestCell = rng.pick(validCells);
                let bestDist = 0;
                for (let attempt = 0; attempt < 10; attempt++) {
                    const cellIdx = rng.pick(validCells);
                    const cx = cellIdx % MAP_WIDTH;
                    const cy = Math.floor(cellIdx / MAP_WIDTH);
                    const dist = Math.sqrt((cx - capitalX) ** 2 + (cy - capitalY) ** 2);
                    if (dist > bestDist && dist > 15) {
                        bestDist = dist;
                        bestCell = cellIdx;
                    }
                }
                const cx = bestCell % MAP_WIDTH;
                const cy = Math.floor(bestCell / MAP_WIDTH);
                cityPois.push({
                    x: cx, y: cy,
                    type: 'city',
                    color: '#c9a94f',
                    label: '',
                    data: culture,
                    dataType: 'culture'
                });
            }
        }
    }

    return cityPois;
}

/**
 * Genera un mundo completo a partir de una semilla
 */
function generateWorld(seedText) {
    console.time('⚡ Generación del mundo');
    
    // Ocultar pantalla de bienvenida
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.classList.add('hidden');

    // Ocultar/limpiar overlay SVG (ya no se usa - ríos van en canvas)
    const svgOverlay = document.getElementById('svg-overlay');
    if (svgOverlay) svgOverlay.innerHTML = '';

    // 1. Generador determinístico
    const masterRng = new SeededRNG(seedText);
    
    // Macro-escenarios mundiales (Baja probabilidad de eventos extremos)
    const scenarioRoll = masterRng.next();
    let globalScenario = 'normal'; // 70% normal
    if (scenarioRoll > 0.95) globalScenario = 'ice_age';      // 5% Edad de hielo extrema
    else if (scenarioRoll > 0.90) globalScenario = 'scorched'; // 5% Mundo calcinado
    else if (scenarioRoll > 0.82) globalScenario = 'flooded';  // 8% Mundo inundado
    else if (scenarioRoll > 0.70) globalScenario = 'jungle';   // 12% Mundo hiper-húmedo

    console.log(`🌍 Escenario Global: ${globalScenario}`);
    
    // 2. Mapas de terreno
    console.log('🗺️ Generando terreno...');
    const elevPerlin = new PerlinNoise(masterRng.fork('elevation'));
    const elevationMap = generateElevationMap(elevPerlin, MAP_WIDTH, MAP_HEIGHT, masterRng.fork('elevation_shape'), {
        octaves: 6, persistence: 0.5, lacunarity: 2.0
    });

    // Ajuste de terreno por escenario
    if (globalScenario === 'flooded') {
        for (let i = 0; i < elevationMap.length; i++) elevationMap[i] *= 0.6; // Hundir todo
    }

    const moistureMap = generateMoistureMap(masterRng.fork('moisture'), MAP_WIDTH, MAP_HEIGHT);
    const temperatureMap = generateTemperatureMap(
        masterRng.fork('temperature'), MAP_WIDTH, MAP_HEIGHT, elevationMap
    );
    applyCoastalMoisture(moistureMap, elevationMap, MAP_WIDTH, MAP_HEIGHT, WATER_LEVEL);

    // Ajuste climático por escenario
    for (let i = 0; i < temperatureMap.length; i++) {
        if (globalScenario === 'ice_age') {
            temperatureMap[i] = Math.max(0, temperatureMap[i] - 0.4);
            moistureMap[i] = Math.max(0, moistureMap[i] - 0.2); // El hielo reduce la humedad líquida
        }
        else if (globalScenario === 'scorched') {
            temperatureMap[i] = Math.min(1, temperatureMap[i] + 0.5);
            moistureMap[i] = Math.max(0, moistureMap[i] - 0.4); // Evaporación extrema
        }
        else if (globalScenario === 'jungle') {
            temperatureMap[i] = Math.min(1, temperatureMap[i] + 0.1);
            moistureMap[i] = Math.min(1, moistureMap[i] + 0.4);
        }
    }

    // 3. Biomas
    console.log('🌿 Calculando biomas...');
    const biomeMap = generateBiomeMap(elevationMap, moistureMap, temperatureMap, MAP_WIDTH, MAP_HEIGHT);
    const biomeDistribution = analyzeBiomeDistribution(biomeMap);

    // 4. Ríos (generados aquí, dibujados en canvas)
    console.log('🏞️ Generando ríos...');
    const rivers = generateRivers(elevationMap, masterRng.fork('rivers'));

    // 5. Nombres
    const nameGen = new NameGenerator(masterRng.fork('names'));

    // 6. Bestiario
    console.log('🐉 Generando bestiario...');
    let creatures = generateBestiary(
        masterRng.fork('creatures'), biomeDistribution, nameGen, seedText
    );
    creatures = placeCreaturesOnMap(creatures, biomeMap, MAP_WIDTH, MAP_HEIGHT, masterRng.fork('creature_placement'));

    // 7. Civilizaciones
    console.log('🏛️ Generando civilizaciones...');
    const cultures = generateCultures(
        masterRng.fork('cultures'), biomeDistribution, nameGen, creatures
    );

    // 8. Economía e Historia
    console.log('💰📜 Generando economía e historia...');
    const economy = generateEconomy(masterRng.fork('economy'), biomeDistribution, cultures, nameGen);
    const history = generateHistory(masterRng.fork('history'), cultures, creatures, nameGen);

    // Guardar datos globales
    worldData = {
        seed: seedText,
        seedHash: hashSeed(seedText),
        maps: { elevation: elevationMap, moisture: moistureMap, temperature: temperatureMap },
        biomeMap, biomeDistribution,
        rivers,
        creatures, cultures, economy, history,
        worldName: nameGen.placeName()
    };
    window.worldData = worldData;

    // Actualizar título
    const worldNameEl = document.getElementById('world-name');
    if (worldNameEl) worldNameEl.textContent = worldData.worldName;

    // 9. Renderizar
    console.log('🎨 Renderizando mapa...');
    renderWorld(worldData);

    console.timeEnd('⚡ Generación del mundo');
    console.log(`✅ Mundo "${worldData.worldName}" generado: ${creatures.length} criaturas, ${cultures.length} civilizaciones, ${history.eras.length} eras`);
}

/**
 * Renderiza el mundo en el canvas
 */
function renderWorld(data) {
    const canvas = document.getElementById('map-canvas');

    if (!mapRenderer) {
        mapRenderer = new MapRenderer(canvas, MAP_WIDTH, MAP_HEIGHT);
        mapRenderer.resize();
    }

    // Datos del mundo
    mapRenderer.setWorldData(data.biomeMap, data.maps.elevation);

    // Ríos (se dibujan en el canvas, siguen zoom/pan)
    mapRenderer.setRivers(data.rivers);

    // Rutas comerciales animadas
    mapRenderer.setTradeRoutes(data.economy.tradeRoutes, data.cultures);

    // Crear POIs
    const pois = [];

    // POIs de criaturas
    data.creatures.forEach((creature, idx) => {
        pois.push({
            x: creature.mapX,
            y: creature.mapY,
            type: 'creature',
            color: creature.rarity.color,
            label: creature.name,
            data: { ...creature, idx },
            dataType: 'creature'
        });
    });

    // POIs de civilizaciones (castillos)
    const cityPois = placeCulturesOnMap(
        data.cultures, data.biomeMap,
        new SeededRNG(data.seed + '_cities')
    );
    pois.push(...cityPois);

    mapRenderer.setPOIs(pois);
    mapRenderer.renderBaseMap();

    // Interacciones
    if (interactions) interactions.stopRenderLoop();
    interactions = new MapInteractions(
        canvas, mapRenderer,
        handleRegionHover,
        handleRegionClick
    );

    updateSidebar(data);
    interactions.requestRender();
}

/**
 * Hover sobre el mapa
 */
function handleRegionHover(x, y) {
    if (!worldData) return;
    
    const idx = y * MAP_WIDTH + x;
    const biomeId = worldData.biomeMap[idx];
    const biome = BIOME_DEFS[biomeId];
    
    const coordsEl = document.getElementById('coords-info');
    if (coordsEl && biome) {
        coordsEl.textContent = `${biome.icon} ${biome.name} | X:${x} Y:${y} | Elev: ${(worldData.maps.elevation[idx] * 100).toFixed(0)}m`;
    }
}

/**
 * Click en el mapa
 */
function handleRegionClick(x, y) {
    if (!worldData) return;

    const idx = y * MAP_WIDTH + x;
    const biomeId = worldData.biomeMap[idx];

    // Buscar criatura cercana (radio 10)
    const nearCreature = worldData.creatures.find(c => {
        const dist = Math.sqrt((c.mapX - x) ** 2 + (c.mapY - y) ** 2);
        return dist < 10;
    });

    if (nearCreature) {
        panelManager.showCreaturePanel(nearCreature);
        return;
    }

    // Buscar civilización cercana (radio 10)
    const nearCulture = worldData.cultures.find(c => {
        if (!c.mapX) return false;
        const dist = Math.sqrt((c.mapX - x) ** 2 + (c.mapY - y) ** 2);
        return dist < 10;
    });

    if (nearCulture) {
        panelManager.showCulturePanel(nearCulture);
        return;
    }

    // Panel de región
    const creaturesInBiome = worldData.creatures
        .map((c, idx) => ({ ...c, idx }))
        .filter(c => c.homeBiome === biomeId);
    const cultureInBiome = worldData.cultures.find(c => c.homeBiome === biomeId);

    panelManager.showRegionPanel({
        biomeId, x, y,
        elevation: worldData.maps.elevation[idx],
        moisture: worldData.maps.moisture[idx],
        temperature: worldData.maps.temperature[idx],
        creatures: creaturesInBiome,
        culture: cultureInBiome
    });
}

/**
 * Actualizar sidebar con datos del mundo
 */
function updateSidebar(data) {
    const bestiaryList = document.getElementById('bestiary-list');
    if (bestiaryList) {
        bestiaryList.innerHTML = data.creatures.map((c, idx) => `
            <li class="sidebar-list-item" data-idx="${idx}" data-type="creature">
                <span class="rarity-dot" style="background:${c.rarity.color}"></span>
                <span>${c.name}</span>
                <span class="text-muted" style="font-size:var(--fs-xs);margin-left:auto;">${c.rarity.name}</span>
            </li>
        `).join('');
    }

    const culturesList = document.getElementById('cultures-list');
    if (culturesList) {
        culturesList.innerHTML = data.cultures.map((c, idx) => `
            <li class="sidebar-list-item" data-idx="${idx}" data-type="culture">
                <span>🏛️</span>
                <span>${c.name}</span>
                <span class="text-muted" style="font-size:var(--fs-xs);margin-left:auto;">${c.raceType}</span>
            </li>
        `).join('');
    }

    // Click events
    document.querySelectorAll('.sidebar-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.idx);
            const type = item.dataset.type;
            
            if (type === 'creature' && data.creatures[idx]) {
                panelManager.showCreaturePanel(data.creatures[idx]);
            } else if (type === 'culture' && data.cultures[idx]) {
                panelManager.showCulturePanel(data.cultures[idx]);
            }
        });
    });

    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('visible');
}

// === EVENTOS GLOBALES ===
document.addEventListener('DOMContentLoaded', () => {
    init();

    document.getElementById('btn-bestiary')?.addEventListener('click', () => toggleSidebarTab('bestiary'));
    document.getElementById('btn-cultures')?.addEventListener('click', () => toggleSidebarTab('cultures'));
    document.getElementById('btn-economy')?.addEventListener('click', () => {
        if (worldData) panelManager.showEconomyPanel(worldData.economy);
    });
    document.getElementById('btn-history')?.addEventListener('click', () => {
        if (worldData) panelManager.showHistoryPanel(worldData.history);
    });
    document.getElementById('btn-reset-view')?.addEventListener('click', () => {
        if (mapRenderer) {
            mapRenderer.resetView();
            if (interactions) interactions.requestRender();
        }
    });
});

function toggleSidebarTab(tab) {
    const sidebar = document.getElementById('sidebar');
    const bestiaryTab = document.getElementById('sidebar-bestiary');
    const culturesTab = document.getElementById('sidebar-cultures');
    if (!sidebar || !bestiaryTab || !culturesTab) return;

    if (sidebar.classList.contains('visible') && sidebar.dataset.activeTab === tab) {
        sidebar.classList.remove('visible');
        return;
    }

    sidebar.classList.add('visible');
    sidebar.dataset.activeTab = tab;
    bestiaryTab.style.display = tab === 'bestiary' ? 'block' : 'none';
    culturesTab.style.display = tab === 'cultures' ? 'block' : 'none';
}
