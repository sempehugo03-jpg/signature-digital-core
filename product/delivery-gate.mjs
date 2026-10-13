// Server-only. An adapter's mock:false declaration is not proof of delivery.
// No runtime flag can approve delivery; a future authenticated verifier must
// reconcile a durable receipt for this exact immutable artifact.
export async function deliveryGate({ db, version, approval = null, verifier = null }) {
  const blocked = reason => ({ status: "FAIL", checkout_allowed: false, reason });
  if (!version || version.state !== "ready") return blocked("NO_READY_VERSION");
  let provenance;
  try {
    provenance = await db.prepare("SELECT * FROM fp_version_delivery WHERE version_id=?")
      .bind(version.id).first();
  } catch {
    return blocked("DELIVERY_PROVENANCE_UNAVAILABLE");
  }
  if (!provenance) return blocked("DELIVERY_PROVENANCE_MISSING");
  if (provenance.adapter_kind === "unknown" || provenance.result_source === "unknown")
    return blocked("SERVICE_DELIVERY_UNPROVEN");
  if (provenance.is_mock !== 0 || provenance.adapter_kind === "deterministic-test" ||
      provenance.result_source === "deterministic-test") return blocked("MOCK_PROPOSAL");
  if (provenance.job_id !== version.job_id || provenance.artifact_hash !== version.artifact_hash ||
      provenance.adapter_kind !== version.source ||
      (approval && (approval.version_id !== version.id || approval.artifact_hash !== version.artifact_hash)))
    return blocked("DELIVERY_ARTIFACT_MISMATCH");
  if (typeof verifier?.verify !== "function") return blocked("SERVICE_DELIVERY_UNPROVEN");
  try {
    const receipt = await verifier.verify({
      project_id: version.project_id, version_id: version.id, job_id: version.job_id,
      artifact_hash: version.artifact_hash, adapter_kind: provenance.adapter_kind,
      result_source: provenance.result_source,
    });
    if (receipt?.verified !== true || !/^[a-zA-Z0-9_-]{8,160}$/.test(receipt.receipt_id || "") ||
        receipt.project_id !== version.project_id || receipt.version_id !== version.id ||
        receipt.job_id !== version.job_id || receipt.artifact_hash !== version.artifact_hash ||
        receipt.adapter_kind !== provenance.adapter_kind || receipt.result_source !== provenance.result_source)
      return blocked("SERVICE_DELIVERY_UNPROVEN");
    return { status: "PASS", checkout_allowed: true, reason: "VERIFIED_DELIVERY_RECEIPT" };
  } catch {
    return blocked("SERVICE_DELIVERY_UNPROVEN");
  }
}
