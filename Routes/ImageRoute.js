import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const upload = multer();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
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
    const { data: storageData, error: storageError } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (storageError) throw storageError;

    // Store the **plain path string** in DB
    const { data: inserted, error: dbError } = await supabase
      .from("images")
      .upsert({ user_id: userId, image: fileName }) // <- store plain path
      .select()
      .single();

    if (dbError) throw dbError;

    res.json(inserted);
  } catch (err) {
    console.error("uploadImage error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get image by userId
router.get("/getImage/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: img, error: imgError } = await supabase
      .from("images")
      .select("image")
      .eq("user_id", userId)
      .single();

    if (imgError || !img?.image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const sanitizedPath = img.image.replace(/\\/g, "");
    const { data: storageData, error: storageError } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(sanitizedPath);

    if (storageError || !storageData?.publicUrl) {
      return res.status(500).json({ error: "Failed to get public URL" });
    }

    res.json({ imageUrl: storageData.publicUrl });
  } catch (err) {
    console.error("getImage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
