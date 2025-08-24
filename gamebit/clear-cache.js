#!/usr/bin/env node

// Simple script to clear the tmp cache files
const fs = require('fs');
const path = require('path');

const tmpDir = path.join(__dirname, 'tmp');
const runtimeOpsPath = path.join(tmpDir, 'runtimeOps.json');
const componentPath = path.join(tmpDir, 'tmpPhaserPreview.tsx');

console.log('🧹 Clearing tmp cache files...');

let cleared = 0;

if (fs.existsSync(runtimeOpsPath)) {
  fs.unlinkSync(runtimeOpsPath);
  console.log('✅ Deleted runtimeOps.json');
  cleared++;
}

if (fs.existsSync(componentPath)) {
  fs.unlinkSync(componentPath);
  console.log('✅ Deleted tmpPhaserPreview.tsx');
  cleared++;
}

if (cleared === 0) {
  console.log('ℹ️  No cache files found to delete');
} else {
  console.log(`🎉 Cleared ${cleared} cache file(s). Next generation will use LLM.`);
}
