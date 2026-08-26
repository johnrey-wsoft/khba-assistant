import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireApproved } from "@/lib/guards/member.guard";
import { setMessageFeedback } from "@/lib/chat/store";
import type { MessageFeedbackRating } from "@/drizzle/schemas/chats/message-feedback.schema";

import { HttpStatus } from "@/constants/http-status.constant";

type RouteContext = { params: Promise<{ id: string }> };

const RATINGS: MessageFeedbackRating[] = ["up", "down", "report"];

// POST /api/chats/[id]/feedback — set/change/clear this user's rating on one
// answer in the chat. Body: { messageId, rating } where rating is
// "up" | "down" | "report" | null (null clears it).
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { user, error } = await requireApproved();
    if (error) return error;

    const { id } = await params;
    const { messageId, rating }: { messageId?: string; rating?: MessageFeedbackRating | null } =
      await req.json();

    if (typeof messageId !== "string" || messageId.length === 0) {
      return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "messageId is required" });
    }
    if (rating !== null && !RATINGS.includes(rating as MessageFeedbackRating)) {
      return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "invalid rating" });
    }

    // Ownership (chat owned by user, message in chat) is enforced in the store;
    // false => not owned / missing.
    const ok = await setMessageFeedback(id, user!.id, messageId, rating ?? null);
    if (!ok) return apiResponse({ status: HttpStatus.NOT_FOUND });

    return apiResponse({ data: { messageId, rating: rating ?? null }, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to save feedback",
    });
  }
}
