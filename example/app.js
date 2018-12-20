'use strict';

const express = require('express');
const app = express();
const port = 3000;
const OpenBankingAuth = require('../src/OpenBankingAuth').OpenBankingAuth;
const request = require('request-promise');
var randomstring = require("randomstring");
const crypto = require('crypto');

// Common Parameters
var privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQCefIP17VA8s8bx07f0jReEarXy2+GhvUsOGXUuCIVNn/QZDd2o
IN4z43NlqAp5d1mxfrV2Qz2Fwvhg62wxD51bk8dGMAAu0RIl+z2ffozI3GzBadYz
XWuoyOM9yvnXTytxQriWUlo3HO/buWbgNsroD75nQm2cgLNzi/waejA+OwIDAQAB
AoGBAIiGDIriFjdkSmFxF0sT64lG/1uorDJOxQPtTDMOZf6bZoPanPHC9obOTU7p
tbQy6tHqq9inTa0XaizbQET3BX5NAtFki3K7M43UPDpcJxxTZHCi3C7TbxMyyS/d
3nYZpW1wZ3hYkVLiOcAfv5MlWOe9cK+DhXr7TzqrILn+d8WhAkEA1ybJ0clskH8S
QgfDx7sqsAUXcnyCp9tgMNto4jy+pE61QQwzS2nHqVzrS4PjPdeW33Xy2+lg9U6J
gpMCDH1u6wJBALyTlBwF9fwAUKfY4gnEkdd1qX0cw9emiVSKZcZ4JMK8BFj4Fpwv
/8aXHStzq0u+IEXAmm+EiLzaGgGrDzoZufECQCBqVann4RV8L7IHHXYwOuQ+QCQd
oknMAZga1piPcmGrAiAEyI2qKEzaFRFRk6EzpCWSzb5YUSVkac9kesCK/XUCQDIU
DvUSMCzn+INaeUyWwxQwzv3GscuHElk9F6IJLdn5DD6EQ5zeslIOt1Ret1K5/uAH
MfwDejyMvvNKdhS72EECQQCLnCM7qQlObXdOB7pj1faBJpNmFD4Ql7XFprccznGo
jsgjpr3E8PuK9Vn6h9+I7SNzFQyq0MAOgBmWhHNR1vYY
-----END RSA PRIVATE KEY-----`;
var keyID = 'AfFNfYXZf3arkkxv_9zqRU4d1jp1b39Edw1bxfEK5-4';
var tokenEndpointUri = 'https://oidc-1.0.sandbox.mkb.hu/auth/realms/ftb-sandbox/protocol/openid-connect/token';
var authEndpointUri = 'https://oidc-1.0.sandbox.mkb.hu/auth/realms/ftb-sandbox/protocol/openid-connect/auth';

// Create account-information access
var accountInfoClientId = 'ftb-demo-app@account-info-1.0';
var accountInfoApiUrl = 'https://api.sandbox.mkb.hu/account-info-1.0/open-banking/v1.1';
var accountInfoScope = 'accounts';
var accountInfoRedirectUri = 'http://localhost:3000/account-info';
var accountRequest = {
  "Data": {
    "Permissions": [
      "ReadAccountsBasic"
    ],
    "ExpirationDateTime": "2019-08-02T00:00:00+00:00",
    "TransactionFromDateTime": "2017-05-03T00:00:00+00:00",
    "TransactionToDateTime": "2019-12-03T00:00:00+00:00"
  },
  "Risk": {}
};
var accountInfoAuth = new OpenBankingAuth(accountInfoClientId, privateKey, keyID, accountInfoRedirectUri, tokenEndpointUri, authEndpointUri, accountInfoScope);

// Create payment-initiation access
var paymentInitClientId = 'ftb-demo-app@payment-init-1.0';
var paymentInitApiUrl = 'https://api.sandbox.mkb.hu/payment-init-1.0/open-banking/v1.1';
var paymentInitScope = 'payments';
var paymentInitRedirectUri = 'http://localhost:3000/payment-init';
var payment = {
  "Data": {
    "Initiation": {
      "InstructionIdentification": "mobilVallet123",
      "EndToEndIdentification": "29152852756654",
      "InstructedAmount": {
        "Amount": "1680.00",
        "Currency": "HUF"
      },
      "CreditorAgent": {
        "SchemeName": "BICFI",
        "Identification": "UBRTHUHB"
      },
      "CreditorAccount": {
        "SchemeName": "IBAN",
        "Identification": "HU35120103740010183300200004",
        "Name": "Deichmann Cipőkereskedelmi Korlátolt Felelősségű Társaság"
      }
    }
  },
  "Risk": {}
};
var paymentId;
var paymentInitAuth = new OpenBankingAuth(paymentInitClientId, privateKey, keyID, paymentInitRedirectUri, tokenEndpointUri, authEndpointUri, paymentInitScope);

app.get('/account-info', async function (req, res) {
  try {
    if (req.query.code) {
      var newTokens = await accountInfoAuth.exchangeToken(req.query.code);
      var result = await callAPI({
        accessToken: newTokens.access_token,
        apiUrl: accountInfoApiUrl,
        path: 'accounts',
        method: 'GET'
      });
      res.status(200).send(result);
    } else {
      var accessToken = await accountInfoAuth.getAccessToken();

      var issuer = 'C=UK, ST=England, L=London, O=Acme Ltd.'
      var signature = await accountInfoAuth.createSignatureHeader(accountRequest, issuer);
      var createdAccountRequest = await callAPI({
        accessToken: accessToken,
        apiUrl: accountInfoApiUrl,
        path: 'account-requests',
        method: 'POST',
        body: accountRequest,
        headers: {
          'x-jws-signature': signature
        }
      });
      var state = crypto.randomBytes(12).toString('hex');
      var nonce = crypto.randomBytes(12).toString('hex');
      var authUrl = await accountInfoAuth.generateAuthorizationUrl(createdAccountRequest.Data.AccountRequestId, state, nonce);
      res.redirect(authUrl);
    }
  } catch (error) {
    console.log(`${new Date().toISOString()} | Unexpected error: ${error}`);
    res.status(500).send(error);
  }
});

app.get('/payment-init', async function (req, res) {
  try {
    if (req.query.code) {
      var newTokens = await paymentInitAuth.exchangeToken(req.query.code);
      var result = await callAPI({
        accessToken: newTokens.access_token,
        apiUrl: paymentInitApiUrl,
        path: `payments/${paymentId}`,
        method: 'GET'
      });
      res.status(200).send(result);
    } else {
      var accessToken = await paymentInitAuth.getAccessToken();

      var issuer = 'C=UK, ST=England, L=London, O=Acme Ltd.'
      var signature = await paymentInitAuth.createSignatureHeader(payment, issuer);
      var createdPayment = await callAPI({
        accessToken: accessToken,
        apiUrl: paymentInitApiUrl,
        path: 'payments',
        method: 'POST',
        body: payment,
        headers: {
          'x-jws-signature': signature,
          'x-idempotency-key': randomstring.generate()
        }
      });
      paymentId = createdPayment.Data.PaymentId;
      var state = crypto.randomBytes(12).toString('hex');
      var nonce = crypto.randomBytes(12).toString('hex');
      var authUrl = await paymentInitAuth.generateAuthorizationUrl(createdPayment.Data.PaymentId, state, nonce);
      res.redirect(authUrl);
    }
  } catch (error) {
    console.log(`${new Date().toISOString()} | Unexpected error: ${error}`);
    res.status(500).send(error);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}`));

async function callAPI(options) {
  var request_options = {
    headers: {
      'Authorization': `Bearer ${options.accessToken}`
    },
    uri: `${options.apiUrl}/${options.path}`,
    method: options.method
  };
  if (options.headers) {
    for (var key of Object.keys(options.headers)) {
      request_options.headers[key] = options.headers[key];
    }
  }
  if (options.body) {
    request_options.body = options.body;
    request_options.json = true;
  }
  var accounts = await request(request_options);
  return accounts;
}