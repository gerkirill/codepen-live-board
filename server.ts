import * as express from 'express';
import * as WebSocket from 'ws';
import { AddressInfo } from 'net';
import fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as bodyParser from 'body-parser';

import { Participant } from './common/Participant';

const PARTICIPANTS: Participant[] = [
  {
    penUrl: 'https://codepen.io/gerkirill/pen/xQqjQw?editors=1010',
    fullpageUrl: 'https://s.codepen.io/gerkirill/fullpage/xQqjQw',
    name: 'Кирилл',
    changeCount: 0
  }
];

const app = express();
app.use(express.static(__dirname + '/www/dist'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const server = app.listen(process.env.PORT || 2018, () => {
  const addrInfo: AddressInfo = <AddressInfo>server.address();
  console.log(`Server started on port ${addrInfo.port}`);
});
const wss = new WebSocket.Server({ server });
// let socket: WebSocket;

wss.on('connection', (ws: WebSocket) => {
  // socket = ws;
  //connection is up, let's add a simple simple event
  ws.on('message', (message: string) => {
    //log the received message and send it back to the client
    console.log('received: %s', message);
    // ws.send(`Hello, you sent -> ${message}`);
  });
  //send immediately a feedback to the incoming connection    
  // ws.send('Hi there, I am a WebSocket server');
  // ws.send("{boo: 'who'}");
});


app.get('/fetch', async (req, res) => {
  const url = req.query.url;
  if (url.indexOf('https://s.codepen.io') !== 0) {
    res.end('URL now allowed');
    return;
  }
  try {
    // const resp = await fetch('https://s.codepen.io/gerkirill/fullpage/BqVWeK', {
    const resp = await fetch(url, {
      headers: { 'Referer': 'https://codepen.io' },
    });
    const text = await resp.text();
    res.end(text);
  } catch (e) {
    res.end(e.toString());
  }
})

app.post('/register', async (req, res) => {
  var fullpageUrl = req.body.penUrl.replace('codepen.io', 's.codepen.io');
  fullpageUrl = fullpageUrl.replace('\/pen\/', '/fullpage/');

  // todo: validate
  if (fullpageUrl.indexOf('gerkirill') !== -1) {
    return res.status(500).json({ error: 'Сначала клонируй мой CodePen ;)' });
  }
  if (fullpageUrl.indexOf('https://s.codepen.io') !== 0) {
    return res.status(500).json({ error: 'C ссылкой на CodePen что-то не так' });
  }

  PARTICIPANTS.push({
    penUrl: req.body.penUrl, //https://codepen.io/gerkirill/pen/BqVWeK
    fullpageUrl: fullpageUrl,
    name: req.body.participantName,
    changeCount: 0
  })

  res.json({ status: 'OK' });
})

app.get('/api/participants', async (req, res) => {
  res.json(PARTICIPANTS);
})

setInterval(() => {
  const now = new Date();
  PARTICIPANTS.forEach(async participant => {
    if (!participant.lastCheckTime || now.getTime() - participant.lastCheckTime.getTime() > 4 * 1000) {
      participant.lastCheckTime = now;
      try {
        const resp = await fetch(participant.fullpageUrl, {
          headers: { 'Referer': 'https://codepen.io' },
        });
        const text = await resp.text();
        const md5 = crypto.createHash('md5').update(text).digest('hex');
        if (md5 !== participant.lastHash) {
          participant.lastHash = md5;
          participant.lastChangeTime = new Date();
          participant.changeCount++;
          wss.clients.forEach(client => {
            client.send(JSON.stringify(participant));
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  });
}, 5 * 1000);