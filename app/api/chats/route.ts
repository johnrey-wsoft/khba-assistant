import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/guards/auth.guard";
import { listChatsByUser } from "@/lib/chat/store";

import { HttpStatus } from "@/constants/http-status.constant";

// GET /api/chats — the current user's chats, newest first (for the thread list).
export async function GET() {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { user, error } = await requireAuth();
    if (error) return error;

    const data = await listChatsByUser(user!.id);

    return apiResponse({ data, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error listing chats:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to list chats",
    });
  }
}
