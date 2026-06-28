<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { PUBLIC_TOKEN, PUBLIC_BASE_URL } from '$env/static/public';

  let events = [];
  let loading = true;
  let error = null;

  $: token = $page.url.searchParams.get('token');
  $: auth = token === PUBLIC_TOKEN;

  onMount(async () => {
    try {
      const res = await fetch(
        `${PUBLIC_BASE_URL}/api/collections/events/records?filter=published%3Dtrue&sort=%2Bdate&perPage=200`
      );
      const data = await res.json();
      events = data.items ?? [];
    } catch (e) {
      error = 'Errore nel caricamento degli eventi.';
    } finally {
      loading = false;
    }
  });

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric',
      month: 'long', year: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Bar Campino — Eventi</title>
</svelte:head>

<div style="min-height: 100vh; background: {auth ? 'var(--sfondo-auth)' : 'var(--sfondo)'};">

  <header style="background: {auth ? 'var(--sfondo-card-auth)' : 'var(--sfondo-card)'}; border-bottom: 1px solid {auth ? 'var(--bordo-auth)' : 'var(--bordo)'};" class="px-4 py-4">
    <div class="max-w-2xl mx-auto flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold" style="color: var(--colore-primario)">Bar Campino</h1>
        <p class="text-sm" style="color: var(--testo-muted)">Prossimi eventi</p>
      </div>
      <div class="flex items-center gap-3">
        {#if auth}
          <span class="text-xs px-2 py-1 rounded-full font-medium" style="background: var(--bordo-auth); color: #fca5a5;">✓ Accesso volontari</span>
          <a href="/admin?token={token}" class="text-sm font-medium hover:opacity-80" style="color: var(--colore-primario)">Admin →</a>
          <a href="/" class="text-xs hover:opacity-80" style="color: var(--testo-muted)">Vista pubblica</a>
        {/if}
      </div>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-8">
    {#if loading}
      <p class="text-center py-16" style="color: var(--testo-muted)">Caricamento...</p>
    {:else if error}
      <p class="text-center py-16 text-red-400">{error}</p>
    {:else if events.length === 0}
      <p class="text-center py-16" style="color: var(--testo-muted)">Nessun evento in programma al momento.</p>
    {:else}
      <div class="flex flex-col gap-4">
        {#each events as ev}
          {#if auth}
            <a href="/eventi/{ev.id}?token={token}" class="block no-underline" style="color: inherit;">
              <div style="background: var(--sfondo-card); border: 1px solid var(--bordo);" class="rounded-2xl overflow-hidden hover:border-yellow-400 transition-colors">
                {#if ev.poster}
                  <img src={`${PUBLIC_BASE_URL}/api/files/${ev.collectionId}/${ev.id}/${ev.poster}`} alt={ev.title} class="w-full object-cover max-h-64" />
                {/if}
                <div class="p-5">
                  <p class="text-sm font-medium uppercase tracking-wide mb-1" style="color: var(--colore-primario)">{formatDate(ev.date)}</p>
                  <h2 class="text-xl font-bold mb-1">{ev.title}</h2>
                  {#if ev.start_time}
                    <p class="text-sm" style="color: var(--testo-muted)">🕐 {ev.start_time}{ev.end_time ? ' – ' + ev.end_time : ''}</p>
                  {/if}
                  {#if ev.description}
                    <div class="text-sm mt-2 leading-relaxed" style="color: var(--testo-muted)">{@html ev.description}</div>
                  {/if}
                  <p class="text-xs mt-3 font-medium" style="color: var(--colore-primario)">Vedi turni e iscriviti →</p>
                </div>
              </div>
            </a>
          {:else}
            <div style="background: var(--sfondo-card); border: 1px solid var(--bordo);" class="rounded-2xl overflow-hidden">
              {#if ev.poster}
                <img src={`${PUBLIC_BASE_URL}/api/files/${ev.collectionId}/${ev.id}/${ev.poster}`} alt={ev.title} class="w-full object-cover max-h-64" />
              {/if}
              <div class="p-5">
                <p class="text-sm font-medium uppercase tracking-wide mb-1" style="color: var(--colore-primario)">{formatDate(ev.date)}</p>
                <h2 class="text-xl font-bold mb-1">{ev.title}</h2>
                {#if ev.start_time}
                  <p class="text-sm" style="color: var(--testo-muted)">🕐 {ev.start_time}{ev.end_time ? ' – ' + ev.end_time : ''}</p>
                {/if}
                {#if ev.description}
                  <div class="text-sm mt-2 leading-relaxed" style="color: var(--testo-muted)">{@html ev.description}</div>
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </main>

</div>
