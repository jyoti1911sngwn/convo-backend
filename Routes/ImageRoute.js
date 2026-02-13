import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const router = Router();
const upload = multer();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Upload or update user image to Supabase bucket
router.post("/uploadImage", upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileExt = file.originalname.split(".").pop();
    const fileName = `${userId}-${randomUUID()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    // Upload to Supabase bucket
    const { data, error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) throw uploadError;

    // Save file path in DB
    const { data: dbData, error: dbError } = await supabase
      .from("images")
      .upsert({ user_id: userId, image: filePath })
      .select()
      .single();

    if (dbError) throw dbError;

    res.json(dbData);
  } catch (err) {
    console.error("uploadImage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get image URL by userId
// backend/images.js
router.get("/getImage/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: img, error } = await supabase
      .from("images")
      .select("image")
      .eq("user_id", userId)
      .single();

    if (error || !img?.image) return res.status(404).json({ message: "Image not found" });

    const { data: publicUrlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(img.image);

    res.json({ imageUrl: publicUrlData.publicUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});


export default router;
