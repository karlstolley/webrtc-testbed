'use strict';

const pc = {
  active: new RTCPeerConnection(null),
  passive: new RTCPeerConnection(null)
}

const ndca = pc.active.createDataChannel('negotiated', { negotiated: true, id: 5});
const ndcb = pc.passive.createDataChannel('negotiated', { negotiated: true, id: 5});

registerDataChannelCallbacks(ndca, 'active - negotiated data channel');
registerDataChannelCallbacks(ndcb, 'passive - negotiated data channel');

// Register callbacks on ICE events
pc.active.onicecandidate = ({candidate}) => pc.passive.addIceCandidate(candidate);
pc.passive.onicecandidate = ({candidate}) => pc.active.addIceCandidate(candidate);
pc.active.oniceconnectionstatechange = () => { console.log(`Active ICE: ${pc.active.iceConnectionState}`); }
pc.passive.oniceconnectionstatechange = () => { console.log(`Passive ICE: ${pc.passive.iceConnectionState}`); }

// Register callback on negotiation-needed event
pc.active.onnegotiationneeded = () => { perfectly_negotiate(pc.active, pc.passive); }

// Log data-channel readyState on each *connection* state change
pc.active.onconnectionstatechange = (event) => { log_dc_ready_states(event); }
pc.passive.onconnectionstatechange = (event) => { log_dc_ready_states(event); }


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

function log_dc_ready_states(event) {
  setTimeout(function() {
  console.log(
    event.target.connectionState,
    `>>> Active DC readyState: ${ndca.readyState}\n`,
    `>>> Passive DC readyState: ${ndcb.readyState}`,
  )}, 50);
}

function perfectly_negotiate(a, b) {
  // Put B in a glare state for rollback
  b.createOffer().then(function(offer) {
    return b.setLocalDescription(offer);
  }).then(function() {
    console.log('Negotiate with rollback...');
  });
  return a.createOffer()
    .then(function(offer) {
      console.log(`Offer: ${JSON.stringify(offer)}`);
      return a.setLocalDescription(offer);
    }).then(function() {
      // This is where things break down, I believe;
      // When b (pc.passive) rolls back its own offer here,
      // its negotiated data channel hangs in the "connecting"
      // state
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

// A data channel is a gUM-free way of establishing a peer connection
// const dc = pc.active.createDataChannel('up', { protocol: 'strings' });
// registerDataChannelCallbacks(dc, 'active');
// Register the same call backs on the passive peer
// pc.passive.ondatachannel = ({channel}) => {
//   registerDataChannelCallbacks(channel, 'passive');
// };

// Now do whatever you like with an active peer connection...
