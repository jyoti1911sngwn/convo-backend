import express from "express";
import cors from "cors";
import authRoute from "./Routes/AuthRoute.js";
import messageRoute from "./Routes/Message.js";
import usersRoute from "./Routes/UserRoute.js";
import { Server } from "socket.io";
import http from "http";
import imageRoute from "./Routes/ImageRoute.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("sendMessage", (message) => {
    io.to(message.reciepientId).emit("receiveMessage", message);
    io.to(message.senderId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.get("/", (req, res) => {
  res.send("hello!!");
});
app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoute);
app.use("/api/users", usersRoute);
app.use("/api/images", imageRoute);

server.listen("5000", (req, res) => {
  console.log("listening on port 5000");
});
