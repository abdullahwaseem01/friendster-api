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
The following variables require declaration within src/.env
```bash
PORT=<PORT>
MONGODB_URI=<MONGODB URI>
SALT_ROUNDS=<INTEGER>
JWT_SECRET=<STRING>
JWT_REFRESH_SECRET= <STRING>

```
### Run API
```bash
npm start
```

### Authorization 
JSON web tokens are used to authorize routes and are required to verify requests and return the corresponding privileges. Access token are assigned on post requests to the register route and can be passed as bearer tokens or passed within request queries and request bodies. 