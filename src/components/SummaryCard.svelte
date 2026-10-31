<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let title: string;
  export let count: number = 0;
  export let subtitle: string = '';
  export let accentColor: string = 'var(--primary)';
  export let isActive: boolean = false;

  const dispatch = createEventDispatcher<{ click: void }>();

  function handleClick() {
    dispatch('click');
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dispatch('click');
    }
  }
</script>

<div
  class="summary-card {isActive ? 'active' : ''}"
  on:click={handleClick}
  on:keydown={handleKeyDown}
  role="button"
  tabindex="0"
>
  <div class="card-indicator" style="background-color: {accentColor};"></div>
  <div class="card-content">
    <div class="card-title">{title}</div>
    <div class="card-count">{count}</div>
    {#if subtitle}
      <div class="card-subtitle">{subtitle}</div>
    {/if}
  </div>
</div>
