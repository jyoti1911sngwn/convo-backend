import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const upload = multer();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Upload or update user image
router.post("/uploadImage", upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Generate unique file name
    const fileName = `${userId}-${Date.now()}.png`;

    // Upload to Supabase Storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) throw uploadError;

    // Check if user already has an image
    const { data: existing, error: selectError } = await supabase
      .from("images")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    let dbResult;
    if (existing) {
      // Update existing row
      const { data, error } = await supabase
        .from("images")
        .update({ image_path: fileName })
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      dbResult = data;
    } else {
      // Insert new row
      const { data, error } = await supabase
        .from("images")
        .insert([{ user_id: userId, image_path: fileName }])
        .select()
        .single();
      if (error) throw error;
      dbResult = data;
    }

    res.json(dbResult);
  } catch (err) {
    console.error("uploadImage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get image by userId
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
    const { data: publicUrlData, error: urlError } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(img.image_path);

    if (urlError) throw urlError;

    res.json({ imageUrl: publicUrlData.publicUrl });
  } catch (err) {
    console.error("getImage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
