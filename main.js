'use strict';

const pc = {
  active: new RTCPeerConnection(null),
  passive: new RTCPeerConnection(null)
}

function negotiate(a, b) {
  return a.createOffer()
    .then(function(offer) {
      console.log(`Offer: ${JSON.stringify(offer)}`);
      return a.setLocalDescription(offer);
    }).then(function() {
      return b.setRemoteDescription(a.localDescription);
    }).then(function() {
      return b.createAnswer();
    }).then(function(answer) {
      return b.setLocalDescription(answer);
    }).then(function() {
      return a.setRemoteDescription(b.localDescription);
  });
}

function registerDataChannelCallbacks(dc, role) {
  dc.onopen = () => {
    dc.send(`Hi there from the ${role} role`);
  }
  dc.onmessage = event => {
    console.log(event.data);
  }
}

// Register callbacks on ICE events
pc.active.onicecandidate = ({candidate}) => pc.passive.addIceCandidate(candidate);
pc.passive.onicecandidate = ({candidate}) => pc.active.addIceCandidate(candidate);
pc.active.oniceconnectionstatechange = () => { console.log(`Active ICE: ${pc.active.iceConnectionState}`); }
pc.passive.oniceconnectionstatechange = () => { console.log(`Passive ICE: ${pc.passive.iceConnectionState}`); }

// Register callback on negotiation-needed event
pc.active.onnegotiationneeded = () => { negotiate(pc.active, pc.passive); }

// A data channel is a gUM-free way of establishing a peer connection
const dc = pc.active.createDataChannel('up', { protocol: 'strings' });
registerDataChannelCallbacks(dc, 'active');
// Register the same call backs on the passive peer
pc.passive.ondatachannel = ({channel}) => {
  registerDataChannelCallbacks(channel, 'passive');
};

// Now do whatever you like with an active peer connection...



// Now do whatever you like with a peer connection established...
pc.passive.ontrack = ({ track, streams: [stream] }) => {
  displayStream('#incoming', stream);
}

function addStreamingMedia(peer, stream) {
  if (stream) {
    for (let track of stream.getTracks()) {
      peer.addTrack(track, stream);
    }
  }
  // Renegotiate after adding media
  // TODO: Put in a proper `onnegotiationneeded` callback
  negotiate(pc.active, pc.passive);
}
function displayStream(selector, stream) {
  document.querySelector(selector).srcObject = stream;
}
async function requestUserMedia(constraints) {
  const stream = new MediaStream();
  const media = await navigator.mediaDevices.getUserMedia(constraints);
  // TODO: Isolate track to apply additional gUM constraints
  stream.addTrack(media.getVideoTracks()[0]);
  addStreamingMedia(pc.active, stream);
  displayStream('#outgoing', stream);
}

const constraints = { audio: false, video: true };

const button = document.querySelector('#controls button');
button.onclick = (event) => {
  // TODO: requestUserMedia() should only run once
  requestUserMedia(constraints);
  event.target.innerText = 'Update';
}
