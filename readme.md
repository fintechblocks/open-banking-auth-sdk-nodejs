# NodeJs-SDK #

## What is Open Banking Authorization NodeJS SDK? ##

This SDK provides tools for the integration of the Open Banking authorization flow into your NodeJs server application.

This repository contains two subfolders:
* */src* contains the SDK source code
* */example* contains an example on how to use the SDK

## How to use SDK ##

First read throught the Authorization part of API documentation.

[Account-information API documentation](https://portal.sandbox.mkb.hu/api-documentation/account-info-1.0)

[Payment-initiation API documentation](https://portal.sandbox.mkb.hu/api-documentation/payment-init-1.0)

### Create an OpenBankingAuth istance ###

**OpenBankingAuth(clientId, privateKey, keyID, redirectUri, tokenEndpointUri, authEndpointUri, scope) - constructor**

*Required parameters*

* clientId (e.g. myApp@account-info.1.0)
* privateKey (your private key, the public key has to be uploded on the developer portal)
* keyID (the id of the keypair in your keystore, can be any string)
* redirectUri (the OAuth2 callback url of your application)
* tokenEndpointUri (token endpoint uri of OIDC server)
* authEndpointUri (authentication endpoint uri of OIDC server)
* scope (depends on API, read documentation)

**Usage**

```javascript
const OpenBankingAuth = require('../src/OpenBankingAuth').OpenBankingAuth;
...
var accountInfoAuth = new OpenBankingAuth(clientId, privateKey, keyID, redirectUri, tokenEndpointUri, authEndpointUri, scope);
```

### Get an access-token ###

**getAccessToken():string**

**Usage**

```javascript
var accessToken = await accountInfoAuth.getAccessToken();
```

### Generate authorization url ###

**generateAuthorizationUrl(intentId, state, nonce):string**

*Required parameters*

* intentId (identification of previously created intent, e.g. AccountRequestId)
* state (random string)
* nonce (random string)

**Usage**

```javascript
var authUrl = await accountInfoAuth.generateAuthorizationUrl(intentId, state, nonce);
```

### Exhange authorization code to tokens ###

**exchangeToken(code):object**

*Required parameters*

* code (the authorization code received from the authorization server)

**Usage**

```javascript
var newTokens = await accountInfoAuth.exchangeToken(code);
```

## Extra functionality ##

### Create signature header ###

**createSignatureHeader(body, issuer):string**

*Required parameters*

* body (intent, e.g. an account-request)
* issuer

**Usage**
```javascript
var xJwsSignature = await accountInfoAuth.createSignatureHeader(body, issuer);
```

### Check if a token is expired ###

**isTokenExpired(token [, expiredAfterSeconds]):boolean**

*Required parameters*

* token (jwt)

*Optional parameters*

* expiredAfterSeconds (number of seconds * 1000)

**Usage**

```javascript
var isExpired = accountInfoAuth.isTokenExpired(token, 5000); // will token expire after five seconds?
```

### Use a refresh token ###

**refreshToken(refreshToken):object**

*Required parameters*

* refresh token

**Usage**

```javascript
var newTokens = accountInfoAuth.refreshToken(refreshToken);
```

## How to run the example ##

Run example.

```shell
cd example
npm start
```

Open your browser and navigate to *http//localhost:3000/account-info* or *http//localhost:3000/payment-init*.