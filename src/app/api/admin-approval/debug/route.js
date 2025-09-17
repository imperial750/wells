import approvalSystem from "@/lib/approval-system";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const flowId = searchParams.get("flowId");

    const debug = {
      timestamp: new Date().toISOString(),
      totalPending: approvalSystem.pendingApprovals.size,
      totalResults: approvalSystem.approvalResults.size,
      allPendingIds: Array.from(approvalSystem.pendingApprovals.keys()),
      allResultIds: Array.from(approvalSystem.approvalResults.keys()),
    };

    if (flowId) {
      debug.requestedFlowId = flowId;
      debug.pendingApproval = approvalSystem.pendingApprovals.get(flowId);
      debug.result = approvalSystem.approvalResults.get(flowId);
      debug.status = approvalSystem.checkApprovalStatus(flowId);
    }

    return Response.json({
      ok: true,
      debug,
    });
  } catch (e) {
    console.error("Debug endpoint error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
    });
  }
}
