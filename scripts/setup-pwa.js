#!/usr/bin/env node

/**
 * PWA Setup Script
 * Helps configure and validate PWA settings for PANDAS Tracker
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 PANDAS Tracker PWA Setup\n');

// Check if manifest.json exists
const manifestPath = path.join(__dirname, '../public/manifest.json');
if (fs.existsSync(manifestPath)) {
    console.log('✅ manifest.json found');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`   Name: ${manifest.name}`);
    console.log(`   Short Name: ${manifest.short_name}`);
    console.log(`   Icons: ${manifest.icons.length} configured`);
} else {
    console.log('❌ manifest.json not found');
}

// Check if service worker exists
const swPath = path.join(__dirname, '../public/sw.js');
if (fs.existsSync(swPath)) {
    console.log('✅ Service Worker (sw.js) found');
} else {
    console.log('❌ Service Worker (sw.js) not found');
}

// Check if index.html has PWA meta tags
const indexPath = path.join(__dirname, '../index.html');
if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const hasPWAMeta = indexContent.includes('apple-mobile-web-app-capable');
    const hasManifest = indexContent.includes('manifest.json');

    console.log(`${hasPWAMeta ? '✅' : '❌'} iOS PWA meta tags`);
    console.log(`${hasManifest ? '✅' : '❌'} Manifest link in HTML`);
}

console.log('\n📱 Next Steps:\n');
console.log('1. Generate app icons (see MOBILE_APP_DEPLOYMENT_GUIDE.md)');
console.log('2. Test PWA installation on your device');
console.log('3. Share the app URL with users:\n');
console.log('   🔗 https://pandas-tracker-production.web.app\n');
console.log('4. Users can "Add to Home Screen" for app-like experience\n');

console.log('📚 For detailed instructions, see:');
console.log('   - MOBILE_APP_DEPLOYMENT_GUIDE.md (complete guide)');
console.log('   - README.md (quick start)\n');

console.log('💡 Tip: Your app is already live and installable as a PWA!');
console.log('   Test it now on your mobile device.\n');