import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  if (!to) return NextResponse.json({ error: "Pass ?to=your@email.com" }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM_EMAIL ?? "hello@metamindsstemacademy.com";

  if (!apiKey || apiKey.startsWith("re_placeholder")) {
    return NextResponse.json({ error: "RESEND_API_KEY not set on this server" }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [to],
      subject: "MetaMinds email test",
      html: "<p>If you see this, email sending is working!</p>",
    });
    return NextResponse.json({ ok: true, from, to, result });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
