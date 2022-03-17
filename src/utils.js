'use strict';

const jose = require('node-jose');
const { Issuer } = require('openid-client');
const jwt = require('jsonwebtoken');

module.exports = {
  createClient: createClient,
  jwtSign: jwtSign,
  decodeJwt: decodeJwt,
  generateKeyIdForCertificateOrPublicKey: generateKeyIdForCertificateOrPublicKey
}

async function createClient(clientId, privateKey, certificateOrPublicKey, tokenEndpointUri, authEndpointUri, issuer, jwksUri) {
  await checkKeyBitLength(privateKey);
  Issuer.defaultHttpOptions = {
    timeout: 120000
  };
  const tokenEndpointAuthSigningAlgValuesSupported = ["RS256"];
  const createdIssuer = new Issuer({
    token_endpoint: tokenEndpointUri,
    authorization_endpoint: authEndpointUri,
    token_endpoint_auth_signing_alg_values_supported: tokenEndpointAuthSigningAlgValuesSupported,
    issuer: issuer,
    jwks_uri: jwksUri
  });
  const keyId = await generateKeyIdForCertificateOrPublicKey(certificateOrPublicKey);
  const keystore = await createKeystoreFromPrivateKeyWithKeyId(privateKey, keyId);

  const client = new createdIssuer.Client({
    client_id: clientId,
    token_endpoint_auth_method: 'private_key_jwt',
    request_object_signing_alg: 'RS256'
  }, keystore.toJSON(true));

  client.CLOCK_TOLERANCE = 10;
  return client;
}

async function createKeystoreFromPrivateKeyWithKeyId(privateKey, keyID) {
  const keystore = jose.JWK.createKeyStore();
  const key = await jose.JWK.asKey(privateKey, 'pem');
  const keyJson = key.toJSON(true);
  keyJson.kid = keyID;
  await keystore.add(keyJson, 'pem');
  return keystore;
}

async function generateKeyIdForCertificateOrPublicKey(certificateOrPublicKey) {
  const keystore = jose.JWK.createKeyStore();
  const generatedKeystoreKey = await keystore.add(certificateOrPublicKey, 'pem');
  return generatedKeystoreKey.kid;
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
  const keystore = jose.JWK.createKeyStore();
  const key = await keystore.add(privateKey, 'pem');
  if (key.length < 2048) {
    throw new Error(`The signing key's size is ${key.length} bits which is not secure enough for the RS256 algorithm. See https://tools.ietf.org/html/rfc7518#section-3.3 for more information.`);
  }
}