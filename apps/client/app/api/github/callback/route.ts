import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    console.log("GitHub code received:", code);

    // For demo: just redirect back to app
    return NextResponse.redirect("http://localhost:3000");
}