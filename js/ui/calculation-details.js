/**
 * calculation-details.js
 *
 * Module pour afficher les détails de calcul étape par étape (Section 3).
 *
 * Cette section permet à un ingénieur compétent de valider la pertinence
 * des résultats en suivant la mécanique de calcul complète.
 *
 * Structure:
 * - Segment 1: Calculs détaillés complets
 * - Segments intermédiaires: Tableau récapitulatif
 * - Segment final: Calculs détaillés complets
 *
 * Template generation is delegated to CalcDetailTemplates.
 */

(function () {
  'use strict';

  // ========== DEPENDENCY ==========

  const CalcDetailTemplates =
    typeof window !== 'undefined' && window.CalcDetailTemplates
      ? window.CalcDetailTemplates
      : require('./calc-detail-templates.js');

  // ========== MODULE PRINCIPAL ==========

  const CalculationDetails = {
    /**
     * Affiche les détails de calcul dans la Section 3
     * @param {Object} networkResult - Résultats du réseau complet
     * @param {Object} config - Configuration de l'analyse
     */
    display: function (networkResult, config) {
      const numSegments = networkResult.segmentResults.length;

      if (numSegments === 0) {
        console.warn('Aucun segment à afficher');
        return;
      }

      // Résumé exécutif
      const summaryContainer = document.getElementById('calc-summary');
      if (summaryContainer) {
        summaryContainer.innerHTML = this.generateExecutiveSummary(networkResult, config);
      }

      // Segment 1 détaillé uniquement
      const firstContainer = document.getElementById('calc-segment-first');
      if (firstContainer) {
        firstContainer.innerHTML = this.generateSegmentHeader(
          1,
          0,
          networkResult.segmentResults[0],
          config,
          numSegments
        );
        firstContainer.innerHTML += this.displaySegmentCalculations(
          0,
          networkResult.segmentResults[0],
          config
        );

        // Ajouter le tableau collapsible après le segment détaillé
        firstContainer.innerHTML += this.generateTableCollapsible(
          networkResult.segmentResults,
          networkResult.x_profile
        );
      }

      // Attacher événements pour sections collapsibles
      this.attachCollapseEvents();

      // Rendre les équations LaTeX avec KaTeX
      this.renderLatex();
    },

    /**
     * Génère le résumé exécutif
     * Delegates to CalcDetailTemplates.generateExecutiveSummary
     */
    generateExecutiveSummary: function (networkResult, config) {
      return CalcDetailTemplates.generateExecutiveSummary(networkResult, config);
    },

    /**
     * Génère l'en-tête d'un segment
     * Delegates to CalcDetailTemplates.generateSegmentHeader
     */
    generateSegmentHeader: function (
      segmentNum,
      startPosition,
      segmentResult,
      config,
      totalSegments
    ) {
      return CalcDetailTemplates.generateSegmentHeader(
        segmentNum,
        startPosition,
        segmentResult,
        config,
        totalSegments
      );
    },

    /**
     * Affiche tous les calculs détaillés pour un segment
     */
    displaySegmentCalculations: function (segmentIndex, segmentResult, config) {
      let html = '<div class="calc-blocks">';

      // Recalculer le segment complet pour avoir tous les détails
      const segmentLength = config.totalLength / config.numSegments;
      const segmentGeometry = {
        D_inner: config.geometry.D_inner,
        D_outer: config.geometry.D_outer,
        roughness: config.geometry.roughness,
        length: segmentLength,
        material: config.geometry.material,
      };

      // Only segment 0 is displayed in detail; assert to prevent misuse
      if (segmentIndex !== 0) {
        console.warn('displaySegmentCalculations: only segment 0 is supported for detailed view');
      }
      const segmentFluid = {
        T_in: segmentResult.T_in,
        P: config.fluid.P, // Exact for segment 0 (entry pressure)
        m_dot: config.fluid.m_dot,
      };

      // Recalcul complet pour avoir tous les détails (h_int, h_ext, NTU, etc.)
      const fullSegmentResult = calculatePipeSegment(
        segmentGeometry,
        segmentFluid,
        config.ambient,
        config.insulation
      );

      // Propriétés fluides calculées
      const T_avg = (segmentResult.T_in + segmentResult.T_out) / 2;
      const water = WaterProperties.getWaterProperties(T_avg, config.fluid.P); // Pression en bar
      const air = AirProperties.getAirProperties(config.ambient.T_amb);

      // 1. Propriétés des fluides
      html += this.displayFluidProperties(T_avg, config.fluid.P, water, air, config.ambient.T_amb);

      // 2. Hydraulique
      html += this.displayHydraulics(fullSegmentResult, segmentGeometry, config, water);

      // 3. Transfert thermique interne
      html += this.displayConvectionInternal(fullSegmentResult, segmentGeometry, config, water);

      // 4. Transfert thermique externe
      html += this.displayConvectionExternal(fullSegmentResult, config, air);

      // 5. Résistances thermiques
      html += this.displayThermalResistances(fullSegmentResult, segmentGeometry, config);

      // 6. Méthode NTU
      html += this.displayNTU(fullSegmentResult, segmentResult, config, water);

      html += '</div>';
      return html;
    },

    /**
     * Affiche les propriétés des fluides avec interpolation
     * Delegates to CalcDetailTemplates.displayFluidProperties
     */
    displayFluidProperties: function (T_avg, P_bar, water, air, T_amb) {
      return CalcDetailTemplates.displayFluidProperties(T_avg, P_bar, water, air, T_amb);
    },

    /**
     * Affiche les calculs hydrauliques
     * Delegates to CalcDetailTemplates.displayHydraulics
     */
    displayHydraulics: function (result, geometry, config, water) {
      return CalcDetailTemplates.displayHydraulics(result, geometry, config, water);
    },

    /**
     * Affiche la convection interne
     * Delegates to CalcDetailTemplates.displayConvectionInternal
     */
    displayConvectionInternal: function (result, geometry, config, water) {
      return CalcDetailTemplates.displayConvectionInternal(result, geometry, config, water);
    },

    /**
     * Affiche la convection externe
     * Delegates to CalcDetailTemplates.displayConvectionExternal
     */
    displayConvectionExternal: function (result, config, _air) {
      return CalcDetailTemplates.displayConvectionExternal(result, config, _air);
    },

    /**
     * Affiche les résistances thermiques
     * Delegates to CalcDetailTemplates.displayThermalResistances
     */
    displayThermalResistances: function (result, geometry, config) {
      return CalcDetailTemplates.displayThermalResistances(result, geometry, config);
    },

    /**
     * Affiche la méthode NTU
     * Delegates to CalcDetailTemplates.displayNTU
     */
    displayNTU: function (result, segmentResult, config, water) {
      return CalcDetailTemplates.displayNTU(result, segmentResult, config, water);
    },

    /**
     * Génère le tableau collapsible
     */
    generateTableCollapsible: function (segmentResults, x_profile) {
      return `
        <div class="calc-table-collapsible">
          <button class="btn-collapse-subsection" id="btn-toggle-table" aria-expanded="false">
            <span class="collapse-icon">▶</span>
            <span class="collapse-text">${window.I18n ? I18n.t('detailedCalcs.showSegmentsTable') : 'Afficher le tableau récapitulatif de tous les segments'}</span>
          </button>

          <div class="subsection-collapsible-content" id="table-content" style="display: none;">
            ${this.displayAllSegmentsTable(segmentResults, x_profile)}
          </div>
        </div>
      `;
    },

    /**
     * Affiche le tableau de tous les segments
     */
    displayAllSegmentsTable: function (segmentResults, x_profile) {
      const t = (key) => (window.I18n ? I18n.t(key) : key);
      let html = `
        <div class="calc-all-segments">
          <h3>${t('detailedCalcs.tableTitle')}</h3>
          <p class="calc-table-note">
            ${t('detailedCalcs.tableNote')}
            ${t('detailedCalcs.tableNoteExtra')}
          </p>

          <div class="calc-table-wrapper">
            <table class="calc-table">
              <thead>
                <tr>
                  <th>${t('detailedCalcs.table.segment')}</th>
                  <th>${t('detailedCalcs.table.position')}<br/>[m]</th>
                  <th>T<sub>in</sub><br/>[°C]</th>
                  <th>T<sub>out</sub><br/>[°C]</th>
                  <th>ΔT<br/>[°C]</th>
                  <th>Re<br/>[-]</th>
                  <th>${t('detailedCalcs.regime')}</th>
                  <th>ΔP<br/>[Pa]</th>
                  <th>Q<sub>loss</sub><br/>[W]</th>
                </tr>
              </thead>
              <tbody>
      `;

      // Tous les segments
      for (let i = 0; i < segmentResults.length; i++) {
        const seg = segmentResults[i];
        const pos = x_profile[i];

        // Mettre en évidence le premier segment (exemple détaillé)
        const rowClass = i === 0 ? ' class="highlighted-row"' : '';

        html += `
                <tr${rowClass}>
                  <td>${i + 1}</td>
                  <td>${pos.toFixed(1)}</td>
                  <td>${seg.T_in.toFixed(2)}</td>
                  <td>${seg.T_out.toFixed(2)}</td>
                  <td>${(seg.T_in - seg.T_out).toFixed(2)}</td>
                  <td>${seg.Re.toFixed(0)}</td>
                  <td>${seg.regime}</td>
                  <td>${seg.dP.toFixed(1)}</td>
                  <td>${seg.Q_loss.toFixed(1)}</td>
                </tr>
        `;
      }

      html += `
              </tbody>
            </table>
          </div>

          <div class="calc-table-legend">
            <p>
              <span class="legend-highlight">📋</span>
              <strong>${t('detailedCalcs.segment1Note')}</strong> ${t('detailedCalcs.segment1Text')}
            </p>
            <p>
              <strong>${t('detailedCalcs.fluidPropertiesNote')}</strong> ${t('detailedCalcs.fluidPropertiesText')}
            </p>
          </div>
        </div>
      `;

      return html;
    },

    /**
     * Attache les événements pour les sections collapsibles
     */
    attachCollapseEvents: function () {
      // Toggle Section 3 principale
      const showDetailsText = window.I18n
        ? I18n.t('detailedCalcs.showTechnicalDetails')
        : 'Afficher les détails techniques';
      const hideDetailsText = window.I18n
        ? I18n.t('detailedCalcs.hideTechnicalDetails')
        : 'Masquer les détails techniques';
      this.attachToggleEvent(
        'btn-toggle-section3',
        'section3-content',
        showDetailsText,
        hideDetailsText,
        true
      );

      // Toggle tableau récapitulatif
      const showText = window.I18n
        ? I18n.t('detailedCalcs.showSegmentsTable')
        : 'Afficher le tableau récapitulatif de tous les segments';
      const hideText = window.I18n
        ? I18n.t('detailedCalcs.hideSegmentsTable')
        : 'Masquer le tableau récapitulatif';
      this.attachToggleEvent('btn-toggle-table', 'table-content', showText, hideText, false);
    },

    /**
     * Attache un événement toggle à un bouton
     */
    attachToggleEvent: function (btnId, contentId, textShow, textHide, scrollOnOpen) {
      const toggleBtn = document.getElementById(btnId);
      const content = document.getElementById(contentId);

      if (!toggleBtn || !content) {
        return;
      }

      // Retirer ancien listener si présent
      const newToggleBtn = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

      // Initialiser le texte selon l'état actuel
      const isOpen = newToggleBtn.getAttribute('aria-expanded') === 'true';
      const textSpan = newToggleBtn.querySelector('.collapse-text');
      if (textSpan) {
        textSpan.textContent = isOpen ? textHide : textShow;
      }

      // Ajouter nouveau listener
      newToggleBtn.addEventListener('click', function () {
        const isOpen = newToggleBtn.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          // Fermer
          content.classList.remove('is-open');
          newToggleBtn.setAttribute('aria-expanded', 'false');
          newToggleBtn.querySelector('.collapse-text').textContent = textShow;
        } else {
          // Ouvrir
          content.classList.add('is-open');
          newToggleBtn.setAttribute('aria-expanded', 'true');
          newToggleBtn.querySelector('.collapse-text').textContent = textHide;

          // Scroll smooth si demandé
          if (scrollOnOpen) {
            setTimeout(() => {
              const section = document.getElementById('section-explanations');
              if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          }
        }
      });
    },

    /**
     * Rend les équations LaTeX avec KaTeX
     */
    renderLatex: function () {
      // Attendre que KaTeX soit chargé
      if (typeof renderMathInElement === 'undefined') {
        console.warn('KaTeX renderMathInElement non disponible');
        return;
      }

      // Rendre dans toute la Section 3
      const section = document.getElementById('section-explanations');
      if (section) {
        renderMathInElement(section, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false },
          ],
          throwOnError: false,
        });
      }
    },
  };

  // Export global
  window.CalculationDetails = CalculationDetails;
})();
