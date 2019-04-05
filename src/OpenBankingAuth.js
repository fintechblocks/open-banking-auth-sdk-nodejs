'use strict';

const utils = require('./utils');
module.exports.OpenBankingAuth = class OpenBankingAuth {
  constructor(clientId, privateKey, keyID, redirectUri, tokenEndpointUri, authEndpointUri, scope, issuer, jwksUri) {
    this.clientId = clientId;
    this.privateKey = privateKey;
    this.keyID = keyID;
    this.redirectUri = redirectUri;
    this.tokenEndpointUri = tokenEndpointUri;
    this.authEndpointUri = authEndpointUri;
    this.scope = scope;
    this.issuer = issuer; 
    this.jwksUri = jwksUri;
  }

  async getAccessToken() {
    var client = await utils.createClient(this.clientId, this.privateKey, this.tokenEndpointUri, this.authEndpointUri, this.issuer, this.jwksUri);
    this.client = client;
    const accessTokenWithClientCredentials = await client.grant({
      grant_type: 'client_credentials',
      scope: this.scope
    });
    return accessTokenWithClientCredentials.access_token;
  }

  async generateAuthorizationUrl(intentId, state, nonce) {
    var requestObject = await utils.jwtSign({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      claims: {
        userinfo: {
          openbanking_intent_id: {
            value: intentId
          }
        },
        id_token: {
          openbanking_intent_id: {
            value: intentId
          }
        }
      }
    }, this.privateKey, { algorithm: 'RS256' });

    return this.client.authorizationUrl({
      scope: `openid ${this.scope}`,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      nonce: nonce,
      state: state,
      request: requestObject
    });
  }

  async exchangeToken(code) {
    var tokensWithAuthCode = await this.client.grant({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri
    });
    return tokensWithAuthCode;
  }

  async refreshToken(refreshToken) {
    const authorizationTokens = await this.client.refresh(refreshToken);
    return authorizationTokens;
  }

  isTokenExpired(token, expiredAfterSeconds) {
    var decodedJwt = utils.decodeJwt(token);
    var expiration = decodedJwt.payload.exp * 1000;
    var now = new Date().getTime();
    if (expiredAfterSeconds) now += expiredAfterSeconds;
    return expiration < now;
  }

  async createSignatureHeader(body) {
    //because of different system-time
    const yesterday = new Date().getTime() - 86400;
    var jwtHeader = {
      alg: 'RS256',
      kid: this.keyID,
      b64: false,
      'http://openbanking.org.uk/iat': yesterday,
      'http://openbanking.org.uk/iss': 'C=UK, ST=England, L=London, O=Acme Ltd.',
      crit: ['b64', 'http://openbanking.org.uk/iat', 'http://openbanking.org.uk/iss']
    };
    var signature = await utils.jwtSign(body, this.privateKey, {
      algorithm: 'RS256',
      header: jwtHeader,
      noTimestamp: true
    });
    return `${signature.split('.')[0]}..${signature.split('.')[2]}`;
  }
}