import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.post("/createMessage", async (req, res) => {
  const { senderId, reciepientId, messageText } = req.body;
  try {
    const Message = await pool.query(
      `INSERT INTO converstion (sender_id, recipient_id, message) VALUES ($1, $2, $3) RETURNING *`,
      [senderId, reciepientId, messageText],
    );
    res.json(Message.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/getMessages/:userId/:recipientId", async (req, res) => {
  const { userId, recipientId } = req.params;
  try {
    const message = await pool.query(
      `SELECT * FROM converstion WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1) ORDER BY created_at ASC`,
      [userId, recipientId],
    );
    res.json(message.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;
