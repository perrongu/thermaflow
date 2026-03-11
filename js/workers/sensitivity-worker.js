/* global importScripts */
/**
 * sensitivity-worker.js
 *
 * Web Worker for 2D sensitivity matrix calculation.
 * Runs the heavy 225-cell (15x15) matrix calculation off the main thread.
 *
 * Architecture:
 *   - Loads all required modules via importScripts() in dependency order
 *   - Handles 'calculate' messages by delegating to SensitivityMatrix.calculateMatrix()
 *   - Posts 'result' on success, 'error' on failure
 *
 * Shim:
 *   Workers do not have a `window` global. All ThermaFlow modules export to
 *   `window.ModuleName`. Mapping `self.window = self` makes those exports
 *   land on `self`, which is the Worker's global scope.
 *
 * Usage (from main thread):
 *   const worker = new Worker('js/workers/sensitivity-worker.js');
 *   worker.postMessage({ type: 'calculate', payload: { ... } });
 *   worker.addEventListener('message', function(e) { ... });
 */

'use strict';

// ---------------------------------------------------------------------------
// Shim: expose window in Worker context
// ---------------------------------------------------------------------------
// IIFE modules guard with `if (typeof window !== 'undefined')`.
// In a Worker there is no `window`, only `self`. Mapping them lets every
// module export on the Worker's global scope without any module changes.
if (typeof window === 'undefined') {
  self.window = self;
}

// ---------------------------------------------------------------------------
// Import all required modules in dependency order
// ---------------------------------------------------------------------------
// Paths are relative to THIS worker file (js/workers/).

importScripts(
  // Constants (no deps)
  '../constants/version.js',
  '../constants/flow-regimes.js',
  '../constants/thresholds.js',
  '../constants/roughness.js',

  // Data tables (no deps)
  '../../data/fluids/air-tables.js',
  '../../data/fluids/water-tables.js',
  '../../data/materials/properties.js',

  // Properties (depend on data tables)
  '../properties/air-properties.js',
  '../properties/water-properties.js',
  '../properties/material-properties.js',

  // Formulas (depend on properties + constants)
  '../formulas/reynolds.js',
  '../formulas/geometry.js',
  '../formulas/pressure-basic.js',

  // Correlations (depend on formulas)
  '../correlations/friction-factor.js',
  '../correlations/nusselt-internal.js',
  '../correlations/nusselt-external.js',
  '../correlations/radiation.js',

  // Calculations (depend on correlations)
  '../calculations/thermal-resistance.js',
  '../calculations/heat-transfer.js',

  // Engine (depend on calculations)
  '../engine/pipe-segment.js',
  '../engine/pipe-network.js',

  // UI utilities (no DOM deps, pure logic)
  '../ui/sensitivity-params.js',
  '../ui/utils.js',

  // Sensitivity matrix (depends on all of the above)
  '../ui/sensitivity-matrix.js'
);

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.addEventListener('message', function (e) {
  const data = e.data;
  if (!data || typeof data !== 'object') {
    return;
  }

  const { type, payload } = data;

  if (type === 'calculate') {
    if (!payload || typeof payload !== 'object') {
      self.postMessage({
        type: 'error',
        payload: 'Payload manquant ou invalide pour le calcul de la matrice',
      });
      return;
    }

    const { baseConfig, paramX, paramY, rangeX, rangeY, resolution } = payload;

    // Validate parameter keys and resolution
    const ALLOWED_PARAMS = ['L', 'm_dot', 'T_in', 'T_amb', 'V_wind', 't_insul'];
    if (ALLOWED_PARAMS.indexOf(paramX) === -1 || ALLOWED_PARAMS.indexOf(paramY) === -1) {
      self.postMessage({ type: 'error', payload: 'Invalid parameter key' });
      return;
    }
    if (typeof resolution !== 'number' || resolution < 2 || resolution > 50) {
      self.postMessage({ type: 'error', payload: 'Invalid resolution' });
      return;
    }

    try {
      const result = self.SensitivityMatrix.calculateMatrix(
        baseConfig,
        paramX,
        paramY,
        rangeX,
        rangeY,
        resolution
      );
      self.postMessage({ type: 'result', payload: result });
    } catch (error) {
      self.postMessage({
        type: 'error',
        payload: error && error.message ? error.message : String(error),
      });
    }
  }
});
