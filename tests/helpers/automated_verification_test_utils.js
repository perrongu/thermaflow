const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..', '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const REPORT_FILENAME = 'AUTOMATED_VERIFICATION_LATEST.md';
const REPORT_PATH = path.join(DOCS_DIR, REPORT_FILENAME);
const TEMP_DIR = path.join(ROOT_DIR, '.tmp');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getRunTempDir() {
  ensureDir(TEMP_DIR);
  const runDir = path.join(TEMP_DIR, `automated-verification-${process.ppid}`);
  ensureDir(runDir);
  return runDir;
}

function getMarkerPath() {
  return path.join(getRunTempDir(), 'report.json');
}

function cleanupOldReports() {
  if (fs.existsSync(REPORT_PATH)) {
    fs.rmSync(REPORT_PATH);
  }

  const reportPattern = /^AUTOMATED_VERIFICATION_.*\.md$/;
  for (const file of fs.readdirSync(DOCS_DIR)) {
    if (reportPattern.test(file) && file !== REPORT_FILENAME) {
      fs.rmSync(path.join(DOCS_DIR, file));
    }
  }
}

function runAutomatedVerification() {
  cleanupOldReports();

  const env = {
    ...process.env,
    THERMAFLOW_TEST_CHILD: '1',
    THERMAFLOW_SKIP_TESTS: '1',
    THERMAFLOW_TEST_MODE: '1',
  };

  execSync('node tests/automated_verification.js', {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
    env,
  });

  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`Le rapport ${REPORT_FILENAME} n'a pas été généré`);
  }

  fs.writeFileSync(getMarkerPath(), JSON.stringify({ generatedAt: new Date().toISOString() }));
}

function ensureReportGenerated({ force = false } = {}) {
  const markerPath = getMarkerPath();

  if (!force && fs.existsSync(markerPath) && fs.existsSync(REPORT_PATH)) {
    return REPORT_PATH;
  }

  runAutomatedVerification();
  return REPORT_PATH;
}

function listReportFiles() {
  return fs
    .readdirSync(DOCS_DIR)
    .filter((file) => file.startsWith('AUTOMATED_VERIFICATION_') && file.endsWith('.md'));
}

module.exports = {
  DOCS_DIR,
  REPORT_FILENAME,
  REPORT_PATH,
  cleanupOldReports,
  ensureReportGenerated,
  listReportFiles,
};
