<script lang="ts">
  import type { CasePriority } from '../types/support';

  export let priority: CasePriority | string = 'LOW';

  const labelMap: Record<string, string> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };

  const classMap: Record<string, string> = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  };

  $: label = labelMap[priority] || priority;
  $: badgeClass = classMap[priority] || 'badge-low';
</script>

<span class="badge {badgeClass}">
  {#if priority === 'CRITICAL'}
    <span style="font-weight: 800; margin-right: 2px;">!</span>
  {/if}
  {label}
</span>
