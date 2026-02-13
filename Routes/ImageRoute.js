import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const upload = multer();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post("/uploadImage", upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Generate unique file name
    const fileName = `${userId}-${Date.now()}.png`;

    // Upload to Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Store path in DB
    const { data: inserted, error: dbError } = await supabase
      .from("images")
      .upsert({ user_id: userId, image: fileName })
      .select()
      .single();

    if (dbError) throw dbError;

    res.json(inserted);
  } catch (err) {
    console.error("uploadImage error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
