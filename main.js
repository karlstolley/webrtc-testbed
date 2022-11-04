'use strict';

const pc = {
  active: new RTCPeerConnection(null),
  passive: new RTCPeerConnection(null)
}

// ICE events
pc.active.onicecandidate = ({candidate}) => pc.passive.addIceCandidate(candidate);
pc.passive.onicecandidate = ({candidate}) => pc.active.addIceCandidate(candidate);
pc.active.oniceconnectionstatechange = event => { console.log(`Active ICE: ${pc.active.iceConnectionState}`); }
pc.passive.oniceconnectionstatechange = event => { console.log(`Passive ICE: ${pc.passive.iceConnectionState}`); }

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

// This will be enough to always establish a peer connection
const dc = pc.active.createDataChannel('up', { protocol: 'strings' });
registerDataChannelCallbacks(dc, 'active');
// Register the same call backs on the passive peer
pc.passive.ondatachannel = ({channel}) => {
  registerDataChannelCallbacks(channel, 'passive');
};

negotiate(pc.active, pc.passive);

// Now do whatever you like with a peer connection established...
