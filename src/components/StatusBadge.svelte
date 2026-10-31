<script lang="ts">
  import type { CaseStatus } from '../types/support';

  export let status: CaseStatus;

  $: label = {
    OPEN: 'Open',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_USER: 'Waiting for User',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    'Under Review': 'Under Review',
  }[status] || status;

  $: badgeClass = {
    OPEN: 'badge-open',
    ASSIGNED: 'badge-assigned',
    IN_PROGRESS: 'badge-inprogress',
    WAITING_FOR_USER: 'badge-waiting',
    RESOLVED: 'badge-resolved',
    CLOSED: 'badge-closed',
    'Under Review': 'badge-open',
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
