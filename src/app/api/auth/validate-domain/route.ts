import { type NextRequest, NextResponse } from "next/server";
import { validateEmailDomainForInstitution } from "@/lib/institutions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain") || searchParams.get("email") || "";
    const college = searchParams.get("college") || searchParams.get("collegeId") || null;

    if (!domain.trim()) {
      return NextResponse.json({ valid: false, error: "domain parameter is required" }, { status: 400 });
    }

    const result = await validateEmailDomainForInstitution(domain, college);
    return NextResponse.json(result, { status: result.valid ? 200 : 422 });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error?.message || "Validation failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      domain?: string;
      email?: string;
      college?: string;
    };
    const domain = body.domain || body.email || "";
    const college = body.college || null;

    if (!domain.trim()) {
      return NextResponse.json({ valid: false, error: "domain or email is required" }, { status: 400 });
    }

    const result = await validateEmailDomainForInstitution(domain, college);
    return NextResponse.json(result, { status: result.valid ? 200 : 422 });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error?.message || "Validation failed" }, { status: 500 });
  }
}
