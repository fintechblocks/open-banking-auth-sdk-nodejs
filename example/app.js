'use strict';

const axios = require('axios');
const ConvertedAxiosError = require('axios-error-converter');
const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const randomstring = require("randomstring");
const OpenBankingAuth = require('../src/OpenBankingAuth').OpenBankingAuth;
const config = require('./config/config.json');
const privateKey = fs.readFileSync('./config/privatekey.key');
const certificateOrPublicKey = fs.readFileSync('./config/certificateOrPublicKey');
const app = express();
const port = 3000;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const accountInfoAuth = new OpenBankingAuth(config.accountInfo.clientId, privateKey, certificateOrPublicKey, config.accountInfo.redirectUri, config.tokenEndpointUri, 
  config.authEndpointUri, config.accountInfo.scope, config.accountInfo.tokenIssuer, config.accountInfo.jwksUri);
const paymentInitAuth = new OpenBankingAuth(config.paymentInit.clientId, privateKey, certificateOrPublicKey, config.paymentInit.redirectUri, config.tokenEndpointUri, 
  config.authEndpointUri, config.paymentInit.scope, config.paymentInit.tokenIssuer, config.paymentInit.jwksUri);

let paymentId;

app.get('/account-info', async function (req, res) {
  try {
    if (req.query.code) {
      const newTokens = await accountInfoAuth.exchangeToken(req.query.code);
      const result = await callAPI({
        accessToken: newTokens.access_token,
        apiUrl: config.accountInfo.apiUrl,
        path: 'accounts',
        method: 'GET'
      });
      res.status(200).send(result);
    } else {
      const accessToken = await accountInfoAuth.getAccessToken();
      const signature = await accountInfoAuth.createSignatureHeader(config.accountInfo.consent);
      const createdAccountAccessConsent = await callAPI({
        accessToken: accessToken,
        apiUrl: config.accountInfo.apiUrl,
        path: 'account-access-consents',
        method: 'POST',
        body: config.accountInfo.consent,
        headers: {
          'x-jws-signature': signature
        }
      });
      const state = crypto.randomBytes(12).toString('hex');
      const nonce = crypto.randomBytes(12).toString('hex');
      const authUrl = await accountInfoAuth.generateAuthorizationUrl(createdAccountAccessConsent.Data.ConsentId, state, nonce);
      res.redirect(authUrl);
    }
  } catch (error) {
    console.log(`${new Date().toISOString()} | Unexpected error: ${error}`);
    res.status(500).send(error.message);
  }
});

app.get('/payment-init', async function (req, res) {
  try {
    if (req.query.code) {
      const newTokens = await paymentInitAuth.exchangeToken(req.query.code);
      const result = await callAPI({
        accessToken: newTokens.access_token,
        apiUrl: config.paymentInit.apiUrl,
        path: `domestic-payment-consents/${paymentId}`,
        method: 'GET'
      });
      res.status(200).send(result);
    } else {
      const accessToken = await paymentInitAuth.getAccessToken();
      const signature = await paymentInitAuth.createSignatureHeader(config.paymentInit.consent);
      const createdPayment = await callAPI({
        accessToken: accessToken,
        apiUrl: config.paymentInit.apiUrl,
        path: 'domestic-payment-consents',
        method: 'POST',
        body: config.paymentInit.consent,
        headers: {
          'x-jws-signature': signature,
          'x-idempotency-key': randomstring.generate()
        }
      });
      paymentId = createdPayment.Data.ConsentId;
      const state = crypto.randomBytes(12).toString('hex');
      const nonce = crypto.randomBytes(12).toString('hex');
      const authUrl = await paymentInitAuth.generateAuthorizationUrl(createdPayment.Data.ConsentId, state, nonce);
      res.redirect(authUrl);
    }
  } catch (error) {
    console.log(`${new Date().toISOString()} | Unexpected error: ${error}`);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}`));

async function callAPI(options) {
  const api = axios.create({
    baseURL: options.apiUrl
  });
  try {
    let result;
    if (options.method === "POST") {
      result = await api.post(options.path, options.body, { headers: getRequestHeaders(options) });
    } else if (options.method === "GET") {
      result = await api.get(options.path, { headers: getRequestHeaders(options) });
    }
    return result.data;
  } catch (error) {
    throw new ConvertedAxiosError(error);
  }
}

function getRequestHeaders(options) {
  let headers = {
    'Authorization': `Bearer ${options.accessToken}`
  };
  if (options.headers) {
    for (let key of Object.keys(options.headers)) {
      headers[key] = options.headers[key];
    }
  }
  return headers;
}