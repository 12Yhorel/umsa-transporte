#!/usr/bin/env node

/**
 * Script para generar un JWT Secret seguro
 * Uso: node generate-jwt-secret.js
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 JWT Secret generado:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(secret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('💡 Copia este valor y úsalo como JWT_SECRET en tus variables de entorno\n');
console.log('Ejemplo en .env:');
console.log(`JWT_SECRET=${secret}\n`);
