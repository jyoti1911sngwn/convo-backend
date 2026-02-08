import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/getAllUser", async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT users.id, users.username, images.image FROM users FULL JOIN images ON users.id = images.user_id`,
    );
    const formatted = users.rows.map((u) => {
      if (!u.image) {
        return { ...u, image: null };
      }

      const base64 = u.image.toString("base64");

      return {
        ...u,
        image: `data:image/jpeg;base64,${base64}`,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

export default router;
