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

    // Generate unique file name
    const fileName = `${userId}-${Date.now()}.png`;

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw uploadError;

    // Store file path in DB
    const { data: existingImage } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existingImage) {
      const { data: updated } = await supabase
        .from("images")
        .update({ image_path: fileName })
        .eq("user_id", userId)
        .select()
        .single();
      return res.json(updated);
    }

    const { data: inserted } = await supabase
      .from("images")
      .insert([{ user_id: userId, image_path: fileName }])
      .select()
      .single();

    res.json(inserted);
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
      .select("image_path")
      .eq("user_id", userId)
      .single();

    if (error || !img?.image_path) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Get public URL from Supabase bucket
    const { data: publicUrl } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(img.image_path);

    res.json({ imageUrl: publicUrl.publicUrl });
  } catch (err) {
    console.error("getImage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});



export default router;
