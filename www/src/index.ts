let participants = [];
(async () => {
  const resp = await fetch('/api/participants');
  participants = await resp.json();
  renderParticipants(participants);
})();

function url(s) {
  var l = window.location;
  return ((l.protocol === "https:") ? "wss://" : "ws://") + l.hostname + (((l.port != 80) && (l.port != 443)) ? ":" + l.port : "") + l.pathname + s;
}
const WS_URL = url('');

function start(websocketServerLocation: string) {
  const ws = new WebSocket(websocketServerLocation);
  ws.onmessage = (event) => {
    participants = updateParticipants(participants, JSON.parse(event.data));
    renderParticipants(participants);
  };
  ws.onclose = () => {
    setTimeout(() => start(websocketServerLocation), 5000);
  };
}

start(WS_URL);


function updateParticipants(participants, participant) {
  const idx = participants.findIndex( ({ penUrl }) => penUrl === participant.penUrl)
  if (idx === -1) {
    return [...participants, participant];
  } else {
    const copy = participants.slice(0);
    copy.splice(idx, 1, participant);
    return copy;
  }
}

function renderParticipants(participants) {
  console.log(participants);
  const container = document.querySelector('#frames-grid');
  const blocks = Array.from(document.querySelectorAll('.participant'));
  participants.forEach(p => {
    const block = blocks.find(block => block.id === p.penUrl);
    const newBlock = htmlToElement(`
      <div class="participant" id="${p.penUrl}" data-hash="${p.lastHash}">
        <p><a target="_blank" href="${p.penUrl}">${p.name}: <span class="change-count">${p.changeCount}</span></a></p>
        <iframe src="/fetch?url=${p.fullpageUrl}"></iframe>
      </div>`
      );
    if (block) {
      // TODO: don't touch if hash is the same
      if (block.dataset.hash !== p.lastHash) {
        container.insertBefore(newBlock, block);
        container.removeChild(block);
      }
    } else {
      container.appendChild(newBlock);
    }
  })
}

function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

document
  .querySelector('.registration-form')
  .addEventListener('submit', formSubmit);

function formSubmit(e) {
  e.preventDefault();
  const errMsgElt = document.querySelector('.registration-error');
  const okMsgElt = document.querySelector('.registration-ok')
  const form = e.target;
  fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      participantName: form.participantName.value,
      penUrl: form.penUrl.value
    })
  })
  .then(resp => resp.json())
  .then((json) => {
    if (json.error) {
      errMsgElt.style.display = 'initial';
      okMsgElt.style.display = 'none';
      errMsgElt.innerHTML = json.error;
      // document.querySelector('.registration-ok').style.display = 'initial';
    } else {
      form.reset();
      errMsgElt.style.display = 'none';
      okMsgElt.style.display = 'initial';
    }
  });
}