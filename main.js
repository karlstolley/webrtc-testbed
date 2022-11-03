'use strict';

const pc = {
  active: new RTCPeerConnection(null),
  passive: new RTCPeerConnection(null)
}

pc.active.onicecandidate = event => pc.passive.addIceCandidate(event.candidate);
pc.passive.onicecandidate = event => pc.active.addIceCandidate(event.candidate);

pc.active.oniceconnectionstatechange = event => { console.log(pc.active.iceConnectionState); }
pc.passive.oniceconnectionstatechange = event => { console.log(pc.passive.iceConnectionState); }

console.log(`Passive connection state: ${pc.passive.connectionState}`);

function negotiate(a, b) {
  return a.createOffer()
    .then(function(offer) {
      console.log(`Offer: ${offer}`);
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

const dc = pc.active.createDataChannel('up', { protocol: 'strings', negotiated: true, id: 101 });
const dc = pc.passive.createDataChannel('up', { protocol: 'strings', negotiated: true, id: 101 });

function registerDataChannelCallbacks(dc) {
  dc.onopen = (event) => {
    dc.send('Hi there!');
  }
  dc.onmessage = event => {
    console.log(event.data);
  }
}
try {
  dc.send('This is going out RIGHT AWAY.');
} catch(e) {
  console.error(e);
}


registerDataChannelCallbacks(dc);

pc.passive.ondatachannel = event => {
  const dc = event.channel;
  console.log('Channel properties', dc);
  registerDataChannelCallbacks(dc);
  dc.send('Hello again from me');
}

negotiate(pc.active, pc.passive);
