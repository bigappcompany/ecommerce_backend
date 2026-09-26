import * as crypto from 'crypto';

export async function aesGcmEncrypt(plaintext, secretKey) {
  const pwUtf8 = new TextEncoder().encode(secretKey); // encode secretKey as UTF-8
  const pwHash = await crypto.webcrypto.subtle.digest('SHA-256', pwUtf8); // hash the secretKey

  const iv = crypto.webcrypto.getRandomValues(new Uint8Array(12)); // get 96-bit random iv
  const ivStr = Array.from(iv)
    .map((b) => String.fromCharCode(b))
    .join(''); // iv as utf-8 string

  const alg = { name: 'AES-GCM', iv: iv }; // specify algorithm to use

  const key = await crypto.webcrypto.subtle.importKey(
    'raw',
    pwHash,
    alg,
    false,
    ['encrypt'],
  ); // generate key from pw

  const ptUint8 = new TextEncoder().encode(plaintext); // encode plaintext as UTF-8
  const ctBuffer = await crypto.webcrypto.subtle.encrypt(alg, key, ptUint8); // encrypt plaintext using key

  const ctArray = Array.from(new Uint8Array(ctBuffer)); // ciphertext as byte array
  const ctStr = ctArray.map((byte) => String.fromCharCode(byte)).join(''); // ciphertext as string

  return btoa(ivStr + ctStr); // iv+ciphertext base64-encoded
}

export async function aesGcmDecrypt(ciphertext, secretKey) {
  const pwUtf8 = new TextEncoder().encode(secretKey); // encode secretKey as UTF-8
  const pwHash = await crypto.webcrypto.subtle.digest('SHA-256', pwUtf8); // hash the secretKey

  const ivStr = atob(ciphertext).slice(0, 12); // decode base64 iv
  const iv = new Uint8Array(Array.from(ivStr).map((ch) => ch.charCodeAt(0))); // iv as Uint8Array

  const alg = { name: 'AES-GCM', iv: iv }; // specify algorithm to use

  const key = await crypto.webcrypto.subtle.importKey(
    'raw',
    pwHash,
    alg,
    false,
    ['decrypt'],
  ); // generate key from pw

  const ctStr = atob(ciphertext).slice(12); // decode base64 ciphertext
  const ctUint8 = new Uint8Array(
    Array.from(ctStr).map((ch) => ch.charCodeAt(0)),
  ); // ciphertext as Uint8Array
  // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

  const plainBuffer = await crypto.webcrypto.subtle.decrypt(alg, key, ctUint8); // decrypt ciphertext using key
  const plaintext = new TextDecoder().decode(plainBuffer); // plaintext from ArrayBuffer
  return plaintext; // return the plaintext
}
