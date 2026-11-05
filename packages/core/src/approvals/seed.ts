import { sql } from "drizzle-orm";
import type { Transaction } from "../tenancy/types";

const DEMO_DEAL_ID = "700000000000000000";

/**
 * Local demo/e2e fixture only (ADR 0018 §2): one active approval process and one
 * pending request for the given administrator. Never called for real organizations.
 */
export async function seedDemoApprovals(
  tx: Transaction,
  input: { orgId: string; adminUserId: string },
): Promise<void> {
  const steps = [
    { name: "Manager approval", approvers: { kind: "roles", refs: ["admin"] }, rule: "any" },
  ];
  await tx.execute(
    sql`INSERT INTO approval_processes (organization_id, kind, name, module, trigger, criteria, steps,
          active, position, created_by, updated_by)
        VALUES (${input.orgId}, 'approval', 'Large deal approval', 'Deals', 'create_or_edit',
          ${JSON.stringify({ kind: "criteria", criteria: { field: "Amount", comparator: "greater_than", value: 1000000 } })}::jsonb,
          ${JSON.stringify(steps)}::jsonb, true, 0, ${input.adminUserId}, ${input.adminUserId})
        ON CONFLICT DO NOTHING`,
  );
  const process = (
    await tx.execute(
      sql`SELECT id FROM approval_processes WHERE organization_id = ${input.orgId}
          AND kind = 'approval' AND module = 'Deals' AND lower(name) = 'large deal approval'`,
    )
  ).rows[0] as { id?: string } | undefined;
  if (!process?.id) return;
  const request = (
    await tx.execute(
      sql`INSERT INTO approval_requests (organization_id, process_id, kind, record_module, record_id,
            record_label, submitter_user_id, current_step, status)
          VALUES (${input.orgId}, ${process.id}, 'approval', 'Deals', ${DEMO_DEAL_ID},
            'Demo deal', ${input.adminUserId}, 1, 'pending')
          ON CONFLICT DO NOTHING RETURNING id`,
    )
  ).rows[0] as { id?: string } | undefined;
  if (!request?.id) return;
  await tx.execute(
    sql`INSERT INTO approval_request_approvers (organization_id, request_id, step, user_id)
        VALUES (${input.orgId}, ${request.id}, 1, ${input.adminUserId})`,
  );
  await tx.execute(
    sql`INSERT INTO approval_actions (organization_id, request_id, step, actor_user_id, action)
        VALUES (${input.orgId}, ${request.id}, 1, ${input.adminUserId}, 'submitted')`,
  );
}
