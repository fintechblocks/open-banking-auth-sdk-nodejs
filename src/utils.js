'use strict';

const jose = require('jose');
const crypto = require('crypto')
const { Issuer } = require('openid-client');
const jwt = require('jsonwebtoken');

module.exports = {
  createClient: createClient,
  jwtSign: jwtSign,
  decodeJwt: decodeJwt,
  generateKeyIdForCertificateOrPublicKey: generateKeyIdForCertificateOrPublicKey,
  determineSigningAlgorithm: determineSigningAlgorithm,
}

async function createClient(clientId, privateKey, tokenEndpointUri, authEndpointUri, issuer, jwksUri, signingAlgorithm) {
  await checkKeyBitLength(privateKey);
  Issuer.defaultHttpOptions = getIssuerOptions();

  const createdIssuer = new Issuer({
    token_endpoint: tokenEndpointUri,
    authorization_endpoint: authEndpointUri,
    token_endpoint_auth_signing_alg_values_supported: [signingAlgorithm],
    issuer: issuer,
    jwks_uri: jwksUri
  });

  const keystore = { keys: [] };
  const jwk = await getJwkFromPrivateKey(privateKey);
  keystore.keys.push(jwk);

  const client = new createdIssuer.Client({
    client_id: clientId,
    token_endpoint_auth_method: 'private_key_jwt',
    request_object_signing_alg: signingAlgorithm
  }, keystore);

  client.CLOCK_TOLERANCE = 10;
  return client;
}

function getIssuerOptions() {
  return {
    timeout: 120000,
    rejectUnauthorized: false
  }
}

function jwtSign(payload, secret, options) {
  return new Promise(function (resolve, reject) {
    jwt.sign(payload, secret, options, function (err, signature) {
      if (err) {
        reject(err);
      } else {
        resolve(signature);
      }
    });
  });
}

function decodeJwt(token) {
  return jwt.decode(token, {
    complete: true
  });
}

async function checkKeyBitLength(privateKey) {
  const jwk = await getJwkFromPrivateKey(privateKey);
  if (jwk.kty === 'EC' && jwk.length < 256) {
    throw new Error(`The signing key's size is ${jwk.length} bits which is not secure enough for the ES256 algorithm. See https://tools.ietf.org/html/rfc7518#section-3.4 for more information.`);
  } else if (jwk.kty !== 'EC' && jwk.length < 2048) {
    throw new Error(`The signing key's size is ${jwk.length} bits which is not secure enough for the RS256 algorithm. See https://tools.ietf.org/html/rfc7518#section-3.3 for more information.`);
  }
}

async function generateKeyIdForCertificateOrPublicKey(certificateOrPublicKey) {
  try {
    const algorithm = determineSigningAlgorithm(certificateOrPublicKey);
    let key;
    if (isCert(certificateOrPublicKey)) {
      key = await jose.importX509(certificateOrPublicKey, algorithm);
    } else {
      key = await jose.importSPKI(certificateOrPublicKey, algorithm);
    }
    const jwk = await jose.exportJWK(key);
    const thumbprint = await jose.calculateJwkThumbprint(jwk);
    const kid = jose.base64url.encode(thumbprint);
    return kid;
  } catch (error) {
    throw new Error('generating KID for certificate or public key failed');
  }
}

function isCert(certificateOrPublicKey) {
  return certificateOrPublicKey.indexOf('-----BEGIN CERTIFICATE-----') > -1;
}

function determineSigningAlgorithm(certificateOrPublicKey) {
  try {
    const keyObject = crypto.createPublicKey(certificateOrPublicKey);
    const details = keyObject.asymmetricKeyDetails;

    if (keyObject.asymmetricKeyType === 'ec') {
      switch (details.namedCurve) {
        case 'prime256v1': return 'ES256';
        case 'secp384r1': return 'ES384';
        case 'secp521r1': return 'ES512';
      }
    } else if (keyObject.asymmetricKeyType === 'rsa') {
      return 'RS256';
    } else {
      throw new Error('unknown public key algorithm');
    }
  } catch (error) {
    console.error(error);
    throw new Error('unable to determinate public key algorithm');
  }
}

function convertPrivateKeyToPkcs8(privateKey) {
  let keyObject;
  try {
    keyObject = crypto.createPrivateKey(privateKey);
  } catch (e) {
    throw new Error('converting private key to PKCS#8 failed');
  }
  const pkcs8Pem = keyObject.export({
    format: 'pem',
    type: 'pkcs8'
  }).toString();

  return pkcs8Pem.trim();
}

async function getJwkFromPrivateKey(privateKey) {
  const pkcs8 = convertPrivateKeyToPkcs8(privateKey);
  const key = await jose.importPKCS8(pkcs8);
  const jwk = await jose.exportJWK(key);
  return jwk;
}