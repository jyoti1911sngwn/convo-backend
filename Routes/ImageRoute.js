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
    const buffer = req.file.buffer; // multer buffer

    // Check if the user already has an image
    const { data: existingImage, error: selectError } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (selectError && selectError.code !== "PGRST116") throw selectError;

    let result;
    if (!existingImage) {
      // Insert new image
      const { data, error } = await supabase
        .from("images")
        .insert([{ user_id: userId, image: buffer }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Update existing image
      const { data, error } = await supabase
        .from("images")
        .update({ image: buffer })
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json(result);
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
      .select("image")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Image not found" });
      }
      throw error;
    }

    if (!img?.image) return res.status(404).json({ message: "Image not found" });

    const base64 = Buffer.from(img.image).toString("base64");

    res.json({
      imageBase64: `data:image/jpeg;base64,${base64}`,
    });
  } catch (err) {
    console.error("getImage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
