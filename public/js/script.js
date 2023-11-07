const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
let isCaller;
let localStream;
let peerConnection;
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Using Google's public STUN server
};

// Getting local video stream
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;
    localStream = stream;
  })
  .catch((error) => {
    console.error("Error accessing media devices.", error);
  });

// Function to initiate a call
function call() {
  isCaller = true;
  peerConnection = new RTCPeerConnection(configuration);

  // Add stream to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Create offer if caller
  if (isCaller) {
    peerConnection
      .createOffer()
      .then((offer) => peerConnection.setLocalDescription(offer))
      .then(() => {
        socket.emit("callMade", {
          offer: peerConnection.localDescription,
        });
      });
  }

  // Handle ICE candidate event
  peerConnection.onicecandidate = function (event) {
    if (event.candidate) {
      socket.emit("iceCandidateFound", {
        candidate: event.candidate,
      });
    }
  };

  // Set remote stream when it arrives
  peerConnection.ontrack = function (event) {
    remoteVideo.srcObject = event.streams[0];
  };
}

// Handle incoming call
socket.on("callReceived", (data) => {
  if (!isCaller) {
    peerConnection = new RTCPeerConnection(configuration);

    // Add stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection
      .setRemoteDescription(new RTCSessionDescription(data.offer))
      .then(() => peerConnection.createAnswer())
      .then((answer) => peerConnection.setLocalDescription(answer))
      .then(() => {
        socket.emit("answerMade", {
          answer: peerConnection.localDescription,
        });
      });

    // Handle ICE candidate event
    peerConnection.onicecandidate = function (event) {
      if (event.candidate) {
        socket.emit("iceCandidateFound", {
          candidate: event.candidate,
        });
      }
    };

    // Set remote stream when it arrives
    peerConnection.ontrack = function (event) {
      remoteVideo.srcObject = event.streams[0];
    };
  }
});

// Handling ICE candidate from the other peer
socket.on("iceCandidateFound", (data) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// Handling answer made by the other peer
socket.on("answerReceived", (data) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// Initiating a call
// This can be triggered by a button click, for example
// document.getElementById('callButton').addEventListener('click', call);
