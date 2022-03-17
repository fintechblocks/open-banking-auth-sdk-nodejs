# NodeJs-SDK

## What is NodeJs-SDK?

This SDK provides tools for the integration of the Open Banking authorization flow into your NodeJs server application.

This repository contains two subfolders:

* */src* contains the SDK source code
* */example* contains an example of how to use the SDK

## How to use SDK

First read through the Authorization part of API documentation.

Account-information API documentation: `https://<sandbox_portal_host_of_the_bank>/api-documentation/account-info-1.0`

Payment-initiation API documentation: `https://<sandbox_portal_host_of_the_bank>/api-documentation/payment-init-1.0`

### Create an OpenBankingAuth instance

Function: **OpenBankingAuth(clientId, privateKey, certificateOrPublicKey, redirectUri, tokenEndpointUri, authEndpointUri, scope, issuer, jwksUri) - constructor**

#### Required parameters

* clientId (e.g. myApp@account-info.1.0)
* privateKey (your private key)
* certificateOrPublicKey (your certificate or public key which has to be uploaded on the developer portal)
* redirectUri (the OAuth2 callback URL of your application)
* tokenEndpointUri (token endpoint URL of OIDC server)
* authEndpointUri (authentication endpoint URL of OIDC server)
* scope (depends on API, read documentation)
* jwksUri (certs endpoint URL of OIDC server)
* issuer = (sandbox endpoint URL of OIDC server);

#### Usage

```javascript
const OpenBankingAuth = require('../src/OpenBankingAuth').OpenBankingAuth;
...
const accountInfoAuth = new OpenBankingAuth(clientId, privateKey, certificateOrPublicKey, redirectUri, tokenEndpointUri, authEndpointUri, scope, issuer, jwksUri);
```

### Get an access-token

Function: **getAccessToken():string**

#### Usage

```javascript
const accessToken = await accountInfoAuth.getAccessToken();
```

### Generate authorization URL

Function: **generateAuthorizationUrl(intentId, state, nonce):string**

#### Required parameters

* intentId (identification of previously created intent, e.g. ConsentId)
* state (random string)
* nonce (random string)

#### Usage

```javascript
const authUrl = await accountInfoAuth.generateAuthorizationUrl(intentId, state, nonce);
```

### Exchange authorization code to tokens

Function: **exchangeToken(code):object**

#### Required parameters

* code (the authorization code received from the authorization server)

#### Usage

```javascript
const newTokens = await accountInfoAuth.exchangeToken(code);
```

## Extra functionality

### Create signature header

Function: **createSignatureHeader(body):string**

#### Required parameters

* body (intent, e.g. an account-request)

#### Usage

```javascript
const xJwsSignature = await accountInfoAuth.createSignatureHeader(body);
```

### Check if a token is expired

Function: **isTokenExpired(token [, expiredAfterSeconds]):boolean**

#### Required parameters

* token (jwt)

#### Optional parameters

* expiredAfterSeconds (number of seconds * 1000)

#### Usage

```javascript
const isExpired = accountInfoAuth.isTokenExpired(token, 5000); // will token expire after five seconds?
```

### Use a refresh token

Function: **refreshToken(refreshToken):object**

#### Required parameters

* refresh token

#### Usage

```javascript
const newTokens = accountInfoAuth.refreshToken(refreshToken);
```

## How to run the example

* Open `example/config/config.json` and replace settings with the correct values
* Overwrite `example/config/privatekey.key` with your own private key. Filename must be `privatekey.key`
* Overwrite `example/config/certificateOrPublicKey` with your own certificate or public key. Filename must be `certificateOrPublicKey`
* Run example

```shell
cd example
npm install
npm start
```

Open your browser and navigate to `http://localhost:3000/account-info` or `http://localhost:3000/payment-init`.
