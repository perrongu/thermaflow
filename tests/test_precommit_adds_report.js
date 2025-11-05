#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Test: hook pre-commit – ajout du rapport');

const hookPath = path.join(__dirname, '..', '.git', 'hooks', 'pre-commit');

assert(fs.existsSync(hookPath), 'Le hook pre-commit doit exister');

const hookContent = fs.readFileSync(hookPath, 'utf8');

assert(
  hookContent.includes('git add docs/AUTOMATED_VERIFICATION_LATEST.md'),
  'Le hook pre-commit doit ajouter le rapport AUTOMATED_VERIFICATION_LATEST.md au commit'
);

console.log('✅ Hook pre-commit valide');
