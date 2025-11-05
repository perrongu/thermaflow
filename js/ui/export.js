/**
 * export.js
 *
 * Export des résultats en PDF via impression native du navigateur
 *
 * Utilise window.print() pour générer un PDF propre avec mise en page
 * optimisée via @media print dans les feuilles de style.
 */

(function () {
  'use strict';

  // ========== EXPORT PDF ==========
  /**
   * Exporte les résultats en PDF via impression native
   *
   * @param {Object} networkResult - Résultats du réseau
   * @param {Object} freezeAnalysis - Analyse du gel
   * @param {Object} config - Configuration utilisée
   */
  function exportToPDF(networkResult, freezeAnalysis, config) {
    console.log('📄 Export PDF demandé');

    // Préparer l'interface pour impression
    prepareForPrint(networkResult, freezeAnalysis, config);

    // Déclencher impression native (navigateur gère PDF)
    window.print();

    // Restaurer interface après fermeture dialogue
    window.addEventListener('afterprint', restoreAfterPrint, { once: true });
  }

  // ========== PRÉPARATION IMPRESSION ==========
  function prepareForPrint(network, freeze, config) {
    // Créer et ajouter header temporaire pour PDF
    const printHeader = createPrintHeader(config);
    printHeader.id = 'temp-print-header';

    const section1 = document.getElementById('section-parameters');
    if (section1) {
      section1.insertBefore(printHeader, section1.firstChild);
    }

    // Marquer body pour styles print
    document.body.classList.add('print-mode');

    console.log('✅ Interface préparée pour impression');
  }

  // ========== CRÉATION HEADER PDF ==========
  function createPrintHeader(config) {
    const header = document.createElement('div');
    header.className = 'print-header';

    const title = document.createElement('h1');
    title.textContent = "ThermaFlow - Rapport d'analyse";

    const date = document.createElement('p');
    date.textContent = `Date: ${new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const configInfo = document.createElement('p');

    // Débit avec unités courantes
    const flowDisplayValue = UnitConverter.fromSI('flowRate', config.meta.flowM3PerHr);
    const flowFormatted = UnitConverter.format('flowRate', flowDisplayValue);

    // Pression avec unités courantes
    const pressureKPag = config.fluid.P * 100; // bar → kPa
    const pressureDisplayValue = UnitConverter.fromSI('pressure', pressureKPag);
    const pressureFormatted = UnitConverter.format('pressure', pressureDisplayValue);

    configInfo.textContent =
      `Configuration: ${config.meta.schedule} ${config.meta.nps}", ${config.geometry.material}, ${config.totalLength}m, ` +
      `Débit: ${flowFormatted}, Pression: ${pressureFormatted}`;

    header.appendChild(title);
    header.appendChild(date);
    header.appendChild(configInfo);

    return header;
  }

  // ========== RESTAURATION APRÈS IMPRESSION ==========
  function restoreAfterPrint() {
    // Retirer header temporaire
    const tempHeader = document.getElementById('temp-print-header');
    if (tempHeader) {
      tempHeader.remove();
    }

    // Retirer classe print
    document.body.classList.remove('print-mode');

    console.log('✅ Interface restaurée après impression');
  }

  // ========== EXPORT ==========
  window.Export = {
    exportToPDF,
  };
})();
