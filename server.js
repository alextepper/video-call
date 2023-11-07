const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server); // Integrate Socket.io with the server

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join-call", (roomID) => {
    console.log("user joined");
    socket.join(roomID); // Join the room
  });

  socket.on("offer", (offer, roomID) => {
    socket.to(roomID).emit("offer", offer); // Send offer to the other user in the room
  });

  socket.on("answer", ({ answer, roomID }) => {
    socket.to(roomID).emit("answer", answer); // Send answer back to the offerer
  });

  socket.on("ice-candidate", (candidate, roomID) => {
    socket.to(roomID).emit("ice-candidate", candidate); // Send ICE candidate to the other user
  });

  // Handle Socket.io events here, e.g., when a user disconnects
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
