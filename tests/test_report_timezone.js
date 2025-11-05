#!/usr/bin/env node

if (process.env.THERMAFLOW_TEST_CHILD === '1') {
  console.log('⏭️ test_report_timezone.js ignoré (exécution imbriquée)');
  process.exit(0);
}

const assert = require('assert');
const fs = require('fs');
const { execSync } = require('child_process');
const { ensureReportGenerated } = require('./helpers/automated_verification_test_utils.js');

console.log('🧪 Test: rapport – fuseau horaire local');

const reportPath = ensureReportGenerated();
const reportContent = fs.readFileSync(reportPath, 'utf8');

const match = reportContent.match(/\*\*Date\*\*: ([0-9:-]+ [0-9:]+)/);
assert(match, 'Le rapport devrait contenir un timestamp local');

const reportTimestamp = match[1];
const reportDate = new Date(reportTimestamp.replace(' ', 'T'));
assert(!Number.isNaN(reportDate.getTime()), `Timestamp invalide: ${reportTimestamp}`);

const localNowRaw = execSync('date +"%Y-%m-%d %H:%M:%S"', { encoding: 'utf8' }).trim();
const localDate = new Date(localNowRaw.replace(' ', 'T'));
const diffSeconds = Math.abs((reportDate.getTime() - localDate.getTime()) / 1000);

assert(
  diffSeconds <= 2,
  `Le timestamp doit être en heure locale (écart ${diffSeconds.toFixed(3)} s)`
);

console.log('✅ Timestamp local vérifié');
