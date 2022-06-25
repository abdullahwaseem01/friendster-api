# Friendify-API

## Usage 

### Clone repository 
```bash
git clone https://github.com/abdullahwaseem01/friendify-api.git
cd friendify-api
```
### Install dependencies 

```bash
npm install 
```
### Environment Variables 
The following variables require declaration within `src/.env`
```bash
PORT=<PORT>
MONGODB_URI=<MONGODB URI>
SALT_ROUNDS=<INTEGER>
JWT_SECRET=<STRING>
JWT_REFRESH_SECRET=<STRING>
ACCESS_TOKEN_EXPIRY=<SECONDS OR STRING DESCRIBING A TIME SPAN WITH VERCEL/MS>

```
### Run API
```bash
npm start
```

## Authorization 
JSON web tokens are used to authorize routes and are required to verify requests and return the corresponding privileges. Access tokens and refresh are assigned on post requests to the register route and can be passed as bearer tokens or passed within request queries and request bodies. 

Access token expiries can be set via the environment variables. Once expired, access tokens can be refreshed by passing the refresh token to any protected route. As follows:

```5
curl --location --request GET <domain>/<protected_route> \
--header 'Authorization: Bearer <refreshToken>'
```
