// One row per problem in a ticket, counted the way the desk counts (causes.ts, as exported): every report
// sits under the cause its tenant puts it in. The reports the desk read as a one-day move (desk-notes.json)
// are a problem of their own, so they get their own row too, and stay counted where they are filed.
import { groupByCause, readAs, uniqueById, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = CauseGroup['cause'] | 'one-day move';

export type ProblemRow = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // How many of these reports are also counted on another row.
  alsoIn: { problem: Problem; count: number }[];
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

function row(problem: Problem, rs: Report[]): ProblemRow {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: tally(rs.map((r) => r.channel)),
    taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    alsoIn: [],
  };
}

export type Split = {
  // Rows in the export for this ticket, before one id = one report.
  rows: number;
  merged: Report[];
  problems: ProblemRow[];
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const groups = groupByCause(merged, tenantOf);
  const problems = groups.map((g) => row(g.cause, g.reports));
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const shift = row('one-day move', moved);
    for (const g of groups) {
      const n = readAs(g, oneDayMove);
      if (!n) continue;
      problems.find((p) => p.problem === g.cause)!.alsoIn.push({ problem: shift.problem, count: n });
      shift.alsoIn.push({ problem: g.cause, count: n });
    }
    problems.push(shift);
  }
  return { rows: all.filter((r) => r.mergedInto === ticket).length, merged, problems };
}
