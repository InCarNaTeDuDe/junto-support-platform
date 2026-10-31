<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let title: string;
  export let count: number;
  export let subtitle: string = '';
  export let accentColor: string = 'var(--primary)';
  export let isActive: boolean = false;

  const dispatch = createEventDispatcher<{ click: void }>();

  function handleClick() {
    dispatch('click');
  }
</script>

<div
  class="summary-card"
  class:active={isActive}
  style="--card-accent: {accentColor}"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
>
  <div class="card-indicator"></div>
  <div class="card-content">
    <div class="card-title">{title}</div>
    <div class="card-count">{count}</div>
    {#if subtitle}
      <div class="card-subtitle">{subtitle}</div>
    {/if}
  </div>
</div>

<style>
  .summary-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    display: flex;
    align-items: stretch;
    gap: 16px;
    box-shadow: var(--shadow-sm);
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
    position: relative;
    outline: none;
  }

  .summary-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .summary-card.active {
    border-color: var(--primary);
    background-color: var(--primary-subtle);
  }

  .card-indicator {
    width: 4px;
    border-radius: 4px;
    background-color: var(--card-accent);
    flex-shrink: 0;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .card-title {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .card-count {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
    margin: 4px 0 2px;
  }

  .card-subtitle {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
</style>
