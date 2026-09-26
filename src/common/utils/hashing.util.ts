import * as crypto from 'crypto';

export function getHashSHA1(data) {
  return crypto.createHash('sha1').update(data).digest('hex');
}

export async function getHmac(message, secretKey, algorithm = 'SHA-256') {
  // Convert the message and secretKey to Uint8Array
  const encoder = new TextEncoder();
  const messageUint8Array = encoder.encode(message);
  const keyUint8Array = encoder.encode(secretKey);

  // Import the secretKey as a CryptoKey
  const cryptoKey = await crypto.webcrypto.subtle.importKey(
    'raw',
    keyUint8Array,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign'],
  );

  // Sign the message with HMAC and the CryptoKey
  const signature = await crypto.webcrypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageUint8Array,
  );

  // Convert the signature ArrayBuffer to a hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}
