const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const Room = require("./model/Room"); 

// const rooms = {};

const app = express();
app.use(cors({ origin: ["http://localhost:4200"], methods: ["GET", "POST"], credentials: false }));

app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({}, "roomId status players");
    res.json({ rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

app.get("/getRoom/:roomId", async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({roomId});
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json(room);
  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});


const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:4200"], methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("🔌 connected:", socket.id);

socket.on("createRoom", async (playerName, callback) => {
  try {
    const roomId = Math.random().toString(36).substring(2, 8);
    const room = new Room({
      roomId,
      players: [{ name: playerName, completed: false, socketId: socket.id }],
      status: "waiting",
    });
    await room.save();

    socket.join(roomId);
    callback({ roomId });
    io.to(roomId).emit("playerJoined", room.players);
  } catch (err) {
    console.error(err);
    callback({ error: "Failed to create room" });
  }
});


socket.on("joinRoom", async (roomId, playerName, callback) => {
  try {
    const room = await Room.findOne({ roomId });
    if (!room) return callback({ success: false, message: "Room does not exist" });

    room.players.push({ name: playerName, socketId: socket.id });
    await room.save();

    socket.join(roomId);
    callback({ success: true, roomId });
    io.to(roomId).emit("playerJoined", room.players);
  } catch (err) {
    console.error(err);
    callback({ success: false, message: "Error joining room" });
  }
});


socket.on("leaveRoom", async (roomId) => {
  const room = await Room.findOne({ roomId });
  if (!room) return;

  room.players = room.players.filter(p => p.socketId !== socket.id);
  await room.save();

  io.to(roomId).emit("playerLeft", room.players);
});

socket.on("disconnect", async () => {
  const rooms = await Room.find({ "players.socketId": socket.id });
  for (const room of rooms) {
    room.players = room.players.filter(p => p.socketId !== socket.id);
    await room.save();
    io.to(room.roomId).emit("playerLeft", room.players);
  }
  console.log("❌ disconnected:", socket.id);
});



socket.on("startGame", async (roomId) => {
  const room = await Room.findOne({ roomId });
  if (!room || room.players.size === 0) return;

  room.status = "countdown";
  await room.save();

  let counter = 3;
  const interval = setInterval(async () => {
    io.to(roomId).emit("countdown", counter);
    counter--;
    if (counter < 0) {
      clearInterval(interval);
      room.status = "playing";
      await room.save();
      io.to(roomId).emit("gameStarted", {
        text: "This is a sample sentence for your typing game. Type it as fast and accurately as you can!"
      });
    }
  }, 1000);
});


socket.on("playerFinished", async (roomId, wpm) => {
  const room = await Room.findOne({ roomId });
  if (!room) return;

  const player = room.players.get(socket.id);
  if (!player) return;

  player.completed = true;
  player.wpm = wpm;
  room.players.set(socket.id, player);
  room.status = "finished"; // optional: check if all completed

  await room.save();

  io.to(roomId).emit("playerUpdate", Object.fromEntries(room.players));
  io.to(roomId).emit("gameOver", { winner: player });
});


socket.on("disconnect", async () => {
  try {
    const rooms = await Room.find({ "players.socketId": socket.id });

    for (const room of rooms) {
      room.players = room.players.filter(p => p.socketId !== socket.id);

      await room.save();

      io.to(room.roomId).emit("playerJoined", room.players);

     
      if (room.players.length === 0) {
        await Room.deleteOne({ _id: room._id });
        io.emit("roomDeleted", room.roomId);
      }
    }

    console.log("❌ disconnected:", socket.id);
  } catch (err) {
    console.error(err);
  }
});

});


const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/letter-rush", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=> console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

const PORT = 5000;
server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
