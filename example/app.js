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
MIIEoQIBAAKCAQBLbLCp+k6SEb0jN0KuwmpsKP+VpGpNVXWMDUxPYcXLk+LGXtmy
/sZel8sgouvSzsFOBDW3Y5C/lhV8uiyVXwzS2RREjWh4jgcMLyuiHWqRNnyoe875
meB4bjzUsWn31lFZMlkSzmjsUEeUDEGX27GAkCZJVhbn5HgzdaAPEklZYPfHYcG0
efrTW8ic3R//b5sXyEAeRQ1u/Ekc/12NFc/Nhs0e68TF3uNxjQxr3KLuZYnHsFbM
0dTIsQP5ftvvOpq4fV7ql+OojuOv1qyP48pEvqfmYqRTQJdOt6LShYJDDw/Ozh95
lxFBHzXxo5Iv3L36xpLv9mZyxmLi3pNZCelzAgMBAAECggEAMwrQF4fkKifFBpL8
FoZNPPsV0/AbXFBsJyZMsR/qmlVvT22bB+4w0o0JEwIOc3AmEyT4MS45I95uliTr
zP4xEHOFqsrDm2oKTO2TKrebicAE5oQ60mGXLgj0M8AIhYdNL/7JlteG2/2MIx2U
Oi+b1PQ4ZMLU54OO8Mw2UFzAtLIVYN5DMJH0Kg7gx6Hm+z2uuIOkB2447pyYQhoU
YLPVNKEDgQa8HT4wlolU39WxNUzxKKJM+5TdlKuDUoVWd2sAe0nXc5iYQh1zGllJ
K4tpqA/H27cTzKElpgA3ZG0yTVdws9FaxLwHcEHp2UGyHJiH05lKhEPsERLZ8teH
puJNSQKBgQCQyZrbAWOSyZUTB+T7wYQnaGLeIQxsfokwyPkkPor1uRuoCsMVaNcQ
+Q1bvnTnY77AujBUZCOprzDsVNxXwMjgIgpCJnXbU8g2MpSbqllNh4wcn9MLbqfj
ME54vzt8kuAO9lk8W79YkR8dcyR92pOECd5KdsUlczQs8u4m/zIY9QKBgQCFW9px
/mPV2l6RwdCay4GjJ2/iijuoLbBcec6IEaC5GFkcprTQePXNcdsDtt+/IEsTNDvz
zlt+PQWD7CLgjegq+yYCejENb3Zc6VPY0kI4Db1CrrDNJljin8Dr8LvWuRdsgv53
6nu9z76+MaAvr4SkazxNOH1wO1MjcHhmfuCXxwKBgHGg1tgzkdq8OzNRScLOj5GB
2b2sQBzRfYd84hIwx0uq92p877dYrRhT7MjogsSpwiVsucsxP8/GfuWqf7aaxMsp
y9U4a9wyN3lZXsl/+k/fJfW89JsPP9ELszoOEnhkqFT1vvigpF20nq+1Epl2tbi1
KfBUn8oRTIxOJtsSAlYVAoGAC3AeY0qTW4M4Oz4pWy17N/go84Axr7IDf1r/KNKC
O33oHrn5pivJwU4zn7TuqeDmL4Z6YeXgGQq4z2DQePwS3qTd1LaQQHu/5iYpB964
yT/8bJy5E09nrkBPdq0WH0uOw8LUeoqFBHmt/XgaKhzevo9oA6OFtruP3OlHmlrl
fn8CgYBIzhNsAdFqqgx3RxIucKa+ctOZ++H9n1cNaUExv/smMSI5INHytEKNX9t2
DmwsG8gA/nR+YdnnOOEQcC/ejmt5S+PebYt4Q6xI+Hd4qR+xeHNdPeqkD7+87S69
yIt0SflvjKgeYr1KVt4Cmpwa4EkU344wYuHj/H2yPwfOYsiyYw==
-----END RSA PRIVATE KEY-----`;
var keyID = 'AfFNfYXZf3arkkxv_9zqRU4d1jp1b39Edw1bxfEK5-4';
var tokenEndpointUri = 'https://<sandbox_api_host_of_the_bank>/auth/realms/ftb-sandbox/protocol/openid-connect/token';
var authEndpointUri = 'https://<sandbox_api_host_of_the_bank>/auth/realms/ftb-sandbox/protocol/openid-connect/auth';

// Create account-information access
var accountInfoClientId = 'ftb-demo-app@account-info-1.0';
var accountInfoApiUrl = 'https://<sandbox_api_host_of_the_bank>/account-info-1.0/open-banking/v3.1/aisp';
var accountInfoScope = 'accounts';
var accountInfoRedirectUri = 'http://localhost:3000/account-info';
var accountInfotIssuer = 'https://<sandbox_api_host_of_the_bank>/auth/realms/ftb-sandbox';
var accountInfoJwksUri = 'https://<sandbox_api_host_of_the_bank>/auth/realms/ftb-sandbox/protocol/openid-connect/certs';

var accountAccessConsent = {
  "Data": {
    "Permissions": [
      "ReadAccountsBasic"
    ],
    "ExpirationDateTime": "2050-08-02T00:00:00+00:00",
    "TransactionFromDateTime": "2017-05-03T00:00:00+00:00",
    "TransactionToDateTime": "2019-12-03T00:00:00+00:00"
  },
  "Risk": {}
};
var accountInfoAuth = new OpenBankingAuth(accountInfoClientId, privateKey, keyID, accountInfoRedirectUri, tokenEndpointUri, authEndpointUri, accountInfoScope, accountInfotIssuer, accountInfoJwksUri);

// Create payment-initiation access
var paymentInitClientId = 'ftb-demo-app@payment-init-1.0';
var paymentInitApiUrl = 'https://<sandbox_api_host_of_the_bank>/payment-init-1.0/open-banking/v3.1/pisp';
var paymentInitScope = 'payments';
var paymentInitRedirectUri = 'http://localhost:3000/payment-init';
var paymentInitIssuer = 'https://<sandbox_api_host_of_the_bank>/auth/realms/ftb-sandbox';
var paymentInitJwksUri = 'https://<sandbox_api_host_of_the_bank>/auth/realms/ftb-sandbox/protocol/openid-connect/certs';

var payment = {
  "Data": {
    "Initiation": {
      "InstructionIdentification": "ACME412",
      "EndToEndIdentification": "FRESCO.21302.GFX.20",
      "InstructedAmount": {
        "Amount": "165.88",
        "Currency": "HUF"
      },
      "CreditorAccount": {
        "SchemeName": "IBAN",
        "Identification": "HU14120103740010183300300001",
        "Name": "ACME Inc",
        "SecondaryIdentification": "0002"
      },
      "RemittanceInformation": {
        "Reference": "FRESCO-101",
        "Unstructured": "Internal ops code 5120101"
      }
    }
  },
  "Risk": {}
};
var paymentId;
var paymentInitAuth = new OpenBankingAuth(paymentInitClientId, privateKey, keyID, paymentInitRedirectUri, tokenEndpointUri, authEndpointUri, paymentInitScope, paymentInitIssuer, paymentInitJwksUri);

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
      var signature = await accountInfoAuth.createSignatureHeader(accountAccessConsent);
      var createdAccountAccessConsent = await callAPI({
        accessToken: accessToken,
        apiUrl: accountInfoApiUrl,
        path: 'account-access-consents',
        method: 'POST',
        body: accountAccessConsent,
        headers: {
          'x-jws-signature': signature
        }
      });
      var state = crypto.randomBytes(12).toString('hex');
      var nonce = crypto.randomBytes(12).toString('hex');
      var authUrl = await accountInfoAuth.generateAuthorizationUrl(createdAccountAccessConsent.Data.ConsentId, state, nonce);
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
      var newTokens = await paymentInitAuth.exchangeToken(req.query.code);
      var result = await callAPI({
        accessToken: newTokens.access_token,
        apiUrl: paymentInitApiUrl,
        path: `domestic-payment-consents/${paymentId}`,
        method: 'GET'
      });
      res.status(200).send(result);
    } else {
      var accessToken = await paymentInitAuth.getAccessToken();

      var issuer = 'C=UK, ST=England, L=London, O=Acme Ltd.'
      var signature = await paymentInitAuth.createSignatureHeader(payment);
      var createdPayment = await callAPI({
        accessToken: accessToken,
        apiUrl: paymentInitApiUrl,
        path: 'domestic-payment-consents',
        method: 'POST',
        body: payment,
        headers: {
          'x-jws-signature': signature,
          'x-idempotency-key': randomstring.generate()
        }
      });
      paymentId = createdPayment.Data.ConsentId;
      var state = crypto.randomBytes(12).toString('hex');
      var nonce = crypto.randomBytes(12).toString('hex');
      var authUrl = await paymentInitAuth.generateAuthorizationUrl(createdPayment.Data.ConsentId, state, nonce);
      res.redirect(authUrl);
    }
  } catch (error) {
    console.log(`${new Date().toISOString()} | Unexpected error: ${error}`);
    res.status(500).send(error.message);
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