const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const Room = require("./model/Room");
const { nanoid } = require("nanoid");

const app = express();
app.use(
  cors({
    origin: ["https://lrush.netlify.app"],
    methods: ["GET", "POST"],
    credentials: false,
  })
);

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
    const room = await Room.findOne({ roomId });
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
  cors: { origin: ["https://lrush.netlify.app"], methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("🔌 connected:", socket.id);

  socket.on("createRoom", async (playerName, callback) => {
    try {
      const roomId = nanoid(8);
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
    const room = await Room.findOne({ roomId });
    if (!room)
      return callback({ success: false, message: "Room does not exist" });
    if (room.status != "playing") {
      room.players.push({ name: playerName, socketId: socket.id });
      await room.save();
      socket.join(roomId);
      callback({ success: true, roomId });
      io.to(roomId).emit("playerJoined", room.players);
    } else {
      callback({ success: false, message: "Game is in session" });
    }
  });

  socket.on("leaveRoom", async (roomId) => {
    const room = await Room.findOne({ roomId });
    if (!room) return;
    room.players = room.players.filter((p) => p.socketId !== socket.id);
    await room.save();
    io.to(roomId).emit("playerLeft", room.players);
  });


  socket.on("startGame", async (roomId) => {
    const room = await Room.findOne({ roomId });
    if (!room || room.players.length === 0) return;
    room.status = "countdown";
    await room.save();
    let paragraph = "Loading text...";
    try {
  const response = await fetch("https://baconipsum.com/api/?type=meat-and-filler&paras=1");
  if (response.ok) {
    const data = await response.json(); // Bacon Ipsum returns JSON array
    paragraph = data[0]; // update outer variable
    console.log("Fetched paragraph:", paragraph);
  }
} catch (err) {
  console.error("Failed to fetch paragraph:", err);
}

let counter = 3;
  while (counter >= 0) {
    io.to(roomId).emit("countdown", counter);
    await new Promise((res) => setTimeout(res, 1000)); // wait 1 second
    counter--;
  }
  room.status = "playing";
  await room.save();
  io.to(roomId).emit("gameStarted", { text: paragraph });
  });

  socket.on("playerFinished", async (roomId, { wpm, completion }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;
      player.wpm = wpm;
      player.completed = true;
      player.completion = completion;
      room.status = "finished";
      await room.save();
      io.to(roomId).emit("gameOver", {
        winner: player,
        results: room.players,
      });
    } catch (err) {
      console.error("Error in playerFinished:", err);
    }
  });

  socket.on("playerProgress", async ({ roomId, progress }) => {
    const { name, wpm, completion } = progress;
    const room = await Room.findOne({ roomId });
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    player.name = progress.name;
    player.wpm = progress.wpm;
    player.completion = progress.completion;
    room.markModified("players");
    await room.save();
    console.log(player.completion);
    console.log(room.players.find((p) => p.socketId === socket.id));
    io.to(roomId).emit("playerUpdate", room.players);
    if (player.completion >= 100) {
      room.status = "finished";
      await room.save();
      io.to(roomId).emit("gameOver", { winner: player });
    }
  });

  socket.on("disconnect", async () => {
    try {
      const rooms = await Room.find({ "players.socketId": socket.id });
      for (const room of rooms) {
        room.players = room.players.filter((p) => p.socketId !== socket.id);
        await room.save();
        io.to(room.roomId).emit("playerLeft", room.players);
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
const playerSchema = require("./model/Room");
mongoose
  .connect("mongodb+srv://swethasureshssk14:oD6jhpnoACHbskxq@cluster01.boommiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01/letter-rush", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`API running on http://localhost:${PORT}`)
);
