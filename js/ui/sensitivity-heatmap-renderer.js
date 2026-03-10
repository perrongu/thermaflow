/**
 * sensitivity-heatmap-renderer.js
 *
 * Module de rendu canvas pour la heatmap de l'analyse de sensibilité 2D.
 *
 * Contient les fonctions de dessin: heatmap, axes, légende et helpers de couleur.
 * Extrait de sensitivity-analysis.js pour respecter la limite de taille des fichiers.
 *
 * @module sensitivity-heatmap-renderer
 */

(function () {
  'use strict';

  // ========== COULEUR SELON TEMPÉRATURE ==========
  function getTemperatureColor(T) {
    // Utiliser les mêmes couleurs que le profil de température
    if (T <= 0) {
      // Rouge pâle pour condition de gel (≤ 0°C)
      return '#FFD6D6';
    } else if (T < 5) {
      // Jaune pâle pour zone sous marge (0-5°C)
      return '#FFF4CC';
    } else {
      // Vert pâle pour sécuritaire (≥ 5°C)
      return '#DFFFD6';
    }
  }

  // ========== COULEUR TEXTE ==========
  function getTextColor(_T) {
    // Texte noir sur les couleurs pâles pour un contraste optimal
    return '#000000';
  }

  // ========== DESSINER AXES ==========
  function drawAxes(ctx, padding, plotWidth, plotHeight, results) {
    const resolution = results.valuesX.length;
    const cellWidth = plotWidth / resolution;
    const cellHeight = plotHeight / resolution;

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 10px sans-serif';

    // Titre axe X (en haut)
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(
      `${results.labelX} (${results.unitX})`,
      padding.left + plotWidth / 2,
      padding.top - 30
    );

    // Titre axe Y (à gauche, vertical)
    ctx.save();
    ctx.translate(15, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`${results.labelY} (${results.unitY})`, 0, 0);
    ctx.restore();

    // Valeurs précises pour chaque colonne (en haut)
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#374151';

    for (let i = 0; i < resolution; i++) {
      const x = padding.left + (i + 0.5) * cellWidth;
      const value = results.valuesX[i];

      // Formater selon le type de valeur
      let displayValue;
      if (Math.abs(value) >= 100) {
        displayValue = value.toFixed(0);
      } else if (Math.abs(value) >= 10) {
        displayValue = value.toFixed(1);
      } else {
        displayValue = value.toFixed(2);
      }

      ctx.fillText(displayValue, x, padding.top - 10);
    }

    // Valeurs précises pour chaque rangée (à gauche)
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#374151';

    for (let j = 0; j < resolution; j++) {
      const y = padding.top + (resolution - j - 0.5) * cellHeight;
      const value = results.valuesY[j];

      // Formater selon le type de valeur
      let displayValue;
      if (Math.abs(value) >= 100) {
        displayValue = value.toFixed(0);
      } else if (Math.abs(value) >= 10) {
        displayValue = value.toFixed(1);
      } else {
        displayValue = value.toFixed(2);
      }

      ctx.fillText(displayValue, padding.left - 10, y + 3);
    }

    // Label du bas avec le nom complet
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#374151';
    ctx.fillText(
      `${results.labelX} (${results.unitX})`,
      padding.left + plotWidth / 2,
      padding.top + plotHeight + 30
    );
  }

  // ========== DESSINER LÉGENDE AMÉLIORÉE ==========
  function drawImprovedLegend(ctx, width, height, padding) {
    const legendY = height - padding.bottom + 70;
    const legendStartX = padding.left;

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'left';
    const legendTitle = window.I18n ? I18n.t('chart.legendTitle') : 'Légende:';
    ctx.fillText(legendTitle, legendStartX, legendY);

    // Définir les éléments de légende avec les couleurs harmonisées
    const legendItems = [
      {
        color: '#FFD6D6',
        label: window.I18n ? I18n.t('chart.legendFreeze') : 'Gel (≤ 0°C)',
      },
      {
        color: '#FFF4CC',
        label: window.I18n ? I18n.t('chart.legendUnder') : 'Sous marge (0-5°C)',
      },
      {
        color: '#DFFFD6',
        label: window.I18n ? I18n.t('chart.legendSafe') : 'Sécuritaire (≥ 5°C)',
      },
      {
        color: '#cccccc',
        label: window.I18n ? I18n.t('chart.legendInvalid') : 'Invalide (hors plage physique)',
      },
    ];

    let offsetX = legendStartX + 80;

    legendItems.forEach((item, _index) => {
      // Carré de couleur
      ctx.fillStyle = item.color;
      ctx.fillRect(offsetX, legendY - 12, 20, 16);
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX, legendY - 12, 20, 16);

      // Texte
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, offsetX + 28, legendY);

      // Espacement pour le prochain élément
      offsetX += ctx.measureText(item.label).width + 60;
    });
  }

  // ========== DESSINER HEATMAP ==========
  /**
   * Dessine la heatmap complète sur le canvas fourni
   *
   * @param {HTMLCanvasElement} canvas - Élément canvas cible
   * @param {Object} results - Résultats de la matrice de sensibilité
   * @param {Array<Array>} results.matrix - Matrice 2D des résultats
   * @param {Array<number>} results.valuesX - Valeurs de l'axe X
   * @param {Array<number>} results.valuesY - Valeurs de l'axe Y
   * @param {string} results.labelX - Libellé de l'axe X
   * @param {string} results.labelY - Libellé de l'axe Y
   * @param {string} results.unitX - Unité de l'axe X
   * @param {string} results.unitY - Unité de l'axe Y
   */
  function drawHeatmap(canvas, results) {
    if (!canvas) {
      console.error('Canvas non trouvé');
      return;
    }

    const ctx = canvas.getContext('2d');

    // Redimensionner canvas - plus grand pour accueillir les valeurs
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = 500 * dpr; // Plus grand pour la légende

    canvas.style.width = rect.width + 'px';
    canvas.style.height = '500px';

    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 500;

    // Effacer
    ctx.clearRect(0, 0, width, height);

    // Configuration
    const padding = { top: 50, right: 100, bottom: 120, left: 100 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const resolution = results.matrix.length;
    const cellWidth = plotWidth / resolution;
    const cellHeight = plotHeight / resolution;

    // Dessiner les cellules
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const cell = results.matrix[j][i];

        const x = padding.left + i * cellWidth;
        const y = padding.top + (resolution - 1 - j) * cellHeight; // Inverser Y

        if (cell.success) {
          // Couleur selon température
          ctx.fillStyle = getTemperatureColor(cell.T_final);
        } else {
          // Gris pour les échecs
          ctx.fillStyle = '#cccccc';
        }

        ctx.fillRect(x, y, cellWidth, cellHeight);

        // Bordure normale
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Texte de la valeur - TOUJOURS afficher
        if (cell.success && cell.T_final !== null && cell.T_final !== undefined) {
          ctx.fillStyle = getTextColor(cell.T_final);

          // Calculer taille de police adaptative
          const fontSize = Math.max(9, Math.min(cellWidth / 5, cellHeight / 3, 11));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Formatter la valeur avec signe et unité
          let valueText;
          if (cell.frozen) {
            // Condition de gel - afficher 0.0°C
            valueText = '0.0°C';
          } else {
            const sign = cell.T_final >= 0 ? '+' : '';
            valueText = `${sign}${cell.T_final.toFixed(1)}°C`;
          }

          ctx.fillText(valueText, x + cellWidth / 2, y + cellHeight / 2);

          // Indicateur de gel
          if (cell.frozen && cellWidth > 35 && cellHeight > 35) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `${Math.max(7, fontSize - 2)}px sans-serif`;
            const freezeBadge = window.I18n ? I18n.t('chart.freezeBadge') : 'GEL';
            ctx.fillText(`❄️ ${freezeBadge}`, x + cellWidth / 2, y + cellHeight / 2 + fontSize + 3);
          } else if (cell.frozen && cellWidth > 25) {
            // Version compacte pour petites cellules
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `${Math.max(8, fontSize)}px sans-serif`;
            ctx.fillText('❄️', x + cellWidth - 10, y + 10);
          }

          // Indicateur subtil pour les valeurs estimées
          if (cell.estimated && !cell.frozen && cellWidth > 30) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.font = `${Math.max(6, fontSize - 3)}px sans-serif`;
            ctx.fillText('~', x + cellWidth - 8, y + 8);
          }
        }
      }
    }

    // Dessiner les axes
    drawAxes(ctx, padding, plotWidth, plotHeight, results);

    // Dessiner la légende améliorée
    drawImprovedLegend(ctx, width, height, padding);
  }

  // ====================================================================
  // EXPORTS
  // ====================================================================

  // Export pour navigateur (window global)
  if (typeof window !== 'undefined') {
    window.SensitivityHeatmapRenderer = {
      drawHeatmap: drawHeatmap,
      getTemperatureColor: getTemperatureColor,
      getTextColor: getTextColor,
    };
  }

  // Export pour Node.js (tests et modules)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      drawHeatmap: drawHeatmap,
      getTemperatureColor: getTemperatureColor,
      getTextColor: getTextColor,
    };
  }
})();
