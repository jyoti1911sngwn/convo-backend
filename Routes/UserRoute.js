import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

router.get("/getAllUser", async (req, res) => {
  try {
    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username");

    if (usersError) throw usersError;

    // Fetch all images (assuming 1 image per user)
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("user_id, image");

    if (imagesError) throw imagesError;

    // Fetch latest conversation per user
    const { data: messages, error: messagesError } = await supabase
      .from("converstion")
      .select("sender_id, recipient_id, message, created_at")
      .order("created_at", { ascending: false });

    if (messagesError) throw messagesError;

    // Format the final response
    const formatted = users.map((u) => {
      const userImage = images.find((img) => img.user_id === u.id);
      const latestMessage = messages.find(
        (m) => m.sender_id === u.id || m.recipient_id === u.id,
      );

      let image = null;
      if (userImage?.image_path) {
        // Get the public URL from Supabase bucket
        const { data: publicUrlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(userImage.image_path);

        image = publicUrlData?.publicUrl || null;
      }

      return {
        ...u,
        image,
        message: latestMessage?.message || null,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("getAllUser error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
