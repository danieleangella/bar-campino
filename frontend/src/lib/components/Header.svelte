<script>
  export let titolo = 'Bar Campino';
  export let sottotitolo = '';
  export let linkIndietro = '';
  export let testoIndietro = '';
  export let auth = false;
  export let token = '';
</script>

<header style="background: {auth ? 'var(--sfondo-card-auth)' : 'var(--sfondo-card)'}; border-bottom: 1px solid {auth ? 'var(--bordo-auth)' : 'var(--bordo)'};" class="px-4 py-4">
  <div class="max-w-3xl mx-auto flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold" style="color: var(--colore-primario)">{titolo}</h1>
      {#if sottotitolo}
        <p class="text-sm" style="color: var(--testo-muted)">{sottotitolo}</p>
      {/if}
    </div>
    <div class="flex items-center gap-3">
      {#if auth}
        <span class="text-xs px-2 py-1 rounded-full font-medium" style="background: var(--bordo-auth); color: #fca5a5;">✓ Accesso volontari</span>
        <a href="/admin?token={token}" class="text-sm font-medium hover:opacity-80" style="color: var(--colore-primario)">Admin →</a>
      {/if}
      {#if linkIndietro}
        <a href={linkIndietro} class="text-sm" style="color: var(--testo-muted)">{testoIndietro}</a>
      {/if}
    </div>
  </div>
</header>
