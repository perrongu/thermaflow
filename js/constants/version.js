/**
 * version.js
 *
 * Source de vérité unique pour la version de ThermaFlow.
 *
 * @module version
 */

(function versionModule() {
  'use strict';

  const VERSION = '1.1.3';

  if (typeof window !== 'undefined') {
    window.ThermaFlowVersion = { VERSION };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VERSION };
  }
})();
