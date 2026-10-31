// Which problem each report merged into a ticket belongs to. causes.ts places a report by its tenant;
// the desk's own reading (desk-notes.json) takes the one-day moves out first, because a date that is one
// day off is not a date-order bug at all.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day move' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day move';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

export type Split = {
  // Rows in the export, before one id = one report.
  rows: number;
  merged: Report[];
  groups: ProblemGroup[];
  // What the desk's table (CauseTable) counts under each cause, one-day moves included.
  deskCounts: Record<string, number>;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: tally(rs.map((r) => r.channel)),
        taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  const deskCounts = tally(merged.map((r) => causeOf(r, tenantOf(r)) ?? 'unplaced'));
  return { rows: all.filter((r) => r.mergedInto === ticket).length, merged, groups, deskCounts };
}
