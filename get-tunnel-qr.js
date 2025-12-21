#!/usr/bin/env node

const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

console.log('🔍 Starting Expo with tunnel mode to capture QR code...\n');

// Kill any existing Expo processes
const { execSync } = require('child_process');
try {
  execSync('pkill -f "expo start"', { stdio: 'ignore' });
  execSync('sleep 2', { stdio: 'ignore' });
} catch (e) {}

// Start Expo and capture output
const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
let tunnelUrl = null;

expo.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text); // Show output in real-time
  
  // Look for tunnel URL - Format 2 (exp.direct)
  const urlMatch = text.match(/exp:\/\/[a-zA-Z0-9\-]+-anonymous-8081\.exp\.direct/);
  if (urlMatch && !tunnelUrl) {
    tunnelUrl = urlMatch[0];
    console.log('\n\n✅ FOUND TUNNEL URL (Format 2)!\n');
    console.log(`🔗 URL: ${tunnelUrl}\n`);
    console.log('📱 QR Code:\n');
    qrcode.generate(tunnelUrl, { small: true });
    console.log(`\n✅ Scan this QR code with Expo Go app!\n`);
  }
  
  // Also look for any exp:// URL
  if (!tunnelUrl) {
    const anyUrlMatch = text.match(/exp:\/\/[^\s"']+/);
    if (anyUrlMatch) {
      tunnelUrl = anyUrlMatch[0];
      console.log('\n\n✅ FOUND CONNECTION URL!\n');
      console.log(`🔗 URL: ${tunnelUrl}\n`);
      console.log('📱 QR Code:\n');
      qrcode.generate(tunnelUrl, { small: true });
      console.log(`\n✅ Scan this QR code with Expo Go app!\n`);
    }
  }
});

expo.stderr.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stderr.write(text);
  
  // Check stderr too - Format 2 (exp.direct)
  const urlMatch = text.match(/exp:\/\/[a-zA-Z0-9\-]+-anonymous-8081\.exp\.direct/);
  if (urlMatch && !tunnelUrl) {
    tunnelUrl = urlMatch[0];
    console.log('\n\n✅ FOUND TUNNEL URL (Format 2)!\n');
    console.log(`🔗 URL: ${tunnelUrl}\n`);
    console.log('📱 QR Code:\n');
    qrcode.generate(tunnelUrl, { small: true });
    console.log(`\n✅ Scan this QR code with Expo Go app!\n`);
  }
});

expo.on('close', (code) => {
  if (!tunnelUrl) {
    console.log('\n\n⚠️  Tunnel URL not found in output.');
    console.log('The QR code should be visible in the terminal output above.');
    console.log('Look for a visual QR code pattern and a URL like: exp://u.expo.dev/xxxxx-xxxxx\n');
  }
});

// Keep process running
process.on('SIGINT', () => {
  expo.kill();
  process.exit();
});

