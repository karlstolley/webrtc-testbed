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
