import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/getAllUser", async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT 
    u.id,
    u.username,
    i.image,
    c.message
FROM users u
LEFT JOIN images i ON u.id = i.user_id
LEFT JOIN LATERAL (
    SELECT message
    FROM converstion c
    WHERE c.sender_id = u.id OR c.recipient_id = u.id
    ORDER BY c.created_at DESC
    LIMIT 1
) c ON true
ORDER BY u.id;
`,
    );
    const formatted = users.rows.map((u) => {
      if (!u.image) {
        return { ...u, image: null };
      }

      const base64 = u.image.toString("base64");

      return {
        ...u,
        image: `data:image/jpeg;base64,${base64}`,
        message: u.message
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;
