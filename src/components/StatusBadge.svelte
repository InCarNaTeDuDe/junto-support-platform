<script lang="ts">
  import type { CaseStatus } from '../types/support';

  export let status: CaseStatus | string = 'OPEN';

  const labelMap: Record<string, string> = {
    OPEN: 'Open',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_USER: 'Waiting for User',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    'Under Review': 'Under Review',
  };

  const classMap: Record<string, string> = {
    OPEN: 'badge-open',
    ASSIGNED: 'badge-assigned',
    IN_PROGRESS: 'badge-inprogress',
    WAITING_FOR_USER: 'badge-waiting',
    RESOLVED: 'badge-resolved',
    CLOSED: 'badge-closed',
    'Under Review': 'badge-open',
  };

  $: label = labelMap[status] || status;
  $: badgeClass = classMap[status] || 'badge-open';
</script>

<span class="badge {badgeClass}">
  <span
    style="width: 6px; height: 6px; border-radius: 50%; background-color: currentColor; display: inline-block;"
  ></span>
  {label}
</span>
