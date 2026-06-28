<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import { PUBLIC_TOKEN, PUBLIC_BASE_URL } from '$env/static/public';

  $: token = $page.url.searchParams.get('token');
  $: auth = token === PUBLIC_TOKEN;

  let events = [];
  let loading = true;
  let message = null;

  onMount(async () => {
    if (!auth) { loading = false; return; }
    await loadEvents();
  });

  async function loadEvents() {
    loading = true;
    const res = await fetch(`${PUBLIC_BASE_URL}/api/collections/events/records?sort=-date&perPage=200`);
    const data = await res.json();
    events = data.items ?? [];
    loading = false;
  }

  async function togglePublished(ev) {
    await fetch(`${PUBLIC_BASE_URL}/api/collections/events/records/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !ev.published })
    });
    await loadEvents();
  }

  async function deleteEvent(id) {
    if (!confirm('Eliminare questo evento?')) return;
    await fetch(`${PUBLIC_BASE_URL}/api/collections/events/records/${id}`, { method: 'DELETE' });
    message = { type: 'success', text: 'Evento eliminato.' };
    await loadEvents();
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }
</script>

<svelte:head><title>Admin — Bar Campino</title></svelte:head>

<div style="min-height: 100vh; background: {auth ? 'var(--sfondo-auth)' : 'var(--sfondo)'};">
  <Header titolo="Bar Campino" sottotitolo="Pannello admin" auth={auth} token={token} linkIndietro="/?token={token}" testoIndietro="← Sito" />

  <main class="max-w-3xl mx-auto px-4 py-8">
    {#if !auth}
      <div class="text-center py-16">
        <p class="text-4xl mb-4">🔒</p>
        <p style="color: var(--testo-muted)">Accesso non autorizzato.</p>
      </div>
    {:else if loading}
      <p class="text-center py-16" style="color: var(--testo-muted)">Caricamento...</p>
    {:else}
      {#if message}
        <p class="mb-6 px-4 py-3 rounded-lg text-sm {message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">{message.text}</p>
      {/if}
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold">Eventi</h2>
        <a href="/admin/eventi/nuovo?token={token}" style="background: var(--colore-primario);" class="text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">+ Nuovo evento</a>
      </div>
      {#if events.length === 0}
        <p style="color: var(--testo-muted)">Nessun evento. Creane uno!</p>
      {:else}
        <div class="flex flex-col gap-3">
          {#each events as ev}
            <div style="background: var(--sfondo-card); border: 1px solid var(--bordo);" class="rounded-2xl p-5">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold truncate">{ev.title}</h3>
                    <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 {ev.published ? 'bg-green-900 text-green-300' : 'bg-stone-700 text-stone-400'}">{ev.published ? 'Pubblicato' : 'Bozza'}</span>
                  </div>
                  <p class="text-sm" style="color: var(--testo-muted)">{formatDate(ev.date)}{#if ev.start_time} · {ev.start_time}{ev.end_time ? ' – ' + ev.end_time : ''}{/if}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button on:click={() => togglePublished(ev)} style="border: 1px solid var(--bordo); color: var(--testo-muted);" class="text-xs px-3 py-1.5 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-colors">{ev.published ? 'Nascondi' : 'Pubblica'}</button>
                  <a href="/admin/eventi/{ev.id}?token={token}" style="border: 1px solid var(--bordo); color: var(--testo-muted);" class="text-xs px-3 py-1.5 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-colors">Modifica</a>
                  <button on:click={() => deleteEvent(ev.id)} style="border: 1px solid var(--bordo); color: var(--testo-muted);" class="text-xs px-3 py-1.5 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors">Elimina</button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </main>
</div>
