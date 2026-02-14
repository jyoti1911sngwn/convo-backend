import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post("/uploadImage", upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (!file) return res.status(400).json({ error: "No image file uploaded" });

    const fileExt = file.mimetype.split("/")[1] || "png";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    // Upsert filename into DB (now works because user_id is UNIQUE)
    const { error: dbError } = await supabase
      .from("images")
      .upsert(
        { user_id: userId, image: fileName },
        { onConflict: "user_id" }           // ← this now works
      );

    if (dbError) {
      console.error("DB upsert error:", dbError);
      return res.status(500).json({
        error: "Database error",
        details: dbError.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    res.status(200).json({
      success: true,
      user_id: userId,
      filename: fileName,
      imageUrl: urlData?.publicUrl || null,
    });
  } catch (err) {
    console.error("uploadImage crash:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

router.get("/getImage/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: record, error: dbError } = await supabase
      .from("images")
      .select("image")
      .eq("user_id", userId)
      .maybeSingle();

    if (dbError) {
      console.error("DB fetch error:", dbError);
      return res.status(500).json({
        error: "Database error",
        details: dbError.message,
      });
    }

    if (!record?.image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const { data: urlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(record.image);

    if (!urlData?.publicUrl) {
      return res.status(500).json({ error: "Failed to generate public URL" });
    }

    res.json({ imageUrl: urlData.publicUrl });
  } catch (err) {
    console.error("getImage error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;