<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';

  // `issues` maps each problem to the ticket filed for it in `repo`.
  let { ticket, repo, issues }: { ticket: number; repo: string; issues: Partial<Record<Problem, number>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const ticketed = $derived(split.problems.filter((p) => issues[p.problem]).length);
  const list = (counts: Record<string, number>) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports in #{ticket} ·
  <strong>{split.problems.length}</strong>
  {split.problems.length === 1 ? 'problem' : 'problems'} ·
  <strong>{ticketed}</strong> of {split.problems.length} with a ticket of their own
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>ticket</th><th>tenants</th><th>channels</th><th>intake tagged as</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each split.problems as p (p.problem)}
      <tr class:open={!issues[p.problem]}>
        <td><code>{p.problem}</code></td>
        <td>{p.reports.length}</td>
        <td>
          {#if issues[p.problem]}
            <a href="https://github.com/{repo}/issues/{issues[p.problem]}">issue {issues[p.problem]}</a>
          {:else}
            no ticket yet
          {/if}
        </td>
        <td>{p.tenants}</td>
        <td class="muted">{list(p.channels)}</td>
        <td class="muted">{list(p.taggedAs)}</td>
        <td>{p.firstSeen} → {p.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  Counted the way the desk counts: one id, one report, each under the cause its tenant puts it in. The export holds
  {split.rows} rows for #{ticket}, and {split.rows - split.merged.length} of them repeat an id from an overlapping page.
  {#each split.problems.filter((p) => p.problem === 'one-day move') as p (p.problem)}
    {#each p.alsoIn as a (a.problem)}
      {a.count} of the <code>one-day move</code> reports are also counted under <code>{a.problem}</code>, where the desk
      files them.
    {/each}
  {/each}
</p>

<style>
  .sum { font-size: 1.1rem; }
  .muted, .note { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open td:nth-child(3) { color: var(--warn); font-weight: 600; }
</style>
