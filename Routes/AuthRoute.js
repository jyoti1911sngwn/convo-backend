import express from "express";
import { Router } from "express";
import bcrypt, { compare } from "bcrypt";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
const router = Router();
dotenv.config();
const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ username, email, password_hash: hashedPassword , compare: hashedPassword}])
      .select();

    if (error) throw error;
    res.status(200).json(data[0]);
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, data[0].password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    res.status(200).json({ id: data[0].id, name: data[0].username, description: data[0].description });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));


export default router;
