#!/usr/bin/env node

const { execSync } = require('child_process');
const qrcode = require('qrcode-terminal');
const http = require('http');

console.log('🔍 Getting tunnel URL from ngrok (Format 2)...\n');

function getTunnelURL() {
  try {
    // Get tunnel URL from ngrok API
    const response = execSync('curl -s http://127.0.0.1:4040/api/tunnels', { encoding: 'utf-8' });
    const data = JSON.parse(response);
    
    if (data.tunnels && data.tunnels.length > 0) {
      // Find the exp.direct URL
      for (const tunnel of data.tunnels) {
        if (tunnel.public_url && tunnel.public_url.includes('exp.direct')) {
          // Convert https:// to exp://
          const expUrl = tunnel.public_url.replace(/^https?:\/\//, 'exp://');
          return expUrl;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting tunnel URL:', error.message);
    return null;
  }
}

const tunnelUrl = getTunnelURL();

if (tunnelUrl) {
  console.log(`✅ Found tunnel URL (Format 2): ${tunnelUrl}\n`);
  console.log('📱 QR Code:\n');
  qrcode.generate(tunnelUrl, { small: true });
  console.log(`\n✅ Scan this QR code with Expo Go app!\n`);
  console.log(`🔗 Or use this URL: ${tunnelUrl}\n`);
} else {
  console.log('❌ Could not find tunnel URL.');
  console.log('Make sure Expo is running with --tunnel flag.\n');
  process.exit(1);
}

