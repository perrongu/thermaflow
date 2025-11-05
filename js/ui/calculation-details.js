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
 */

(function () {
  'use strict';

  // ========== UTILITAIRES ==========

  /**
   * Formate un nombre en notation scientifique LaTeX
   * @param {number} value - Valeur à formater
   * @param {number} decimals - Nombre de décimales
   * @returns {string} Notation LaTeX (ex: "1.234 \\times 10^{-3}")
   */
  function toScientificLatex(value, decimals = 3) {
    if (value === 0) {
      return '0';
    }

    const expStr = value.toExponential(decimals);
    const [mantissa, exponent] = expStr.split('e');
    const exp = parseInt(exponent, 10);

    if (exp === 0) {
      return mantissa;
    }

    return `${mantissa} \\times 10^{${exp}}`;
  }

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
     */
    generateExecutiveSummary: function (networkResult, config) {
      // const firstSeg = networkResult.segmentResults[0]; // Non utilisé actuellement
      const segmentLength = config.totalLength / config.numSegments;

      const t = (key, replacements) => (window.I18n ? I18n.t(key, replacements) : key);

      return `
        <div class="calc-executive-summary">
          <h3>${t('calcDetails.methodology.title')}</h3>
          <p>
            ${t('calcDetails.methodology.pipe')} <strong>${config.totalLength} m</strong> ${t('calcDetails.methodology.divided')} <strong>${config.numSegments} ${t('calcDetails.methodology.segments')}</strong> 
            ${t('calcDetails.methodology.of')} ${segmentLength.toFixed(1)} ${t('calcDetails.methodology.each')}
          </p>
          
          <div class="calc-methodology-steps">
            <div class="methodology-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <strong>${t('calcDetails.methodology.step1Title')}</strong>
                <p>${t('calcDetails.methodology.step1Desc')}</p>
              </div>
            </div>
            
            <div class="methodology-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <strong>${t('calcDetails.methodology.step2Title')}</strong>
                <p>${t('calcDetails.methodology.step2Desc')}</p>
              </div>
            </div>
            
            <div class="methodology-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <strong>${t('calcDetails.methodology.step3Title')}</strong>
                <p>${t('calcDetails.methodology.step3Desc')}</p>
              </div>
            </div>
            
            <div class="methodology-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <strong>${t('calcDetails.methodology.step4Title')}</strong>
                <p>${t('calcDetails.methodology.step4Desc')}</p>
              </div>
            </div>
            
            <div class="methodology-step">
              <div class="step-number">5</div>
              <div class="step-content">
                <strong>${t('calcDetails.methodology.step5Title')}</strong>
                <p>${t('calcDetails.methodology.step5Desc')}</p>
              </div>
            </div>
            
            <div class="methodology-step">
              <div class="step-number">6</div>
              <div class="step-content">
                <strong>${t('calcDetails.methodology.step6Title')}</strong>
                <p>${t('calcDetails.methodology.step6Desc')}</p>
              </div>
            </div>
          </div>
          
          <div class="calc-note">
            <strong>${t('calcDetails.methodology.note')}</strong> ${t('calcDetails.methodology.noteText')}
          </div>
        </div>
      `;
    },

    /**
     * Génère l'en-tête d'un segment
     */
    generateSegmentHeader: function (
      segmentNum,
      startPosition,
      segmentResult,
      config,
      totalSegments
    ) {
      const segmentLength = config.totalLength / config.numSegments;
      const endPosition = startPosition + segmentLength;

      const t = (key, replacements) => (window.I18n ? I18n.t(key, replacements) : key);

      return `
        <div class="calc-segment-header">
          <h3>${t('calcDetails.example.title')} ${segmentNum} / ${totalSegments}</h3>
          <p class="calc-segment-info">
            ${t('calcDetails.example.position')} ${startPosition.toFixed(1)} m → ${endPosition.toFixed(1)} m | 
            T<sub>in</sub> = ${segmentResult.T_in.toFixed(2)}°C → 
            T<sub>out</sub> = ${segmentResult.T_out.toFixed(2)}°C | 
            ΔT = ${(segmentResult.T_in - segmentResult.T_out).toFixed(2)}°C
          </p>
          <p class="calc-segment-note">
            <em>${t('calcDetails.example.note')} (2 à ${totalSegments}) ${t('calcDetails.example.noteText')}</em>
          </p>
        </div>
      `;
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

      const segmentFluid = {
        T_in: segmentResult.T_in,
        P: config.fluid.P, // Utiliser la pression initiale (simplifié)
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
     */
    displayFluidProperties: function (T_avg, P_bar, water, air, T_amb) {
      const t = (key) => (window.I18n ? I18n.t(key) : key);

      // Convertir pression: bar → kPag → unité d'affichage
      const P_kPag = P_bar * 100; // 1 bar = 100 kPa
      const P_display = window.UnitConverter ? UnitConverter.fromSI('pressure', P_kPag) : P_kPag;
      const pressureUnit = window.UnitConverter
        ? UnitConverter.getUnitInfo('pressure').label
        : 'kPag';

      return `
        <div class="calc-block">
          <h4 class="calc-block__title">${t('calcDetails.step1.title')}</h4>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step1.water.title')}</h5>
            <div class="calc-block__inputs">
              <p><strong>${t('calcDetails.step1.water.inputValues')}</strong></p>
              <p>• ${t('calcDetails.step1.water.avgTemp')} ${T_avg.toFixed(2)}°C</p>
              <p>• ${t('calcDetails.step1.water.pressure')} ${P_display.toFixed(1)} ${pressureUnit} (${P_bar.toFixed(2)} bar pour calculs)</p>
            </div>
            <div class="calc-block__formula">
              <p>${t('calcDetails.step1.water.interpolation')}</p>
              <p>\\( \\rho = ${water.rho.toFixed(2)} \\text{ kg/m}^3 \\)</p>
              <p>\\( \\mu = ${toScientificLatex(water.mu, 3)} \\text{ Pa}\\cdot\\text{s} \\)</p>
              <p>\\( k = ${water.k.toFixed(3)} \\text{ W/(m}\\cdot\\text{K)} \\)</p>
              <p>\\( c_p = ${water.cp.toFixed(0)} \\text{ J/(kg}\\cdot\\text{K)} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step1.water.result')} ${T_avg.toFixed(1)}°C : 
              ρ = ${water.rho.toFixed(1)} kg/m³, 
              μ = ${(water.mu * 1000).toFixed(3)} mPa·s, 
              k = ${water.k.toFixed(3)} W/(m·K), 
              c<sub>p</sub> = ${water.cp.toFixed(0)} J/(kg·K)
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step1.water.source')}</strong>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step1.air.title')}</h5>
            <div class="calc-block__inputs">
              <p><strong>${t('calcDetails.step1.air.inputValue')}</strong></p>
              <p>• ${t('calcDetails.step1.air.ambTemp')}<sub>amb</sub> = ${T_amb.toFixed(1)}°C</p>
            </div>
            <div class="calc-block__formula">
              <p>${t('calcDetails.step1.air.interpolation')}</p>
              <p>\\( \\rho_{air} = ${air.rho.toFixed(3)} \\text{ kg/m}^3 \\)</p>
              <p>\\( \\mu_{air} = ${toScientificLatex(air.mu, 3)} \\text{ Pa}\\cdot\\text{s} \\)</p>
              <p>\\( k_{air} = ${air.k.toFixed(5)} \\text{ W/(m}\\cdot\\text{K)} \\)</p>
              <p>\\( Pr_{air} = ${air.Pr.toFixed(3)} \\text{ [-]} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step1.air.result')} ${T_amb.toFixed(1)}°C : 
              ρ = ${air.rho.toFixed(3)} kg/m³, 
              Pr = ${air.Pr.toFixed(3)}
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step1.air.source')}</strong>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Affiche les calculs hydrauliques
     */
    displayHydraulics: function (result, geometry, config, water) {
      const t = (key) => (window.I18n ? I18n.t(key) : key);
      const Q = config.fluid.m_dot / water.rho;
      const A = Math.PI * Math.pow(geometry.D_inner / 2, 2);
      const V = result.V;
      const D = geometry.D_inner;
      const epsilon_D = geometry.roughness / D;

      return `
        <div class="calc-block">
          <h4 class="calc-block__title">${t('calcDetails.step2.title')}</h4>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step2.velocity.title')}</h5>
            <div class="calc-block__inputs">
              <p><strong>${t('calcDetails.step2.velocity.inputValues')}</strong></p>
              <p>• ${t('calcDetails.step2.velocity.massFlow')} ${config.fluid.m_dot.toFixed(3)} kg/s</p>
              <p>• ${t('calcDetails.step2.velocity.density')} ${water.rho.toFixed(2)} kg/m³</p>
              <p>• ${t('calcDetails.step2.velocity.diameter')} ${(D * 1000).toFixed(2)} mm (${D.toFixed(4)} m)</p>
            </div>
            <div class="calc-block__formula">
              <p>${t('calcDetails.step2.velocity.volumeFlow')}</p>
              <p>\\( Q = \\frac{\\dot{m}}{\\rho} = \\frac{${config.fluid.m_dot.toFixed(3)}}{${water.rho.toFixed(2)}} = ${toScientificLatex(Q, 4)} \\text{ m}^3\\text{/s} \\)</p>
              <p>${t('calcDetails.step2.velocity.crossSection')}</p>
              <p>\\( A = \\frac{\\pi D^2}{4} = \\frac{\\pi \\times ${D.toFixed(4)}^2}{4} = ${toScientificLatex(A, 4)} \\text{ m}^2 \\)</p>
              <p>${t('calcDetails.step2.velocity.avgVelocity')}</p>
              <p>\\( V = \\frac{Q}{A} = \\frac{${toScientificLatex(Q, 4)}}{${toScientificLatex(A, 4)}} = ${V.toFixed(3)} \\text{ m/s} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step2.velocity.result')} ${V.toFixed(3)} m/s
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step2.velocity.source')}</strong>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step2.reynolds.title')}</h5>
            <div class="calc-block__formula">
              <p>\\( Re = \\frac{\\rho V D}{\\mu} = \\frac{${water.rho.toFixed(2)} \\times ${V.toFixed(3)} \\times ${D.toFixed(4)}}{${toScientificLatex(water.mu, 3)}} = ${result.Re.toFixed(0)} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step2.reynolds.result')} ${result.Re.toFixed(0)} → ${t('calcDetails.step2.reynolds.regime')} <strong>${t('calcDetails.step2.reynolds.' + result.regime)}</strong> 
              ${result.Re < 2300 ? '(Re < 2300)' : result.Re < 4000 ? '(2300 < Re < 4000)' : t('calcDetails.step2.reynolds.condition')}
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step2.reynolds.source')}</strong>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step2.friction.title')}</h5>
            <div class="calc-block__inputs">
              <p>• ${t('calcDetails.step2.friction.roughness')} ${toScientificLatex(geometry.roughness, 3)} / ${D.toFixed(4)} = ${toScientificLatex(epsilon_D, 3)}</p>
            </div>
            <div class="calc-block__formula">
              ${
                result.regime === 'laminar'
                  ? `
                <p>${t('calcDetails.step2.friction.laminarFlow')}</p>
                <p>\\( f = \\frac{64}{Re} = \\frac{64}{${result.Re.toFixed(0)}} = ${result.f.toFixed(6)} \\)</p>
              `
                  : `
                <p>${t('calcDetails.step2.friction.correlation')}</p>
                <p>\\( f = ${result.f.toFixed(6)} \\)</p>
                <p><em>${t('calcDetails.step2.friction.note')}</em></p>
              `
              }
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step2.friction.result')} ${result.f.toFixed(6)}
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step2.friction.source')}</strong>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step2.pressureDrop.title')}</h5>
            <div class="calc-block__inputs">
              <p>• ${t('calcDetails.step2.pressureDrop.segmentLength')} ${geometry.length.toFixed(2)} m</p>
            </div>
            <div class="calc-block__formula">
              <p>${t('calcDetails.step2.pressureDrop.equation')}</p>
              <p>\\( \\Delta P = f \\frac{L}{D} \\frac{\\rho V^2}{2} \\)</p>
              <p>\\( \\Delta P = ${result.f.toFixed(6)} \\times \\frac{${geometry.length.toFixed(2)}}{${D.toFixed(4)}} \\times \\frac{${water.rho.toFixed(2)} \\times ${V.toFixed(3)}^2}{2} \\)</p>
              <p>\\( \\Delta P = ${result.dP.toFixed(2)} \\text{ Pa} \\)</p>
            </div>
            <div class="calc-block__result">
              ${(() => {
                const dP_kPa = result.dP / 1000;
                const dP_display = window.UnitConverter
                  ? UnitConverter.fromSI('pressure', dP_kPa)
                  : dP_kPa;
                const pressureUnit = window.UnitConverter
                  ? UnitConverter.getUnitInfo('pressure').label.replace('g', '')
                  : 'kPa';
                return `${t('calcDetails.step2.pressureDrop.result')} ${result.dP.toFixed(1)} Pa (${dP_display.toFixed(2)} ${pressureUnit})`;
              })()}
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step2.pressureDrop.source')}</strong>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Affiche la convection interne
     */
    displayConvectionInternal: function (result, geometry, config, water) {
      const t = (key) => (window.I18n ? I18n.t(key) : key);
      const Pr = (water.mu * water.cp) / water.k;
      const D = geometry.D_inner;
      const L = geometry.length;

      // Déterminer la corrélation utilisée
      let correlationName = '';
      let correlationFormula = '';
      if (result.regime === 'laminar') {
        correlationName = t('calcDetails.step3.correlations.hausen');
        correlationFormula =
          'Nu = 3.66 + (0.0668 × (D/L) × Re × Pr) / (1 + 0.04 × [(D/L) × Re × Pr]^(2/3))';
      } else {
        if (result.Re > 10000) {
          correlationName = t('calcDetails.step3.correlations.dittusBoelter');
          correlationFormula = 'Nu = 0.023 × Re^0.8 × Pr^0.4';
        } else {
          correlationName = t('calcDetails.step3.correlations.gnielinski');
          correlationFormula =
            'Nu = ((f/8) × (Re-1000) × Pr) / (1 + 12.7 × (f/8)^0.5 × (Pr^(2/3) - 1))';
        }
      }

      const Nu = (result.h_int * D) / water.k;

      return `
        <div class="calc-block">
          <h4 class="calc-block__title">${t('calcDetails.step3.title')}</h4>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step3.prandtl.title')}</h5>
            <div class="calc-block__formula">
              <p>\\( Pr = \\frac{\\mu c_p}{k} = \\frac{${toScientificLatex(water.mu, 3)} \\times ${water.cp.toFixed(0)}}{${water.k.toFixed(3)}} = ${Pr.toFixed(3)} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step3.prandtl.result')} ${Pr.toFixed(3)}
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step3.nusselt.title')}</h5>
            <div class="calc-block__inputs">
              <p>• Re = ${result.Re.toFixed(0)}, Pr = ${Pr.toFixed(3)}, D/L = ${(D / L).toFixed(6)}</p>
            </div>
            <div class="calc-block__formula">
              <p><strong>${t('calcDetails.step3.nusselt.correlation')} ${correlationName}</strong></p>
              <p><em>${correlationFormula}</em></p>
              <p>\\( Nu_{int} = ${Nu.toFixed(2)} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step3.nusselt.result')} ${Nu.toFixed(2)}
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step3.nusselt.source')}</strong>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step3.coefficient.title')}</h5>
            <div class="calc-block__formula">
              <p>\\( h_{int} = \\frac{Nu \\times k}{D} = \\frac{${Nu.toFixed(2)} \\times ${water.k.toFixed(3)}}{${D.toFixed(4)}} = ${result.h_int.toFixed(2)} \\text{ W/(m}^2\\text{·K)} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step3.coefficient.result')}<sub>int</sub> = ${result.h_int.toFixed(1)} W/(m²·K)
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Affiche la convection externe
     */
    displayConvectionExternal: function (result, config, _air) {
      const t = (key) => (window.I18n ? I18n.t(key) : key);
      const D_outer_final = config.insulation
        ? config.geometry.D_outer + 2 * config.insulation.thickness
        : config.geometry.D_outer;

      const isForced = config.ambient.V_wind > 0.1;
      const pipeMat = MaterialProperties.getMaterialProperties(config.geometry.material);

      // Estimer Nu externe (on ne l'a pas directement dans result) - Non utilisé actuellement
      // const Nu_ext = (result.h_ext * D_outer_final) / air.k - result.h_ext * 0.1; // Approximation

      return `
        <div class="calc-block">
          <h4 class="calc-block__title">${t('calcDetails.step4.title')}</h4>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step4.convection.title')}</h5>
            <div class="calc-block__inputs">
              <p>• ${t('calcDetails.step4.convection.outerDiameter')}<sub>ext</sub> = ${(D_outer_final * 1000).toFixed(1)} mm</p>
              ${isForced ? `<p>• ${t('calcDetails.step4.convection.windSpeed')}<sub>wind</sub> = ${config.ambient.V_wind.toFixed(1)} m/s (${(config.ambient.V_wind * 3.6).toFixed(1)} km/h)</p>` : ''}
            </div>
            <div class="calc-block__formula">
              ${
                isForced
                  ? `
                <p><strong>${t('calcDetails.step4.convection.forcedConvection')}</strong></p>
                <p>${t('calcDetails.step4.convection.reynoldsAir')} \\( Re_{air} = \\frac{\\rho_{air} V_{wind} D_{ext}}{\\mu_{air}} \\)</p>
                <p>${t('calcDetails.step4.convection.correlation')}</p>
              `
                  : `
                <p><strong>${t('calcDetails.step4.convection.naturalConvection')}</strong></p>
                <p>${t('calcDetails.step4.convection.rayleighCorrelation')}</p>
              `
              }
              <p><em>h<sub>conv</sub> ${t('calcDetails.step4.convection.calculated')}</em></p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step4.convection.result')}<sub>conv</sub> ≈ ${(result.h_ext * 0.85).toFixed(1)} W/(m²·K)
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step4.convection.source')}</strong>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step4.radiation.title')}</h5>
            <div class="calc-block__inputs">
              <p>• ${t('calcDetails.step4.radiation.emissivity')} ${pipeMat.emissivity.toFixed(3)}</p>
              <p>• ${t('calcDetails.step4.radiation.stefanBoltzmann')} 5.67×10⁻⁸ W/(m²·K⁴)</p>
            </div>
            <div class="calc-block__formula">
              <p>${t('calcDetails.step4.radiation.linearized')}</p>
              <p>\\( h_{rad} = \\varepsilon \\sigma (T_s^2 + T_{amb}^2)(T_s + T_{amb}) \\)</p>
              <p><em>${t('calcDetails.step4.radiation.surfaceTemp')}<sub>s</sub> ${t('calcDetails.step4.radiation.surfaceTempNote')}</em></p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step4.radiation.result')}<sub>rad</sub> ≈ ${(result.h_ext * 0.15).toFixed(1)} W/(m²·K)
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step4.radiation.source')}</strong>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step4.total.title')}</h5>
            <div class="calc-block__formula">
              <p>\\( h_{ext} = h_{conv} + h_{rad} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step4.total.result')}<sub>ext</sub> = ${result.h_ext.toFixed(1)} W/(m²·K)
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Affiche les résistances thermiques
     */
    displayThermalResistances: function (result, geometry, config) {
      const t = (key) => (window.I18n ? I18n.t(key) : key);
      const pipeMat = MaterialProperties.getMaterialProperties(geometry.material);
      const D_i = geometry.D_inner;
      const D_o = geometry.D_outer;
      const L = geometry.length;

      let html = `
        <div class="calc-block">
          <h4 class="calc-block__title">${t('calcDetails.step5.title')}</h4>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step5.series.title')}</h5>
            <div class="calc-block__formula">
              <p><strong>R<sub>conv,int</sub></strong> ${t('calcDetails.step5.series.convInternal')}</p>
              <p>\\( R_{conv,int} = \\frac{1}{h_{int} \\pi D_i L} = \\frac{1}{${result.h_int.toFixed(1)} \\times \\pi \\times ${D_i.toFixed(4)} \\times ${L.toFixed(2)}} \\)</p>
              
              <p><strong>R<sub>cond,pipe</sub></strong> ${t('calcDetails.step5.series.condPipe')}</p>
              <p>\\( R_{cond,pipe} = \\frac{\\ln(D_o/D_i)}{2\\pi k_{pipe} L} = \\frac{\\ln(${D_o.toFixed(4)}/${D_i.toFixed(4)})}{2\\pi \\times ${pipeMat.k.toFixed(1)} \\times ${L.toFixed(2)}} \\)</p>
      `;

      if (config.insulation) {
        const insulMat = MaterialProperties.getMaterialProperties(config.insulation.material);
        const D_o_insul = D_o + 2 * config.insulation.thickness;
        const materialI18nKey = UIUtils.getInsulationI18nKey(config.insulation.material);
        const materialName = t(`insulation.materials.${materialI18nKey}`);

        html += `
              <p><strong>R<sub>cond,insul</sub></strong> ${t('calcDetails.step5.series.condInsulation')} ${materialName}) :</p>
              <p>\\( R_{cond,insul} = \\frac{\\ln(D_{o,insul}/D_o)}{2\\pi k_{insul} L} = \\frac{\\ln(${D_o_insul.toFixed(4)}/${D_o.toFixed(4)})}{2\\pi \\times ${insulMat.k.toFixed(3)} \\times ${L.toFixed(2)}} \\)</p>
        `;
      }

      const D_ext_final = config.insulation ? D_o + 2 * config.insulation.thickness : D_o;
      html += `
              <p><strong>R<sub>conv,ext</sub></strong> ${t('calcDetails.step5.series.convExternal')}</p>
              <p>\\( R_{conv,ext} = \\frac{1}{h_{ext} \\pi D_{ext} L} = \\frac{1}{${result.h_ext.toFixed(1)} \\times \\pi \\times ${D_ext_final.toFixed(4)} \\times ${L.toFixed(2)}} \\)</p>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step5.total.title')}</h5>
            <div class="calc-block__formula">
              <p>\\( R_{total} = R_{conv,int} + R_{cond,pipe} ${config.insulation ? '+ R_{cond,insul}' : ''} + R_{conv,ext} \\)</p>
              <p>\\( R_{total} = ${result.R_total.toFixed(6)} \\text{ K/W} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step5.total.result')}<sub>total</sub> = ${result.R_total.toFixed(6)} K/W
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step5.ua.title')}</h5>
            <div class="calc-block__formula">
              <p>\\( UA = \\frac{1}{R_{total}} = \\frac{1}{${result.R_total.toFixed(6)}} = ${(1 / result.R_total).toFixed(3)} \\text{ W/K} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step5.ua.result')} ${(1 / result.R_total).toFixed(2)} W/K
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step5.ua.source')}</strong>
            </div>
          </div>
        </div>
      `;

      return html;
    },

    /**
     * Affiche la méthode NTU
     */
    displayNTU: function (result, segmentResult, config, water) {
      const t = (key) => (window.I18n ? I18n.t(key) : key);
      const UA = 1 / result.R_total;
      const C = config.fluid.m_dot * water.cp;
      const NTU = result.NTU;
      const epsilon = 1 - Math.exp(-NTU);

      return `
        <div class="calc-block">
          <h4 class="calc-block__title">${t('calcDetails.step6.title')}</h4>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step6.ntu.title')}</h5>
            <div class="calc-block__inputs">
              <p>• UA = ${UA.toFixed(2)} W/K</p>
              <p>• ṁ = ${config.fluid.m_dot.toFixed(3)} kg/s</p>
              <p>• c<sub>p</sub> = ${water.cp.toFixed(0)} J/(kg·K)</p>
            </div>
            <div class="calc-block__formula">
              <p>${t('calcDetails.step6.ntu.fluidCapacity')}</p>
              <p>\\( C = \\dot{m} c_p = ${config.fluid.m_dot.toFixed(3)} \\times ${water.cp.toFixed(0)} = ${C.toFixed(1)} \\text{ W/K} \\)</p>
              <p>${t('calcDetails.step6.ntu.transferUnits')}</p>
              <p>\\( NTU = \\frac{UA}{C} = \\frac{${UA.toFixed(2)}}{${C.toFixed(1)}} = ${NTU.toFixed(6)} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step6.ntu.result')} ${NTU.toFixed(6)}
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step6.effectiveness.title')}</h5>
            <div class="calc-block__formula">
              <p>${t('calcDetails.step6.effectiveness.exchanger')}<sub>amb</sub> ${t('calcDetails.step6.effectiveness.constant')}<sub>∞</sub> ${t('calcDetails.step6.effectiveness.infinity')}</p>
              <p>\\( \\varepsilon = 1 - e^{-NTU} = 1 - e^{-${NTU.toFixed(6)}} = ${epsilon.toFixed(6)} \\)</p>
            </div>
            <div class="calc-block__result">
              ${t('calcDetails.step6.effectiveness.result')} ${(epsilon * 100).toFixed(3)}%
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step6.outletTemp.title')}</h5>
            <div class="calc-block__inputs">
              <p>• T<sub>in</sub> = ${segmentResult.T_in.toFixed(2)}°C</p>
              <p>• T<sub>amb</sub> = ${config.ambient.T_amb.toFixed(1)}°C</p>
            </div>
            <div class="calc-block__formula">
              <p>\\( T_{out} = T_{amb} + (T_{in} - T_{amb}) \\times e^{-NTU} \\)</p>
              <p>\\( T_{out} = ${config.ambient.T_amb.toFixed(1)} + (${segmentResult.T_in.toFixed(2)} - ${config.ambient.T_amb.toFixed(1)}) \\times e^{-${NTU.toFixed(6)}} \\)</p>
              <p>\\( T_{out} = ${result.T_out.toFixed(2)} \\text{°C} \\)</p>
            </div>
            <div class="calc-block__result">
              → <strong>${t('calcDetails.step6.outletTemp.result')}<sub>out</sub> = ${result.T_out.toFixed(2)}°C</strong>
            </div>
          </div>
          
          <div class="calc-block__subsection">
            <h5>${t('calcDetails.step6.heatLoss.title')}</h5>
            <div class="calc-block__formula">
              <p>\\( Q_{loss} = \\dot{m} c_p (T_{in} - T_{out}) \\)</p>
              <p>\\( Q_{loss} = ${config.fluid.m_dot.toFixed(3)} \\times ${water.cp.toFixed(0)} \\times (${segmentResult.T_in.toFixed(2)} - ${result.T_out.toFixed(2)}) \\)</p>
              <p>\\( Q_{loss} = ${result.Q_loss.toFixed(2)} \\text{ W} = ${(result.Q_loss / 1000).toFixed(3)} \\text{ kW} \\)</p>
            </div>
            <div class="calc-block__result">
              → <strong>${t('calcDetails.step6.heatLoss.result')}<sub>loss</sub> = ${result.Q_loss.toFixed(1)} W (${(result.Q_loss / 1000).toFixed(2)} kW)</strong>
            </div>
            <div class="calc-block__reference">
              <strong>${t('calcDetails.step6.heatLoss.source')}</strong>
            </div>
          </div>
        </div>
      `;
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
            Le tableau montre l'évolution des paramètres le long de la conduite.
          </p>
          
          <div class="calc-table-wrapper">
            <table class="calc-table">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Position<br/>[m]</th>
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
                  <td>${i + 1}${i === 0 ? ' 📋' : ''}</td>
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
