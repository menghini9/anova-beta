// ⬇️ BLOCCO TEST 1.1 — API Orchestrator Test
import { NextResponse } from "next/server";
import { runOrchestratorTests } from "@/lib/orchestrator/tests/runTests";

export async function GET() {
  const results = await runOrchestratorTests();
  return NextResponse.json({ results });
}
// ⬆️ FINE BLOCCO TEST 1.1
