#!/usr/bin/env node

// Simple test script to verify the game component loads correctly
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing tmpPhaserPreview.tsx component...');

// Check if files exist
const runtimeOpsPath = path.join(__dirname, 'tmp/runtimeOps.json');
const componentPath = path.join(__dirname, 'tmp/tmpPhaserPreview.tsx');

if (!fs.existsSync(runtimeOpsPath)) {
  console.log('❌ runtimeOps.json not found in tmp/');
  process.exit(1);
}

if (!fs.existsSync(componentPath)) {
  console.log('❌ tmpPhaserPreview.tsx not found in tmp/');
  process.exit(1);
}

// Validate JSON
try {
  const runtimeOps = JSON.parse(fs.readFileSync(runtimeOpsPath, 'utf8'));
  console.log('✅ runtimeOps.json is valid JSON');
  console.log('🎮 Game:', runtimeOps.metadata?.title || 'Untitled');
  console.log('🌍 World:', `${runtimeOps.world.width}×${runtimeOps.world.height}`);
  console.log('⚙️  Systems:', runtimeOps.systems.length);
  console.log('🎯 Entities:', runtimeOps.entities?.length || 0);
  
  // Check for player entity
  const player = runtimeOps.entities?.find(e => 
    e.components.some(c => c.type === 'PlayerController')
  );
  
  if (player) {
    console.log('👤 Player found:', player.id);
    const transform = player.components.find(c => c.type === 'Transform');
    console.log('📍 Player position:', `${transform?.x || 0},${transform?.y || 0}`);
  } else {
    console.log('⚠️  No player entity found');
  }
  
  // Check for collectibles
  const collectibles = runtimeOps.entities?.filter(e => 
    e.components.some(c => c.type === 'Collider' && c.tag === 'collectible')
  ) || [];
  
  console.log('🌟 Collectibles:', collectibles.length);
  
} catch (error) {
  console.log('❌ runtimeOps.json is invalid:', error.message);
  process.exit(1);
}

// Basic component syntax check
const componentCode = fs.readFileSync(componentPath, 'utf8');

if (componentCode.includes('export default function TmpPhaserPreview')) {
  console.log('✅ Component export found');
} else {
  console.log('❌ Component export not found');
}

if (componentCode.includes("import('phaser')")) {
  console.log('✅ Phaser import found');
} else {
  console.log('❌ Phaser import not found');
}

console.log('');
console.log('🎉 Component ready for testing!');
console.log('💡 Open the plan page in your browser to test the game');
console.log('⌨️  Use arrow keys to move the player (P)');
console.log('🌟 Collect stars (*) by moving over them');
console.log('');
