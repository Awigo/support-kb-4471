// The problems a merged ticket really holds, counted the desk's way. causes.ts gives the cause, and every
// report is counted where its tenant files it. The reports the desk read as a one-day move (desk-notes.json)
// are a problem of their own, because no day/month swap moves a date by one day: they get their own row
// and stay counted where they're filed.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day shift' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // The row these reports are also counted in, when they are.
  alsoIn: Problem | null;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

function group(problem: Problem, rs: Report[], alsoIn: Problem | null): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    alsoIn,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const byCause = new Map<Problem, Report[]>();
  for (const r of reports) {
    const p = causeOf(r, tenantOf(r)) ?? 'unplaced';
    byCause.set(p, [...(byCause.get(p) ?? []), r]);
  }
  const groups = [...byCause.entries()]
    .map(([p, rs]) => group(p, rs, null))
    .sort((a, b) => b.reports.length - a.reports.length);
  const moved = reports.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const filedUnder = [...new Set(moved.map((r) => causeOf(r, tenantOf(r)) ?? 'unplaced'))];
    groups.push(group('one-day shift', moved, filedUnder.length === 1 ? filedUnder[0] : null));
  }
  return groups;
}
