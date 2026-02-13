import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a new message
router.post("/createMessage", async (req, res) => {
  const { senderId, recipientId, messageText } = req.body;
  try {
    const { data: message, error } = await supabase
      .from("converstion")
      .insert([{ sender_id: senderId, recipient_id: recipientId, message: messageText }])
      .select()
      .single(); // returns the inserted row

    if (error) throw error;

    res.json(message);
  } catch (err) {
    console.error("createMessage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get messages between two users
router.get("/getMessages/:userId/:recipientId", async (req, res) => {
  const { userId, recipientId } = req.params;
  try {
    const { data: messages, error } = await supabase
      .from("converstion")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: true }); // chronological order

    if (error) throw error;

    res.json(messages);
  } catch (err) {
    console.error("getMessages error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
