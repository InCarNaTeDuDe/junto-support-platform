<script lang="ts">
  import type { CaseStatus } from '../types/support';

  export let status: CaseStatus;

  $: label = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_USER: 'Waiting for User',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  }[status] || status;

  $: badgeClass = {
    OPEN: 'badge-open',
    IN_PROGRESS: 'badge-inprogress',
    WAITING_FOR_USER: 'badge-waiting',
    RESOLVED: 'badge-resolved',
    CLOSED: 'badge-closed',
  }[status] || 'badge-open';
</script>

<span class="badge {badgeClass}">
  <span class="dot"></span>
  {label}
</span>

<style>
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
    display: inline-block;
  }
</style>
