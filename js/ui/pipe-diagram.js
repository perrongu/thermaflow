/**
 * pipe-diagram.js
 *
 * Module de visualisation SVG - Vue isométrique d'un tuyau cylindrique horizontal
 */

(function () {
  'use strict';

  // ========== CONFIGURATION ==========
  const SVG_WIDTH = 900;
  const SVG_HEIGHT = 350;

  // ViewBox offset calculé pour éliminer l'espace vide en haut
  // Formule: PIPE_CENTER_Y - PIPE_RADIUS - LENGTH_DIM_OFFSET - marge(30px)
  // = 250 - 50 - 20 - 30 = 150, ajusté à 110 pour garder le bloc EAU visible
  const SVG_VIEWBOX_Y_OFFSET = 110;

  // Position centrale du tuyau (coordonnées absolues dans le canvas SVG)
  const PIPE_CENTER_X = 450;
  const PIPE_CENTER_Y = 250;
  const PIPE_LENGTH = 350;
  const PIPE_RADIUS = 50;
  const PIPE_DEPTH = 15;
  const WALL_THICKNESS = 8;

  // Marges et espacements
  const INSULATION_THICKNESS = 15; // Épaisseur visuelle de l'isolation
  const LENGTH_DIM_OFFSET = 20; // Distance de la ligne de cote de longueur au-dessus du tuyau
  const WATER_BLOCK_OFFSET_X = 200; // Distance du bloc EAU à gauche du tuyau
  const AIR_BLOCK_OFFSET_Y = 15; // Distance du bloc AIR sous le tuyau
  // const DIMENSION_EXTENSION = 10; // Longueur des extensions de cote (non utilisé)
  // const DIMENSION_OFFSET = 35; // Distance des cotes de dimension de la pièce (non utilisé)

  // Couleurs
  const COLOR_PIPE = '#1e3a8a';
  const COLOR_WATER = '#3b82f6';
  const COLOR_INSULATION = '#d1d5db';
  const COLOR_DIMENSION = '#374151';
  const COLOR_TEXT = '#111827';
  const COLOR_ARROW = '#f97316';

  // ========== ÉTAT ==========
  let svgElement = null;
  let currentSpecs = null;

  // ========== INITIALISATION ==========
  /**
   * Initialise le module de diagramme de tuyauterie
   * Crée l'élément SVG et l'attache au container DOM
   *
   * @returns {void}
   * @throws {Error} Si le container n'est pas trouvé
   */
  function init() {
    const container = document.getElementById('pipe-diagram-container');
    if (!container) {
      console.error('❌ Container #pipe-diagram-container non trouvé');
      return;
    }

    // Créer l'élément SVG avec viewBox décalée pour éliminer l'espace vide en haut
    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('id', 'pipe-diagram');
    svgElement.setAttribute('viewBox', `0 ${SVG_VIEWBOX_Y_OFFSET} ${SVG_WIDTH} ${SVG_HEIGHT}`);
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    container.appendChild(svgElement);
  }

  // ========== MISE À JOUR ==========
  /**
   * Met à jour le diagramme avec de nouvelles spécifications de tuyau
   *
   * @param {Object} specs - Spécifications du tuyau
   * @param {number} specs.OD - Diamètre extérieur [mm]
   * @param {number} specs.ID - Diamètre intérieur [mm]
   * @param {number} specs.WT - Épaisseur de paroi [mm]
   * @returns {void}
   */
  function update(specs) {
    if (!svgElement) {
      console.error('❌ SVG non initialisé');
      return;
    }

    if (
      !specs ||
      typeof specs.OD !== 'number' ||
      typeof specs.ID !== 'number' ||
      typeof specs.WT !== 'number'
    ) {
      console.error('❌ Spécifications invalides:', specs);
      return;
    }

    currentSpecs = specs;

    // Effacer le contenu existant
    svgElement.innerHTML = '';

    // Dessiner la vue isométrique
    drawIsometricPipe(specs);
  }

  // ========== VUE ISOMÉTRIQUE DU TUYAU ==========
  function drawIsometricPipe(specs) {
    // Variables destructurées mais non utilisées directement dans cette fonction
    // (specs est passé à drawOpenEndSection)
    // const { OD, ID, WT } = specs;

    const g = createSVGElement('g');

    // Coordonnées du tuyau
    const leftX = PIPE_CENTER_X - PIPE_LENGTH / 2;
    const rightX = PIPE_CENTER_X + PIPE_LENGTH / 2;
    const centerY = PIPE_CENTER_Y;

    // 1. Isolation (couche extérieure, grisée) - seulement si activée
    const hasInsulation = document.getElementById('has-insulation')?.checked || false;
    if (hasInsulation) {
      drawOpenCylinder(
        g,
        leftX,
        rightX,
        centerY,
        PIPE_RADIUS + INSULATION_THICKNESS,
        PIPE_DEPTH + 5,
        COLOR_INSULATION,
        3,
        'none',
        0.5
      );
    }

    // 2. Corps du tuyau (paroi) - ouvert à droite
    drawOpenCylinder(g, leftX, rightX, centerY, PIPE_RADIUS, PIPE_DEPTH, COLOR_PIPE, 4, 'none', 1);

    // 3. Intérieur (eau)
    const innerRadius = PIPE_RADIUS - WALL_THICKNESS;
    drawOpenCylinder(
      g,
      leftX + 10,
      rightX,
      centerY,
      innerRadius,
      PIPE_DEPTH - 3,
      COLOR_WATER,
      2,
      'none',
      0.3,
      true
    );

    // 4. Tranche droite ouverte avec dimensions OD, ID, WT
    drawOpenEndSection(g, specs, rightX, centerY);

    // 5. Cote de longueur en haut
    drawLengthDimension(g, leftX, rightX, centerY);

    // 6. Bloc EAU à gauche (au-dessus des cotes)
    drawWaterBlock(g, leftX, centerY);

    // 7. Bloc AIR en bas (au-dessus des cotes, mais ne chevauche plus)
    drawAirBlock(g, rightX, centerY);

    svgElement.appendChild(g);
  }

  // ========== DESSIN D'UN CYLINDRE OUVERT (sans ellipse droite) ==========
  function drawOpenCylinder(
    parent,
    leftX,
    rightX,
    centerY,
    radius,
    depth,
    color,
    strokeWidth,
    dashArray,
    opacity,
    isFill = false
  ) {
    // Ellipse gauche (entrée)
    const leftEllipse = createSVGElement('ellipse', {
      cx: leftX,
      cy: centerY,
      rx: depth,
      ry: radius,
      fill: isFill ? color : 'none',
      stroke: color,
      'stroke-width': strokeWidth,
      'stroke-dasharray': dashArray,
      opacity: opacity,
    });
    parent.appendChild(leftEllipse);

    // Corps (rectangle)
    const body = createSVGElement('rect', {
      x: leftX,
      y: centerY - radius,
      width: rightX - leftX,
      height: radius * 2,
      fill: isFill ? color : 'none',
      stroke: 'none',
      opacity: opacity,
    });
    parent.appendChild(body);

    // Lignes supérieure et inférieure
    const topLine = createSVGElement('line', {
      x1: leftX,
      y1: centerY - radius,
      x2: rightX,
      y2: centerY - radius,
      stroke: color,
      'stroke-width': strokeWidth,
      'stroke-dasharray': dashArray,
      opacity: opacity,
    });
    parent.appendChild(topLine);

    const bottomLine = createSVGElement('line', {
      x1: leftX,
      y1: centerY + radius,
      x2: rightX,
      y2: centerY + radius,
      stroke: color,
      'stroke-width': strokeWidth,
      'stroke-dasharray': dashArray,
      opacity: opacity,
    });
    parent.appendChild(bottomLine);

    // PAS d'ellipse droite - le tube est ouvert
  }

  // ========== TRANCHE DROITE OUVERTE ==========
  function drawOpenEndSection(parent, specs, rightX, centerY) {
    const { OD, ID, WT } = specs;

    // Cercle extérieur (OD)
    const outerCircle = createSVGElement('circle', {
      cx: rightX,
      cy: centerY,
      r: PIPE_RADIUS,
      fill: 'none',
      stroke: COLOR_PIPE,
      'stroke-width': 3,
    });
    parent.appendChild(outerCircle);

    // Cercle intérieur (ID)
    const innerRadius = PIPE_RADIUS - WALL_THICKNESS;
    const innerCircle = createSVGElement('circle', {
      cx: rightX,
      cy: centerY,
      r: innerRadius,
      fill: COLOR_WATER,
      opacity: 0.3,
      stroke: COLOR_PIPE,
      'stroke-width': 2,
    });
    parent.appendChild(innerCircle);

    // Dimensions sur la tranche (bonnes pratiques)
    // OD - cote verticale à droite avec extensions hors pièce et label décalé
    const odX = rightX + 70;
    drawReferenceLine(parent, rightX, centerY - PIPE_RADIUS, odX - 10, centerY - PIPE_RADIUS); // extension haut
    drawReferenceLine(parent, rightX, centerY + PIPE_RADIUS, odX - 10, centerY + PIPE_RADIUS); // extension bas
    drawDimensionLine(parent, odX, centerY - PIPE_RADIUS, odX, centerY + PIPE_RADIUS, '', true);
    const odText = createSVGElement('text', {
      x: odX + 40,
      y: centerY,
      'text-anchor': 'start',
      fill: COLOR_TEXT,
      'font-size': 11,
      'font-weight': 'bold',
      'font-family': 'sans-serif',
    });
    odText.textContent = `OD = ${OD.toFixed(1)} mm`;
    parent.appendChild(odText);

    // ID - cote horizontale sous la pièce, label au milieu au-dessus
    const idY = centerY + innerRadius + 40;
    drawReferenceLine(parent, rightX - innerRadius, centerY, rightX - innerRadius, idY - 8);
    drawReferenceLine(parent, rightX + innerRadius, centerY, rightX + innerRadius, idY - 8);
    drawDimensionLine(parent, rightX - innerRadius, idY, rightX + innerRadius, idY, '', false);
    const idText = createSVGElement('text', {
      x: rightX,
      y: idY - 10,
      'text-anchor': 'middle',
      fill: COLOR_TEXT,
      'font-size': 11,
      'font-weight': 'bold',
      'font-family': 'sans-serif',
    });
    idText.textContent = `ID = ${ID.toFixed(1)} mm`;
    parent.appendChild(idText);

    // WT - cote sur le haut de la tranche avec extensions en pointillés
    const wtX = rightX + 35; // position de la ligne de cote
    const wtOuterY = centerY - PIPE_RADIUS; // surface extérieure en haut
    const wtInnerY = centerY - innerRadius; // surface intérieure en haut

    // Extensions en pointillés depuis la tranche
    drawReferenceLine(parent, rightX, wtOuterY, wtX - 8, wtOuterY);
    drawReferenceLine(parent, rightX, wtInnerY, wtX - 8, wtInnerY);

    // Ligne de cote verticale
    drawDimensionLine(parent, wtX, wtOuterY, wtX, wtInnerY, '', true);

    // Label WT décalé et positionné plus haut pour éviter chevauchement avec OD
    const wtText = createSVGElement('text', {
      x: wtX + 25,
      y: wtOuterY - 5,
      'text-anchor': 'start',
      'dominant-baseline': 'bottom',
      fill: COLOR_TEXT,
      'font-size': 11,
      'font-weight': 'bold',
      'font-family': 'sans-serif',
    });
    wtText.textContent = `WT = ${WT.toFixed(2)} mm`;
    parent.appendChild(wtText);
  }

  // ========== COTE DE LONGUEUR ==========
  /**
   * Dessine la ligne de cote pour la longueur du tuyau avec input intégré
   *
   * @param {SVGElement} parent - Élément SVG parent
   * @param {number} leftX - Coordonnée x gauche du tuyau
   * @param {number} rightX - Coordonnée x droite du tuyau
   * @param {number} centerY - Coordonnée y centrale du tuyau
   * @returns {void}
   */
  function drawLengthDimension(parent, leftX, rightX, centerY) {
    const dimY = centerY - PIPE_RADIUS - LENGTH_DIM_OFFSET;

    // Ligne de cote
    drawDimensionLine(
      parent,
      leftX,
      dimY,
      rightX,
      dimY,
      '', // Pas de label fixe
      false
    );

    // Lignes de référence
    drawReferenceLine(parent, leftX, centerY - PIPE_RADIUS, leftX, dimY);
    drawReferenceLine(parent, rightX, centerY - PIPE_RADIUS, rightX, dimY);

    // foreignObject pour input de longueur
    const foreign = createSVGElement('foreignObject', {
      x: (leftX + rightX) / 2 - 60,
      y: dimY - 35,
      width: 120,
      height: 30,
    });

    foreign.innerHTML = `
        <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; gap: 5px; font-family: sans-serif;">
          <label style="font-size: 11px; color: ${COLOR_TEXT}; white-space: nowrap;">L =</label>
          <input type="number" id="pipe-length" min="1" max="2500" step="1" value="300" required
               style="width: 70px; padding: 3px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px; text-align: center;">
        <span style="font-size: 11px; color: ${COLOR_TEXT};">m</span>
      </div>
    `;
    parent.appendChild(foreign);
  }

  // ========== LIGNE DE RÉFÉRENCE ==========
  function drawReferenceLine(parent, x1, y1, x2, y2) {
    const line = createSVGElement('line', {
      x1,
      y1,
      x2,
      y2,
      stroke: COLOR_DIMENSION,
      'stroke-width': 1,
      'stroke-dasharray': '3,3',
      opacity: 0.5,
    });
    parent.appendChild(line);
  }

  // ========== BLOC EAU (GAUCHE) ==========
  /**
   * Dessine le bloc de paramètres d'eau avec inputs intégrés
   *
   * @param {SVGElement} parent - Élément SVG parent
   * @param {number} leftX - Coordonnée x gauche du tuyau
   * @param {number} centerY - Coordonnée y centrale du tuyau
   * @returns {void}
   */
  function drawWaterBlock(parent, leftX, centerY) {
    const blockX = leftX - WATER_BLOCK_OFFSET_X;
    const blockY = centerY - 90;

    // Dimensions calculées précisément pour 3 champs
    // Chaque champ: label (13px) + input (26px) + margin-bottom (5px) = 44px
    // 3 champs = 132px + padding-top (2px) + padding-bottom (8px) = 142px
    const contentHeight = 142;
    const bgHeight = 30 + contentHeight + 10; // titre + contenu + padding bas

    // Rectangle de fond
    const bg = createSVGElement('rect', {
      x: blockX,
      y: blockY,
      width: 160,
      height: bgHeight,
      fill: '#f0f9ff',
      stroke: COLOR_PIPE,
      'stroke-width': 2,
      rx: 5,
    });
    parent.appendChild(bg);

    // Titre "EAU"
    const title = createSVGElement('text', {
      x: blockX + 80,
      y: blockY + 22,
      'text-anchor': 'middle',
      fill: COLOR_TEXT,
      'font-size': 16,
      'font-weight': 'bold',
      'font-family': 'sans-serif',
    });
    title.textContent = window.I18n ? I18n.t('diagram.water') : 'EAU';
    parent.appendChild(title);

    // foreignObject pour les inputs HTML
    const foreign = createSVGElement('foreignObject', {
      x: blockX + 10,
      y: blockY + 30,
      width: 140,
      height: contentHeight,
    });

    const tempLabel = window.I18n ? I18n.t('diagram.temperature') : 'Température (°C):';

    // Labels dynamiques avec unités
    const pressureUnit = window.UnitConverter
      ? UnitConverter.getUnitInfo('pressure').label
      : 'kPag';
    const flowUnit = window.UnitConverter ? UnitConverter.getUnitInfo('flowRate').label : 'm³/h';
    const pressureLabel = (
      window.I18n ? I18n.t('diagram.pressure') : `Pression (${pressureUnit}):`
    ).replace('kPag', pressureUnit);
    const flowLabel = (window.I18n ? I18n.t('diagram.flowRate') : `Débit (${flowUnit}):`)
      .replace('m³/hr', flowUnit)
      .replace('m³/h', flowUnit);

    foreign.innerHTML = `
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif; padding-top: 2px; padding-bottom: 8px;">
        <div style="margin-bottom: 5px;">
          <label style="display: block; font-size: 10px; color: ${COLOR_TEXT}; margin-bottom: 2px;">${tempLabel}</label>
          <input type="number" id="water-temp" min="1" max="100" step="1" value="10" required
                 style="width: 100%; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 5px;">
          <label style="display: block; font-size: 10px; color: ${COLOR_TEXT}; margin-bottom: 2px;">${pressureLabel}</label>
          <div style="display: flex; gap: 4px; align-items: center;">
            <input type="number" id="water-pressure" min="100" max="1000" step="10" value="300" required
                   style="width: 70px; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px; box-sizing: border-box;">
            <select id="pressure-unit" style="width: 60px; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px; box-sizing: border-box; flex-shrink: 0;">
              <option value="kPag">kPag</option>
              <option value="psig">psig</option>
            </select>
          </div>
        </div>
        <div>
          <label style="display: block; font-size: 10px; color: ${COLOR_TEXT}; margin-bottom: 2px;">${flowLabel}</label>
          <div style="display: flex; gap: 4px; align-items: center;">
            <input type="number" id="water-flow" min="0.1" max="6000" step="0.1" value="7.2" required
                   style="width: 60px; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px; box-sizing: border-box;">
            <select id="flow-unit" style="width: 70px; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 11px; box-sizing: border-box; flex-shrink: 0;">
              <option value="m3_h">m³/h</option>
              <option value="usgpm">USGPM</option>
            </select>
          </div>
        </div>
      </div>
    `;
    parent.appendChild(foreign);

    // Flèche orange vers le tuyau
    const arrowStartX = blockX + 160;
    const arrowEndX = leftX - 20;
    const arrowY = centerY;

    // Ligne
    const arrowLine = createSVGElement('line', {
      x1: arrowStartX,
      y1: arrowY,
      x2: arrowEndX,
      y2: arrowY,
      stroke: COLOR_ARROW,
      'stroke-width': 3,
    });
    parent.appendChild(arrowLine);

    // Tête de flèche
    const arrowHead = createSVGElement('polygon', {
      points: `${arrowEndX},${arrowY} ${arrowEndX - 10},${arrowY - 6} ${arrowEndX - 10},${arrowY + 6}`,
      fill: COLOR_ARROW,
    });
    parent.appendChild(arrowHead);
  }

  // ========== BLOC AIR (BAS CENTRE) ==========
  /**
   * Dessine le bloc de paramètres d'air avec inputs intégrés
   *
   * @param {SVGElement} parent - Élément SVG parent
   * @param {number} rightX - Coordonnée x droite du tuyau (non utilisée, gardée pour signature cohérente)
   * @param {number} centerY - Coordonnée y centrale du tuyau
   * @returns {void}
   */
  function drawAirBlock(parent, rightX, centerY) {
    const blockWidth = 180;
    const blockX = PIPE_CENTER_X - blockWidth / 2;
    const blockY = centerY + PIPE_RADIUS + AIR_BLOCK_OFFSET_Y;

    // Dimensions calculées précisément pour 2 champs
    // Chaque champ: label (13px) + input (26px) + margin-bottom (5px) = 44px
    // 2 champs = 88px + padding-top (2px) + padding-bottom (8px) = 98px
    const contentHeight = 98;
    const bgHeight = 30 + contentHeight + 10; // titre + contenu + padding bas

    // Rectangle de fond
    const bg = createSVGElement('rect', {
      x: blockX,
      y: blockY,
      width: blockWidth,
      height: bgHeight,
      fill: '#f0fdf4',
      stroke: '#16a34a',
      'stroke-width': 2,
      rx: 5,
    });
    parent.appendChild(bg);

    // Titre "AIR"
    const title = createSVGElement('text', {
      x: blockX + blockWidth / 2,
      y: blockY + 22,
      'text-anchor': 'middle',
      fill: COLOR_TEXT,
      'font-size': 16,
      'font-weight': 'bold',
      'font-family': 'sans-serif',
    });
    title.textContent = window.I18n ? I18n.t('diagram.air') : 'AIR';
    parent.appendChild(title);

    // foreignObject pour les inputs HTML
    const foreign = createSVGElement('foreignObject', {
      x: blockX + 10,
      y: blockY + 30,
      width: blockWidth - 20,
      height: contentHeight,
    });

    const airTempLabel = window.I18n ? I18n.t('diagram.temperature') : 'Température (°C):';
    const windLabel = window.I18n ? I18n.t('diagram.windSpeed') : 'Vitesse du vent (km/h):';

    foreign.innerHTML = `
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif; padding-top: 2px; padding-bottom: 8px;">
        <div style="margin-bottom: 5px;">
          <label style="display: block; font-size: 10px; color: ${COLOR_TEXT}; margin-bottom: 2px;">${airTempLabel}</label>
          <input type="number" id="air-temp" min="-50" max="30" step="1" value="-27" required
                 style="width: 100%; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px; box-sizing: border-box;">
        </div>
        <div>
          <label style="display: block; font-size: 10px; color: ${COLOR_TEXT}; margin-bottom: 2px;">${windLabel}</label>
          <input type="number" id="wind-speed" min="0" max="108" step="1" value="18" required
                 style="width: 100%; padding: 4px; border: 1px solid #d1d5db; border-radius: 3px; font-size: 12px; box-sizing: border-box;">
        </div>
      </div>
    `;
    parent.appendChild(foreign);

    // Flèche orange verticale vers le tuyau
    const arrowStartX = blockX + blockWidth / 2; // centre du bloc
    const arrowStartY = blockY - 8;
    const arrowEndX = PIPE_CENTER_X;
    const arrowEndY = centerY + PIPE_RADIUS; // vers le bas du tuyau

    // Ligne
    const arrowLine = createSVGElement('line', {
      x1: arrowStartX,
      y1: arrowStartY,
      x2: arrowEndX,
      y2: arrowEndY,
      stroke: COLOR_ARROW,
      'stroke-width': 3,
    });
    parent.appendChild(arrowLine);

    // Tête de flèche - calculer l'angle réel de la ligne
    const dx = arrowEndX - arrowStartX;
    const dy = arrowEndY - arrowStartY;
    const angle = Math.atan2(dy, dx); // angle de la direction de la flèche
    const arrowSize = 10;

    // Créer les deux points de base du triangle (perpendiculaires à la direction)
    const angle1 = angle + Math.PI - 0.4; // ~140°
    const angle2 = angle + Math.PI + 0.4; // ~220°

    const arrowHead = createSVGElement('polygon', {
      points: `${arrowEndX},${arrowEndY} ${arrowEndX + arrowSize * Math.cos(angle1)},${arrowEndY + arrowSize * Math.sin(angle1)} ${arrowEndX + arrowSize * Math.cos(angle2)},${arrowEndY + arrowSize * Math.sin(angle2)}`,
      fill: COLOR_ARROW,
    });
    parent.appendChild(arrowHead);
  }

  // ========== LIGNE DE DIMENSION ==========
  /**
   * Dessine une ligne de cote avec flèches d'extrémité
   *
   * @param {SVGElement} parent - Élément SVG parent
   * @param {number} x1 - Coordonnée x du point de départ
   * @param {number} y1 - Coordonnée y du point de départ
   * @param {number} x2 - Coordonnée x du point d'arrivée
   * @param {number} y2 - Coordonnée y du point d'arrivée
   * @param {string} label - Texte de la cote (optionnel)
   * @param {boolean} isVertical - true si la cote est verticale
   * @returns {void}
   */
  function drawDimensionLine(parent, x1, y1, x2, y2, label, isVertical) {
    // Ligne principale
    const line = createSVGElement('line', {
      x1,
      y1,
      x2,
      y2,
      stroke: COLOR_DIMENSION,
      'stroke-width': 1.5,
    });
    parent.appendChild(line);

    // Barres d'extrémité
    const barSize = 6;
    if (isVertical) {
      // Barre haut
      const bar1 = createSVGElement('line', {
        x1: x1 - barSize,
        y1: y1,
        x2: x1 + barSize,
        y2: y1,
        stroke: COLOR_DIMENSION,
        'stroke-width': 1.5,
      });
      parent.appendChild(bar1);

      // Barre bas
      const bar2 = createSVGElement('line', {
        x1: x2 - barSize,
        y1: y2,
        x2: x2 + barSize,
        y2: y2,
        stroke: COLOR_DIMENSION,
        'stroke-width': 1.5,
      });
      parent.appendChild(bar2);
    } else {
      // Barre gauche
      const bar1 = createSVGElement('line', {
        x1: x1,
        y1: y1 - barSize,
        x2: x1,
        y2: y1 + barSize,
        stroke: COLOR_DIMENSION,
        'stroke-width': 1.5,
      });
      parent.appendChild(bar1);

      // Barre droite
      const bar2 = createSVGElement('line', {
        x1: x2,
        y1: y2 - barSize,
        x2: x2,
        y2: y2 + barSize,
        stroke: COLOR_DIMENSION,
        'stroke-width': 1.5,
      });
      parent.appendChild(bar2);
    }

    // Label
    const text = createSVGElement('text', {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: COLOR_TEXT,
      'font-size': 11,
      'font-weight': 'bold',
      'font-family': 'sans-serif',
    });

    if (isVertical) {
      text.setAttribute('x', (x1 + x2) / 2 + 25);
    } else {
      text.setAttribute('y', (y1 + y2) / 2 - 10);
    }

    text.textContent = label;
    parent.appendChild(text);
  }

  // ========== UTILITAIRES SVG ==========
  function createSVGElement(type, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', type);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  }

  // ========== LISTENER CHANGEMENT DE LANGUE ==========
  document.addEventListener('thermaflow:language-changed', function (_event) {
    try {
      if (currentSpecs) {
        update(currentSpecs);
      } else {
        console.warn('⚠️ PipeDiagram: pas de specs à régénérer (currentSpecs est null)');
      }
    } catch (err) {
      console.error('❌ PipeDiagram: erreur dans listener language-changed:', err);
    }
  });

  // ========== API PUBLIQUE ==========
  window.PipeDiagram = {
    init,
    update,
  };

  // Export conditionnel pour tests Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init, update };
  }
})();
