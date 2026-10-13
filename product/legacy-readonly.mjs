// Ownership is the existing conversation binding, never an email in project JSON.
export async function legacyProjects(db, user) {
  try {
    const rows = (await db.prepare(`SELECT DISTINCT p.id,p.project_json,p.updated_at,a.status AS activation_status,a.offer_json
      FROM sd_platform_conversations c JOIN sd_projects p ON p.id=c.project_id
      LEFT JOIN sd_activations a ON a.project_id=p.id WHERE c.user_id=? ORDER BY p.updated_at DESC LIMIT 250`).bind(user.id).all()).results;
    const parse = raw => { try { return JSON.parse(raw || '{}'); } catch { return {}; } };
    return { status: 'AVAILABLE', projects: rows.map(row => {
      const project = parse(row.project_json), offer = parse(row.offer_json);
      return { id: row.id, name: String(project.companyName || project.agencyName || 'Projet historique').slice(0,180),
        status: String(row.activation_status || project.status || 'historique').slice(0,60), updated_at: row.updated_at,
        read_only: true, legacy_amount: Number.isSafeInteger(offer.recurringAmount) ? offer.recurringAmount : null };
    }) };
  } catch { return { status: 'UNAVAILABLE', projects: [] }; }
}
