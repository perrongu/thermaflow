/**
 * temperature-chart.js
 *
 * Graphique du profil de température T(x) avec Canvas natif
 *
 * Affiche:
 * - Courbe T(x)
 * - Trois zones de risque (vert/jaune/rouge)
 * - Lignes horizontales à 0°C (gel) et temperatureGel (marge)
 * - Grille et axes
 */

(function () {
  'use strict';

  // ========== CONSTANTES ==========
  const MARGE_SURETE_GEL = 5; // °C

  // ========== CONFIGURATION ==========
  const config = {
    padding: { top: 40, right: 40, bottom: 60, left: 80 },
    colors: {
      line: '#2563eb',
      freezeLine: '#dc2626',
      marginLine: '#f59e0b',
      dangerZone: 'rgba(220, 38, 38, 0.1)',
      grid: '#e5e7eb',
      axis: '#374151',
      text: '#6b7280',
      // Zones de risque
      zoneGreen: '#DFFFD6',
      zoneYellow: '#FFF4CC',
      zoneRed: '#FFD6D6',
    },
    lineWidth: 3,
    gridLineWidth: 1,
    fontSize: 12,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  // ========== FONCTION PRINCIPALE ==========
  /**
   * Dessine le graphique de température
   *
   * @param {Array<number>} x_profile - Positions [m]
   * @param {Array<number>} T_profile - Températures [°C]
   * @param {number} T_freeze - Température de gel [°C]
   * @param {number} margeSurete - Marge de sécurité [°C]
   */
  function drawChart(x_profile, T_profile, T_freeze = 0, margeSurete = MARGE_SURETE_GEL) {
    const canvas = document.getElementById('temperature-chart');
    if (!canvas) {
      console.error('Canvas temperature-chart non trouvé');
      return;
    }

    const ctx = canvas.getContext('2d');

    // Redimensionner canvas à la taille du container
    resizeCanvas(canvas);

    // Effacer
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculer température seuil (avec marge)
    const temperatureGel = T_freeze + margeSurete;

    // Calculer les échelles
    const scales = calculateScales(x_profile, T_profile, T_freeze, temperatureGel, canvas);

    // Dessiner les éléments (ordre important pour z-index)
    drawRiskZones(ctx, scales, T_freeze, temperatureGel);
    drawGrid(ctx, scales);
    drawAxes(ctx, scales);
    drawFreezeLine(ctx, scales, T_freeze);
    drawMarginLine(ctx, scales, temperatureGel);
    drawTemperatureCurve(ctx, scales, x_profile, T_profile);
    drawLabels(ctx, scales);

    console.log('📊 Graphique T(x) dessiné avec zones de risque');
  }

  // ========== REDIMENSIONNEMENT CANVAS ==========
  function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();

    // Utiliser devicePixelRatio pour netteté sur écrans haute résolution
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Scaler le contexte
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    return { width: rect.width, height: rect.height };
  }

  // ========== CALCUL ÉCHELLES ==========
  function calculateScales(x_profile, T_profile, T_freeze, temperatureGel, canvas) {
    const container = canvas.parentElement.getBoundingClientRect();
    const width = container.width;
    const height = container.height;

    // Plages de données
    const x_min = Math.min(...x_profile);
    const x_max = Math.max(...x_profile);
    const T_min = Math.min(...T_profile, T_freeze);
    const T_max = Math.max(...T_profile, temperatureGel);

    // Ajouter marge verticale
    const T_range = T_max - T_min;
    const T_margin = T_range * 0.1;

    // Zone de dessin (en tenant compte du padding)
    const plotWidth = width - config.padding.left - config.padding.right;
    const plotHeight = height - config.padding.top - config.padding.bottom;

    return {
      x_min,
      x_max,
      T_min: T_min - T_margin,
      T_max: T_max + T_margin,
      plotWidth,
      plotHeight,
      width,
      height,

      // Fonctions de conversion coordonnées → pixels
      xToPixel: (x) => config.padding.left + ((x - x_min) / (x_max - x_min)) * plotWidth,
      TToPixel: (T) =>
        config.padding.top + ((T_max + T_margin - T) / (T_max - T_min + 2 * T_margin)) * plotHeight,
    };
  }

  // ========== GRILLE ==========
  function drawGrid(ctx, scales) {
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = config.gridLineWidth;
    ctx.setLineDash([2, 2]);

    // Grille horizontale (température)
    const T_step = calculateNiceStep(scales.T_max - scales.T_min, 5);
    const T_start = Math.ceil(scales.T_min / T_step) * T_step;

    for (let T = T_start; T <= scales.T_max; T += T_step) {
      const y = scales.TToPixel(T);
      ctx.beginPath();
      ctx.moveTo(config.padding.left, y);
      ctx.lineTo(config.padding.left + scales.plotWidth, y);
      ctx.stroke();
    }

    // Grille verticale (position)
    const x_step = calculateNiceStep(scales.x_max - scales.x_min, 5);
    const x_start = Math.ceil(scales.x_min / x_step) * x_step;

    for (let x = x_start; x <= scales.x_max; x += x_step) {
      const px = scales.xToPixel(x);
      ctx.beginPath();
      ctx.moveTo(px, config.padding.top);
      ctx.lineTo(px, config.padding.top + scales.plotHeight);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  // ========== AXES ==========
  function drawAxes(ctx, scales) {
    ctx.strokeStyle = config.colors.axis;
    ctx.lineWidth = 2;

    // Axe X (bas)
    ctx.beginPath();
    ctx.moveTo(config.padding.left, config.padding.top + scales.plotHeight);
    ctx.lineTo(config.padding.left + scales.plotWidth, config.padding.top + scales.plotHeight);
    ctx.stroke();

    // Axe Y (gauche)
    ctx.beginPath();
    ctx.moveTo(config.padding.left, config.padding.top);
    ctx.lineTo(config.padding.left, config.padding.top + scales.plotHeight);
    ctx.stroke();
  }

  // ========== ZONES DE RISQUE ==========
  function drawRiskZones(ctx, scales, T_freeze, temperatureGel) {
    const y_top = config.padding.top;
    const y_bottom = config.padding.top + scales.plotHeight;
    const y_freeze = scales.TToPixel(T_freeze);
    const y_margin = scales.TToPixel(temperatureGel);

    // Zone verte (au-dessus de temperatureGel)
    if (scales.T_max >= temperatureGel) {
      ctx.fillStyle = config.colors.zoneGreen;
      ctx.fillRect(config.padding.left, y_top, scales.plotWidth, y_margin - y_top);
    }

    // Zone jaune (entre 0 et temperatureGel)
    if (scales.T_min < temperatureGel && scales.T_max > T_freeze) {
      ctx.fillStyle = config.colors.zoneYellow;
      const y_start = Math.max(y_margin, y_top);
      const y_end = Math.min(y_freeze, y_bottom);
      ctx.fillRect(config.padding.left, y_start, scales.plotWidth, y_end - y_start);
    }

    // Zone rouge (en dessous de 0)
    if (scales.T_min < T_freeze) {
      ctx.fillStyle = config.colors.zoneRed;
      const y_start = Math.max(y_freeze, y_top);
      ctx.fillRect(config.padding.left, y_start, scales.plotWidth, y_bottom - y_start);
    }
  }

  // ========== LIGNE DE GEL ==========
  function drawFreezeLine(ctx, scales, T_freeze) {
    const y = scales.TToPixel(T_freeze);

    ctx.strokeStyle = config.colors.freezeLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(config.padding.left, y);
    ctx.lineTo(config.padding.left + scales.plotWidth, y);
    ctx.stroke();

    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = config.colors.freezeLine;
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    const freezeLabel = window.I18n ? I18n.t('chart.freezeLine') : 'Gel';
    ctx.fillText(`${freezeLabel} (${T_freeze}°C)`, config.padding.left + 5, y - 5);
  }

  // ========== LIGNE DE MARGE ==========
  function drawMarginLine(ctx, scales, temperatureGel) {
    const y = scales.TToPixel(temperatureGel);

    ctx.strokeStyle = config.colors.marginLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(config.padding.left, y);
    ctx.lineTo(config.padding.left + scales.plotWidth, y);
    ctx.stroke();

    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = config.colors.marginLine;
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    const safetyLabel = window.I18n ? I18n.t('chart.safetyLine') : 'Seuil sécuritaire';
    ctx.fillText(`${safetyLabel} (${temperatureGel}°C)`, config.padding.left + 5, y - 5);
  }

  // ========== COURBE TEMPÉRATURE ==========
  function drawTemperatureCurve(ctx, scales, x_profile, T_profile) {
    ctx.strokeStyle = config.colors.line;
    ctx.lineWidth = config.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();

    for (let i = 0; i < x_profile.length; i++) {
      const x = scales.xToPixel(x_profile[i]);
      const y = scales.TToPixel(T_profile[i]);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Points
    ctx.fillStyle = config.colors.line;
    for (let i = 0; i < x_profile.length; i++) {
      const x = scales.xToPixel(x_profile[i]);
      const y = scales.TToPixel(T_profile[i]);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ========== LABELS ==========
  function drawLabels(ctx, scales) {
    ctx.fillStyle = config.colors.text;
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';

    // Axe X (position)
    const x_step = calculateNiceStep(scales.x_max - scales.x_min, 5);
    const x_start = Math.ceil(scales.x_min / x_step) * x_step;

    for (let x = x_start; x <= scales.x_max; x += x_step) {
      const px = scales.xToPixel(x);
      ctx.fillText(x.toFixed(0), px, config.padding.top + scales.plotHeight + 20);
    }

    // Label axe X
    ctx.font = `bold ${config.fontSize + 2}px ${config.fontFamily}`;
    const xAxisLabel = window.I18n ? I18n.t('chart.axisPosition') : 'Position (m)';
    ctx.fillText(xAxisLabel, scales.width / 2, scales.height - 10);

    // Axe Y (température)
    ctx.textAlign = 'right';
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;

    const T_step = calculateNiceStep(scales.T_max - scales.T_min, 5);
    const T_start = Math.ceil(scales.T_min / T_step) * T_step;

    for (let T = T_start; T <= scales.T_max; T += T_step) {
      const y = scales.TToPixel(T);
      ctx.fillText(T.toFixed(0) + '°C', config.padding.left - 10, y + 4);
    }

    // Label axe Y (vertical)
    ctx.save();
    ctx.translate(15, scales.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = `bold ${config.fontSize + 2}px ${config.fontFamily}`;
    const yAxisLabel = window.I18n ? I18n.t('chart.axisTemperature') : 'Température (°C)';
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();
  }

  // ========== UTILITAIRES ==========
  function calculateNiceStep(range, targetSteps) {
    const rawStep = range / targetSteps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;

    let niceStep;
    if (normalized < 1.5) {
      niceStep = magnitude;
    } else if (normalized < 3) {
      niceStep = 2 * magnitude;
    } else if (normalized < 7) {
      niceStep = 5 * magnitude;
    } else {
      niceStep = 10 * magnitude;
    }

    return niceStep;
  }

  // ========== EXPORT ==========
  window.TemperatureChart = {
    draw: drawChart,
  };
})();
