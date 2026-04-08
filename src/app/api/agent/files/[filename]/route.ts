import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILE_MAP: Record<string, string> = {
  "obd_scanner.py": "agent_obd_scanner.py",
  "screen_automator.py": "agent_screen_automator.py",
  "reporter.py": "agent_reporter.py",
  "xentry_agent.py": "agent_xentry_agent.py",
  "config.json": "agent_config.json",
  "requirements.txt": "agent_requirements.txt",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const publicFile = FILE_MAP[filename];

  if (!publicFile) {
    return NextResponse.json({ error: "Dosya bulunamadi" }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", publicFile);
    const content = await fs.readFile(filePath, "utf-8");

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Dosya okunamadi" }, { status: 500 });
  }
}
