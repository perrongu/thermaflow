#!/usr/bin/env node

if (process.env.THERMAFLOW_TEST_CHILD === '1') {
  console.log('⏭️ test_report_filename.js ignoré (exécution imbriquée)');
  process.exit(0);
}

const assert = require('assert');
const fs = require('fs');
const {
  ensureReportGenerated,
  REPORT_FILENAME,
  REPORT_PATH,
  listReportFiles,
} = require('./helpers/automated_verification_test_utils.js');

console.log('🧪 Test: rapport – nom de fichier fixe');

const reportPath = ensureReportGenerated();

assert(
  fs.existsSync(reportPath),
  `Le fichier ${REPORT_FILENAME} devrait exister après la vérification`
);

const reportFiles = listReportFiles();
const datedReports = reportFiles.filter((file) =>
  /^AUTOMATED_VERIFICATION_\d{4}-\d{2}-\d{2}\.md$/.test(file)
);

assert.strictEqual(
  datedReports.length,
  0,
  `Aucun rapport daté ne doit être généré, fichiers trouvés: ${datedReports.join(', ')}`
);

console.log('✅ Nom de fichier fixe vérifié');
