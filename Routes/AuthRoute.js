import { Router } from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, email) VALUES($1,$2,$3) RETURNING *`,
      [username, hashedPass, email]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const result = await pool.query(
      `SELECT password_hash,id,username,description FROM users WHERE email=$1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const compare = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!compare) return res.status(401).json({ error: "Invalid password" });

    res.status(200).json({
      id: result.rows[0].id,
      name: result.rows[0].username,
      description: result.rows[0].description,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
