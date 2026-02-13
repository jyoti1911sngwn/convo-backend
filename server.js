import express from "express";
import cors from "cors";
import authRoute from "./Routes/AuthRoute.js";
import messageRoute from "./Routes/Message.js";
import usersRoute from "./Routes/UserRoute.js";
import { Server } from "socket.io";
import http from "http";
import imageRoute from "./Routes/ImageRoute.js";
import pool from "./db.js";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5000;
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
    origin: "*",
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


app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // simple test query
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase.from("users").select("*");


server.listen(PORT, (req, res) => {
  console.log(`listening on port ${PORT}`);
});
