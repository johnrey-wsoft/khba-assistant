import { z } from "zod";
import { Resend } from "resend";

import { apiResponse } from "@/lib/response";
import { rateLimit } from "@/lib/ratelimit";
import { requireAuth } from "@/lib/guards/auth.guard";

import { HttpStatus } from "@/constants/http-status.constant";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_EMAIL_FROM = process.env.RESEND_EMAIL_FROM;

export const runtime = "nodejs";

const emailSchema = z.object({
  to: z.email(),
  subject: z.string().min(1),
  html: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const rateLimited = await rateLimit("email");
    if (rateLimited) return rateLimited;

    const { error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validation = emailSchema.safeParse(body);

    if (!validation.success) {
      return apiResponse({
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid request body",
      });
    }

    const { to, subject, html } = validation.data;

    if (!RESEND_API_KEY || !RESEND_EMAIL_FROM) {
      return apiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Email service not configured",
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const result = await resend.emails.send({
      from: RESEND_EMAIL_FROM,
      to,
      subject,
      html,
    });

    return apiResponse({
      data: result,
      status: HttpStatus.OK,
    });
  } catch (error) {
    console.error("Error sending email:", error);

    return apiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to send email",
    });
  }
}
