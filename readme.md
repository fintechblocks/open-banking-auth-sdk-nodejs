# NodeJs-SDK

**Table of Contents:**

- [1. What is NodeJs-SDK?](#1-what-is-nodejs-sdk)
- [2. Supported Node.js Versions](#2-supported-nodejs-versions)
- [3. How to use SDK](#3-how-to-use-sdk)
  - [3.1. Create an OpenBankingAuth instance](#31-create-an-openbankingauth-instance)
    - [3.1.1. Required parameters](#311-required-parameters)
    - [3.1.2. Usage](#312-usage)
  - [3.2. Get an access-token](#32-get-an-access-token)
    - [3.2.1. Usage](#321-usage)
  - [3.3. Generate authorization URL](#33-generate-authorization-url)
    - [3.3.1. Required parameters](#331-required-parameters)
    - [3.3.2. Usage](#332-usage)
  - [3.4. Exchange authorization code to tokens](#34-exchange-authorization-code-to-tokens)
    - [3.4.1. Required parameters](#341-required-parameters)
    - [3.4.2. Usage](#342-usage)
- [4. Extra functionality](#4-extra-functionality)
  - [4.1. Create signature header](#41-create-signature-header)
    - [4.1.1. Required parameters](#411-required-parameters)
    - [4.1.2. Usage](#412-usage)
  - [4.2. Check if a token is expired](#42-check-if-a-token-is-expired)
    - [4.2.1. Required parameters](#421-required-parameters)
    - [4.2.2. Optional parameters](#422-optional-parameters)
    - [4.2.3. Usage](#423-usage)
  - [4.3. Use a refresh token](#43-use-a-refresh-token)
    - [4.3.1. Required parameters](#431-required-parameters)
    - [4.3.2. Usage](#432-usage)
- [5. How to run the example](#5-how-to-run-the-example)

## 1. What is NodeJs-SDK?

This SDK provides tools for the integration of the Open Banking authorization flow into your NodeJs server application.

This repository contains two subfolders:

- */src* contains the SDK source code
- */example* contains an example of how to use the SDK

## 2. Supported Node.js Versions

> 16.18.1 (NPM > 8.19.2)

## 3. How to use SDK

First read through the Authorization part of API documentation.

Account-information API documentation: `https://<sandbox_portal_host_of_the_bank>/api-documentation/account-info-ob`

Payment-initiation API documentation: `https://<sandbox_portal_host_of_the_bank>/api-documentation/payment-init-ob`

### 3.1. Create an OpenBankingAuth instance

Function: **OpenBankingAuth(clientId, privateKey, certificateOrPublicKey, redirectUri, tokenEndpointUri, authEndpointUri, scope, issuer, jwksUri) - constructor**

#### 3.1.1. Required parameters

- clientId (e.g. myApp@account-info-ob)
- privateKey (your private key)
- certificateOrPublicKey (your certificate or public key which has to be uploaded on the developer portal)
- redirectUri (the OAuth2 callback URL of your application)
- tokenEndpointUri (token endpoint URL of OIDC server)
- authEndpointUri (authentication endpoint URL of OIDC server)
- scope (depends on API, read documentation)
- jwksUri (certs endpoint URL of OIDC server)
- issuer = (sandbox endpoint URL of OIDC server);

#### 3.1.2. Usage

```javascript
const OpenBankingAuth = require('../src/OpenBankingAuth').OpenBankingAuth;
...
const accountInfoAuth = new OpenBankingAuth(clientId, privateKey, certificateOrPublicKey, redirectUri, tokenEndpointUri, authEndpointUri, scope, issuer, jwksUri);
```

### 3.2. Get an access-token

Function: **getAccessToken():string**

#### 3.2.1. Usage

```javascript
const accessToken = await accountInfoAuth.getAccessToken();
```

### 3.3. Generate authorization URL

Function: **generateAuthorizationUrl(intentId, state, nonce):string**

#### 3.3.1. Required parameters

- intentId (identification of previously created intent, e.g. ConsentId)
- state (random string)
- nonce (random string)

#### 3.3.2. Usage

```javascript
const authUrl = await accountInfoAuth.generateAuthorizationUrl(intentId, state, nonce);
```

### 3.4. Exchange authorization code to tokens

Function: **exchangeToken(code):object**

#### 3.4.1. Required parameters

- code (the authorization code received from the authorization server)

#### 3.4.2. Usage

```javascript
const newTokens = await accountInfoAuth.exchangeToken(code);
```

## 4. Extra functionality

### 4.1. Create signature header

Function: **createSignatureHeader(body):string**

#### 4.1.1. Required parameters

- body (intent, e.g. an account-request)

#### 4.1.2. Usage

```javascript
const xJwsSignature = await accountInfoAuth.createSignatureHeader(body);
```

### 4.2. Check if a token is expired

Function: **isTokenExpired(token [, expiredAfterSeconds]):boolean**

#### 4.2.1. Required parameters

- token (jwt)

#### 4.2.2. Optional parameters

- expiredAfterSeconds (number of seconds * 1000)

#### 4.2.3. Usage

```javascript
const isExpired = accountInfoAuth.isTokenExpired(token, 5000); // will token expire after five seconds?
```

### 4.3. Use a refresh token

Function: **refreshToken(refreshToken):object**

#### 4.3.1. Required parameters

- refresh token

#### 4.3.2. Usage

```javascript
const newTokens = accountInfoAuth.refreshToken(refreshToken);
```

## 5. How to run the example

- Open `example/config/config.json` and replace settings with the correct values
- Overwrite `example/config/privatekey.key` with your own private key. Filename must be `privatekey.key`
- Overwrite `example/config/certificateOrPublicKey` with your own certificate or public key. Filename must be `certificateOrPublicKey`
- Run example

```shell
cd example
npm install
npm start
```

Open your browser and navigate to `http://localhost:3000/account-info` or `http://localhost:3000/payment-init`.
