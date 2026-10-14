import type { FixtureModuleHooks } from "../hooks";
import { calendarDays, historyRow } from "./history";
import { applyDealRules } from "./rules";

export const dealsHooks: FixtureModuleHooks = {
  applyRules: applyDealRules,
  afterSeed(ctx) {
    const histories = ctx.moduleStore("DealHistory");
    let seedIndex = 0;
    for (const deal of ctx.moduleStore("Deals").records.values()) {
      if (seedIndex++ % 10 === 0 && deal.fields.Stage !== "Qualification") {
        const stamp = new Date(
          Date.parse(String(deal.fields.Created_Time)) - 2 * 86_400_000,
        ).toISOString();
        const fields = { ...deal.fields, Stage: "Qualification", Modified_Time: stamp };
        applyDealRules(fields, {});
        const first = historyRow({ id: deal.id, fields }, String(histories.nextId++));
        first.fields = {
          ...first.fields,
          Moved_To__s: deal.fields.Stage ?? null,
          Stage_Duration_Calendar_Days: 2,
        };
        histories.records.set(first.id, first);
        deal.fields = { ...deal.fields, Created_Time: stamp };
      }
      const row = historyRow(deal, String(histories.nextId++));
      histories.records.set(row.id, row);
    }
  },
  afterWrite(record, previous, ctx) {
    if (previous?.fields.Stage === record.fields.Stage) return;
    const history = ctx.moduleStore("DealHistory");
    const prior = [...history.records.values()]
      .filter((row) => {
        const reference = row.fields.Potential_Name;
        return (
          typeof reference === "object" &&
          reference !== null &&
          "id" in reference &&
          reference.id === record.id
        );
      })
      .at(-1);
    if (prior)
      prior.fields = {
        ...prior.fields,
        Moved_To__s: record.fields.Stage ?? null,
        Stage_Duration_Calendar_Days: calendarDays(
          String(prior.fields.Modified_Time),
          String(record.fields.Modified_Time),
        ),
      };
    const row = historyRow(record, String(history.nextId++));
    history.records.set(row.id, row);
  },
  afterDelete(ids, ctx) {
    const history = ctx.moduleStore("DealHistory");
    for (const row of history.records.values()) {
      const reference = row.fields.Potential_Name;
      if (
        typeof reference === "object" &&
        reference &&
        "id" in reference &&
        typeof reference.id === "string" &&
        ids.includes(reference.id)
      )
        history.records.delete(row.id);
    }
  },
  mergeRelatedRecords: [{ module: "DealHistory", field: "Potential_Name" }],
};

export const historyHooks: FixtureModuleHooks = {
  orderRows: (rows) => {
    rows.reverse();
  },
};
