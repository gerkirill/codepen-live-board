# CodePEN live board

## To start locally

- `npm install`
- `npm run dev`
- open http://localhost:2018 in your browser

## Implementation details

The server code is located in server.ts file. It serves static front-end files from the www/dist folder, provides REST API as well as websocket connection.

Front-end is built using parcel bundler.

The server grabs each participant code-pen each 5 seconds to check if it has been changed. If so - notifies all WS clients about that. After that - FE uses /fetch endpoint to load full-page version of the changed code-pen.

## Articles I've used in order to create this

- https://chrome.google.com/webstore/detail/referer-control/hnkcfpcejkafcihlgbojoidoihckciin/related
- https://medium.com/factory-mind/websocket-node-js-express-step-by-step-using-typescript-725114ad5fe4

## Examples of conversion of the pen URL to the full-page URL

- https://codepen.io/anon/pen/zmaLZG  => https://s.codepen.io/anon/fullpage/zmaLZG
- https://codepen.io/gerkirill/pen/BqVWeK => https://s.codepen.io/gerkirill/fullpage/BqVWeK
