/**
 * roughness.js
 *
 * Rugosité de surface par matériau de tuyauterie (en mètres)
 */

(function () {
  'use strict';

  const MATERIAL_ROUGHNESS = Object.freeze({
    steel: 0.045e-3, // m (acier commercial)
    copper: 0.0015e-3, // m (cuivre)
    stainless_steel: 0.015e-3, // m (inox)
  });

  window.MaterialRoughness = { MATERIAL_ROUGHNESS };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MATERIAL_ROUGHNESS };
  }
})();
