import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Upload or update profile picture
router.post("/uploadImage", upload.single("image"), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (!file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    // Create unique filename
    const fileExt = file.mimetype.split("/")[1] || "png";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage (public bucket)
    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,           // overwrite if same name exists
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }

    // Save ONLY the filename in the database (important!)
    const { data: dbData, error: dbError } = await supabase
      .from("images")
      .upsert(
        { user_id: userId, image: fileName },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (dbError) {
      console.error("Database upsert error:", dbError);
      throw dbError;
    }

    // Return the public URL right away (optional but convenient)
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
    console.error("uploadImage error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

router.get("/getImage/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate UUID format (optional but good)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const { data: record, error: dbError } = await supabase
      .from("images")
      .select("image")
      .eq("user_id", userId)
      .maybeSingle();

    if (dbError) {
      console.error("Supabase query failed:", dbError);
      return res.status(500).json({
        error: "Database query failed",
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
    console.error("getImage crash:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;