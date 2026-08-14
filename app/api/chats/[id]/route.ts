import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/guards/auth.guard";
import { getChatWithMessages, setChatTitle, softDeleteChat } from "@/lib/chat/store";

import { HttpStatus } from "@/constants/http-status.constant";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/chats/[id] — an owned chat with its messages (in send order).
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const data = await getChatWithMessages(id, user!.id);
    if (!data) return apiResponse({ status: HttpStatus.NOT_FOUND });

    return apiResponse({ data, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error loading chat:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to load chat",
    });
  }
}

// PATCH /api/chats/[id] — rename an owned chat.
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const { title }: { title?: string } = await req.json();

    if (typeof title !== "string" || title.trim().length === 0) {
      return apiResponse({ status: HttpStatus.BAD_REQUEST, message: "title is required" });
    }

    // Ownership is enforced by the scoped UPDATE (false => not owned / missing).
    const renamed = await setChatTitle(id, user!.id, title.trim());
    if (!renamed) return apiResponse({ status: HttpStatus.NOT_FOUND });

    return apiResponse({ data: { id, title: title.trim() }, status: HttpStatus.OK });
  } catch (error) {
    console.error("Error renaming chat:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to rename chat",
    });
  }
}

// DELETE /api/chats/[id] — soft-delete an owned chat.
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const rateLimited = await rateLimit("api");
    if (rateLimited) return rateLimited;

    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const deleted = await softDeleteChat(id, user!.id);
    if (!deleted) return apiResponse({ status: HttpStatus.NOT_FOUND });

    return apiResponse({ status: HttpStatus.NO_CONTENT });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to delete chat",
    });
  }
}
