import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vehicle = {},
      ecus = [],
      totalFaults = 0,
      faultyECUCount = 0,
      status = "BILINMIYOR",
      summary = "",
      source = "agent",
      timestamp = new Date().toISOString(),
    } = body;

    // Save to ActivityLog
    await db.activityLog.create({
      data: {
        userId: "agent",
        action: "AGENT_REPORT",
        details: summary || `Agent raporu: ${totalFaults} ariza, ${faultyECUCount} arizali ECU`,
      },
    });

    // Save to DiagnosticSession
    const session = await db.diagnosticSession.create({
      data: {
        userId: "agent",
        vehicleId: null,
        status: totalFaults > 0 ? "completed" : "completed_clean",
        startedAt: new Date(timestamp),
        completedAt: new Date(),
        vin: vehicle?.vin || null,
        vehicleModel: vehicle?.model || "Agent Tarama",
        mileage: vehicle?.km || 0,
        totalFaults,
        faultyECUCount,
        report: JSON.stringify({ ecus, status, summary, source }),
      },
    });

    // Save fault codes
    for (const ecu of ecus) {
      if (ecu.faultCodes && ecu.faultCodes.length > 0) {
        for (const fc of ecu.faultCodes) {
          await db.faultCode.create({
            data: {
              sessionId: session.id,
              code: fc.code,
              description: fc.description || `${ecu.description} - ${fc.code}`,
              ecuAddress: ecu.address || "",
              ecuName: ecu.description || ecu.name || "",
              status: fc.status === "Aktif" ? "active" : "stored",
            },
          });
        }
      }
    }

    // Save diagnosis report
    await db.diagnosisReport.create({
      data: {
        sessionId: session.id,
        reportType: source || "agent_scan",
        content: JSON.stringify({ vehicle, ecus, totalFaults, status, summary }),
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rapor basariyla kaydedildi",
      sessionId: session.id,
      totalFaults,
      faultyECUCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    console.error("Agent report error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
