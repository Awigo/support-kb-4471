<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  // `issues`: the ticket filed for each problem, problem → its link and its state.
  type Filed = { href: string; state: string };
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, Filed>> } = $props();

  const rows = $derived(reports as Report[]);
  const merged = $derived(uniqueById(rows).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const label = (href: string) => href.replace(/^.*\/([^/]+)\/issues\//, '$1#');
  const channels = (g: { channels: Record<string, number> }) =>
    Object.entries(g.channels)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `${c} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket}
  ({rows.length - uniqueById(rows).length} more rows in the export are the same report twice) ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tenants</th><th>seen</th><th>ticket</th><th>state</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      {@const filed = issues[g.problem]}
      <tr class:open={!filed || filed.state === 'open'}>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}{#if g.alsoIn}<span class="small"> (also in <code>{g.alsoIn}</code>)</span>{/if}</td>
        <td class="small">{channels(g)}</td>
        <td>{g.tenants}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if filed}<a href={filed.href}>{label(filed.href)}</a>{:else}no ticket yet{/if}</td>
        <td>{filed?.state ?? 'open'}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
</style>
