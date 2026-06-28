<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  const BASE_URL = 'http://127.0.0.1:8090';
  const ADMIN_TOKEN = 'campino2026admin';

  $: token = $page.url.searchParams.get('token');
  $: authorized = token === ADMIN_TOKEN;

  let events = [];
  let loading = true;
  let message = null;

  onMount(async () => {
    if (!authorized) { loading = false; return; }
    await loadEvents();
  });

  async function loadEvents() {
    loading = true;
    const res = await fetch(
      `${BASE_URL}/api/collections/events/records?sort=-date&perPage=200`
    );
    const data = await res.json();
    events = data.items ?? [];
    loading = false;
  }

  async function togglePublished(event) {
    await fetch(`${BASE_URL}/api/collections/events/records/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !event.published })
    });
    await loadEvents();
  }

  async function deleteEvent(id) {
    if (!confirm('Eliminare questo evento?')) return;
    await fetch(`${BASE_URL}/api/collections/events/records/${id}`, {
      method: 'DELETE'
    });
    message = { type: 'success', text: 'Evento eliminato.' };
    await loadEvents();
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
</script>

<div class="min-h-screen bg-stone-950 text-stone-100">
  <header class="bg-stone-900 border-b border-stone-800 px-4 py-4">
    <div class="max-w-3xl mx-auto flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-amber-400">Bar Campino</h1>
        <p class="text-stone-400 text-sm">Pannello admin</p>
      </div>
      <a href="/" class="text-stone-400 hover:text-stone-300 text-sm">Sito pubblico</a>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-8">
    {#if !authorized}
      <div class="text-center py-16">
        <p class="text-4xl mb-4">🔒</p>
        <p class="text-stone-400">Accesso non autorizzato.</p>
      </div>
    {:else if loading}
      <p class="text-stone-400 text-center py-16">Caricamento...</p>
    {:else}
      {#if message}
        <p class="mb-6 px-4 py-3 rounded-lg text-sm {message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">{message.text}</p>
      {/if}

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold">Eventi</h2>
        <a href="/admin/eventi/nuovo" class="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">+ Nuovo evento</a>
      </div>

      {#if events.length === 0}
        <p class="text-stone-400">Nessun evento. Creane uno!</p>
      {:else}
        <div class="flex flex-col gap-3">
          {#each events as event}
            <div class="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold truncate">{event.title}</h3>
                    <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 {event.published ? 'bg-green-900 text-green-300' : 'bg-stone-700 text-stone-400'}">{event.published ? 'Pubblicato' : 'Bozza'}</span>
                  </div>
                  <p class="text-stone-400 text-sm">{formatDate(event.date)}{#if event.start_time} · {event.start_time}{event.end_time ? ' – ' + event.end_time : ''}{/if}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button on:click={() => togglePublished(event)} class="text-xs px-3 py-1.5 rounded-lg border border-stone-600 text-stone-400 hover:border-amber-500 hover:text-amber-400 transition-colors">{event.published ? 'Nascondi' : 'Pubblica'}</button>
                  <a href="/admin/eventi/{event.id}" class="text-xs px-3 py-1.5 rounded-lg border border-stone-600 text-stone-400 hover:border-amber-500 hover:text-amber-400 transition-colors">Modifica</a>
                  <button on:click={() => deleteEvent(event.id)} class="text-xs px-3 py-1.5 rounded-lg border border-stone-600 text-stone-400 hover:border-red-500 hover:text-red-400 transition-colors">Elimina</button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </main>
</div>
