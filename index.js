import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from 'socket.io';
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3770;
const CHAT_BOT = '';

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Anonytalk Server",
  });
});

const io = new Server(server, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: process.env.CLIENT_URL,
    optionsSuccessStatus: 200,
    methods: ["GET"],
  },
});

//This function returns the amount of users in a specific room
function getSizeRoom(room){
  let clientsInRoom = 0;
  return io.sockets.adapter.rooms.has(room)? clientsInRoom = io.sockets.adapter.rooms.get(room).size : clientsInRoom
}

io.on("connection", (socket) => {
  console.log("Un nuevo usuario se conecto: "+socket.id);
  //Join to Rooms
  socket.on("join_room", (data) => {

    //takes the nick and room id from the login page and joins the user to the room
    let [nick, roomid] = data;
    socket.join(roomid);

    //When a new user logs in the chat bot emit a message to the room about the new user
    socket.to(roomid).emit('receive_message', {
      room: roomid,
      images: [],
      author: CHAT_BOT,
      message: `${nick} se unio al chat.`,
      time: ''
    });

    io.to(roomid).emit("room_clients", getSizeRoom(roomid));
  });

  //Send Messages
  socket.on("send_message", (data) => {
    //emit a message to the current user room
    socket.to(data.room).emit("receive_message", data);
  });

  //Leave Room
  socket.on('leave_room', (data) => {

    //When the user leaves the room the chat bot emit a message about that user
    let {nick, room} = data;
    socket.leave(room);

    socket.to(room).emit('receive_message', {
      room: room,
      author: CHAT_BOT,
      images: [],
      message: `${nick} salio del chat.`,
      time: ''
    });

    io.to(room).emit("room_clients", getSizeRoom(room));
  });

  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
  });
});

server.listen(port,
  console.log(`Anonytalk | Port : ${port}`)
);
