<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';

  // `issues` maps each problem to the ticket filed for it in `repo`.
  let { ticket, repo, issues }: { ticket: number; repo: string; issues: Partial<Record<Problem, number>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const filed = $derived(split.groups.filter((g) => issues[g.problem]).reduce((n, g) => n + g.reports.length, 0));
  const list = (counts: Record<string, number>) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports in #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'} ·
  <strong>{filed}</strong> of {split.merged.length} on a ticket of their own
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>ticket</th><th>tenants</th><th>channels</th><th>intake tagged as</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr class:open={!issues[g.problem]}>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td>
          {#if issues[g.problem]}
            <a href="https://github.com/{repo}/issues/{issues[g.problem]}">issue {issues[g.problem]}</a>
          {:else}
            no ticket yet
          {/if}
        </td>
        <td>{g.tenants}</td>
        <td class="muted">{list(g.channels)}</td>
        <td class="muted">{list(g.taggedAs)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  The export holds {split.rows} rows for #{ticket}. {split.rows - split.merged.length} of them repeat an id from an
  overlapping page and are counted once. The desk's table on #{ticket} counts {list(split.deskCounts)}, because it
  files the one-day moves under their tenant's cause.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .muted, .note { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open td:nth-child(3) { color: var(--warn); font-weight: 600; }
</style>
