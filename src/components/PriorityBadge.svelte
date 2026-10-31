<script lang="ts">
  import type { CasePriority } from '../types/support';

  export let priority: CasePriority;

  $: label = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  }[priority] || priority;

  $: badgeClass = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  }[priority] || 'badge-low';
</script>

<span class="badge {badgeClass}">
  {#if priority === 'CRITICAL'}
    <span class="flag">!</span>
  {/if}
  {label}
</span>

<style>
  .flag {
    font-weight: 800;
    margin-right: 2px;
  }
</style>
