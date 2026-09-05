import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = user.googleAppsScriptUrl;
    if (!url) {
      return NextResponse.json(
        { error: "Google Apps Script URL not configured. Go to Settings to set it up." },
        { status: 400 }
      );
    }

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("Apps Script error:", res.status, await res.text());
      return NextResponse.json(
        { error: "Failed to fetch data from Google Apps Script. Check your URL." },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Normalise values to numbers
    const parse = (v: unknown): number | null => {
      if (v === null || v === undefined) return null;
      const cleaned = String(v).replace(/[₹,\s]/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };

    return NextResponse.json({
      totalBuying: parse(data.totalBuying),
      totalSelling: parse(data.totalSelling),
      totalProfit: parse(data.totalProfit),
      totalReceived: parse(data.totalReceived),
      totalPaid: parse(data.totalPaid),
    });
  } catch (error: unknown) {
    console.error("Summary API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
