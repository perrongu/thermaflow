#!/usr/bin/env node

if (process.env.THERMAFLOW_TEST_CHILD === '1') {
  console.log('⏭️ test_report_no_signature.js ignoré (exécution imbriquée)');
  process.exit(0);
}

const assert = require('assert');
const fs = require('fs');
const { ensureReportGenerated } = require('./helpers/automated_verification_test_utils.js');

console.log('🧪 Test: rapport – absence de section signature');

const reportPath = ensureReportGenerated();
const reportContent = fs.readFileSync(reportPath, 'utf8');

assert(!reportContent.includes('**Nom**:'), 'Le rapport ne doit plus contenir la mention **Nom**');
assert(
  !reportContent.includes('**Signature**:'),
  'Le rapport ne doit plus contenir la mention **Signature**'
);

console.log('✅ Section signature absente');
