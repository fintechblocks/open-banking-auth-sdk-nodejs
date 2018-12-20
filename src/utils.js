'use strict';

const jose = require('node-jose');
const { Issuer } = require('openid-client');
const jwt = require('jsonwebtoken');
const q = require('q');

module.exports = {
  createClient: createClient,
  jwtSign: jwtSign,
  decodeJwt: decodeJwt
}

async function createClient(clientId, privateKey, tokenEndpointUri, authEndpointUri) {
  Issuer.defaultHttpOptions = { timeout: 120000 };
  const token_endpoint_auth_signing_alg_values_supported = ["RS256"];
  const issuer = new Issuer({
    token_endpoint: tokenEndpointUri,
    authorization_endpoint: authEndpointUri,
    token_endpoint_auth_signing_alg_values_supported: token_endpoint_auth_signing_alg_values_supported
  });
  const keystore = jose.JWK.createKeyStore();
  await keystore.add(privateKey, 'pem');

  var client = new issuer.Client({
    client_id: clientId,
    token_endpoint_auth_method: 'private_key_jwt',
    request_object_signing_alg: 'RS256'
  }, keystore);

  client.CLOCK_TOLERANCE = 10;
  return client;
}

function jwtSign(payload, secret, options) {
  var deferred = q.defer();
  jwt.sign(payload, secret, options, function (err, signature) {
    if (err) deferred.reject(err);
    else deferred.resolve(signature);
  });
  return deferred.promise;
}

function decodeJwt(token) {
  return jwt.decode(token, {complete: true});
}