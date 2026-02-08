import { Router } from "express";
import pool from "../db.js";
import multer from "multer";
const router = Router();
const upload = multer();

router.post("/uploadImage",upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await pool.query(`SELECT * FROM images WHERE user_id = $1`, [
      userId,
    ]);

    let img;
    const buffer = req.file.buffer; // requires express-fileupload or multer
    if (user.rows.length === 0) {
      img = await pool.query(
        `INSERT INTO images (user_id, image) VALUES($1, $2) RETURNING *`,
        [userId, buffer],
      );
    } else {
      img = await pool.query(
        `UPDATE images SET image = $1 WHERE user_id = $2 RETURNING *`,
        [buffer, userId],
      );
    }
    res.json(img.rows[0]);
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Server Error");
  }
});

router.get("/getImage/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const img = await pool.query(
      `SELECT image FROM images WHERE user_id = $1`,
      [userId],
    );

    if (img.rows.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }
    const buffer = img.rows[0].image; 

    const base64 = buffer.toString("base64");

    const mimeType = "image/jpeg"; 


    res.json({
      imageBase64: `data:${mimeType};base64,${base64}`,
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
