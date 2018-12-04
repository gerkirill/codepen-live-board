import { Participant } from '../../common/Participant';

let participants: Participant[] = [];

// initially load all existing  participants from the API
(async () => {
  const resp = await fetch('/api/participants');
  participants = await resp.json();
  renderParticipants(participants);
})();

// start listening to the server events using websocket
const WS_URL = getWsUrl(window.location);
startWsClient(WS_URL);

// add registration form submit handler
document
  .querySelector('.registration-form')
  .addEventListener('submit', formSubmit);



// returns ws:// or wss:// URL corresponding to the given http:// or https:// one
function getWsUrl(currentLocation: Location) {
  const l = currentLocation;
  return ((l.protocol === "https:") ? "wss://" : "ws://") + l.hostname + (((l.port != '80') && (l.port != '443')) ? ":" + l.port : "") + l.pathname;
}

function startWsClient(websocketServerLocation: string) {
  const ws = new WebSocket(websocketServerLocation);
  ws.onmessage = (event) => {
    participants = updateParticipants(participants, JSON.parse(event.data));
    renderParticipants(participants);
  };
  ws.onclose = () => {
    // re-start with a delay
    setTimeout(() => startWsClient(websocketServerLocation), 5000);
  };
}

function updateParticipants(participants: Participant[], participant: Participant) {
  const idx = participants.findIndex( ({ penUrl }) => penUrl === participant.penUrl)
  if (idx === -1) {
    return [...participants, participant];
  } else {
    const copy = participants.slice(0);
    copy.splice(idx, 1, participant);
    return copy;
  }
}

function renderParticipants(participants: Participant[]) {
  console.log(participants);
  const container = document.querySelector('#frames-grid');
  const blocks: HTMLElement[] = Array.from(document.querySelectorAll('.participant'));
  participants.forEach(p => {
    const block = blocks.find(block => block.id === p.penUrl);
    const newBlock = htmlToElement(`
      <div class="participant" id="${p.penUrl}" data-hash="${p.lastHash}">
        <p><a target="_blank" href="${p.penUrl}">${p.name}: <span class="change-count">${p.changeCount}</span></a></p>
        <iframe src="/fetch?url=${p.fullpageUrl}"></iframe>
      </div>`
      );
    if (block) {
      // only replace block with the new version if the hash has changed
      if (block.dataset.hash !== p.lastHash) {
        container.insertBefore(newBlock, block);
        container.removeChild(block);
      }
    } else {
      container.appendChild(newBlock);
    }
  })
}

function htmlToElement(html: string): HTMLElement {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return <HTMLElement>template.content.firstChild;
}

interface RegistrationForm extends HTMLFormElement {
  participantName: HTMLInputElement,
  penUrl: HTMLInputElement
}

async function sendRegistrationRequest(participantName: string, penUrl: string) {
  const resp = await fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      participantName: participantName,
      penUrl: penUrl
    })
  });
  return resp.json();
}

async function formSubmit(e: Event) {
  e.preventDefault();
  const errMsgElt = <HTMLElement>document.querySelector('.registration-error');
  const okMsgElt = <HTMLElement>document.querySelector('.registration-ok')
  const form: RegistrationForm = <RegistrationForm><unknown>e.target;
  const json = await sendRegistrationRequest(form.participantName.value, form.penUrl.value);
  if (json.error) {
    errMsgElt.style.display = 'initial';
    okMsgElt.style.display = 'none';
    errMsgElt.innerHTML = json.error;
  } else {
    form.reset();
    errMsgElt.style.display = 'none';
    okMsgElt.style.display = 'initial';
  }
}