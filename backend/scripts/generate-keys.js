/**
 * Key Generator Script
 * 
 * This script generates secure random keys for JWT authentication.
 * Run with: node scripts/generate-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a random string of specified length
function generateSecureKey(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// Main function
function generateKeys() {
  console.log('\n=== JWT Secret Key Generator ===\n');
  
  // Generate keys
  const jwtSecret = generateSecureKey(32); // 32 bytes = 64 hex chars
  const jwtRefreshSecret = generateSecureKey(64); // 64 bytes = 128 hex chars
  
  console.log('Generated Keys:');
  console.log('----------------');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  console.log('\n');
  
  // Ask if user wants to update .env files
  console.log('Copy these values to your .env.production file for production use.');
  console.log('Never commit these secrets to your repository!');
  console.log('\n');
}

// Run the generator
generateKeys(); 