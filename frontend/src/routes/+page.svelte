<script>
  import { onMount } from 'svelte';
  import { getEvents } from '$lib/pb.js';

  let events = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      events = await getEvents();
    } catch (e) {
      error = 'Errore nel caricamento degli eventi.';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Bar Campino — Eventi</title>
</svelte:head>

<div class="min-h-screen bg-stone-950 text-stone-100">

  <!-- Header -->
  <header class="bg-stone-900 border-b border-stone-800 px-4 py-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-amber-400">Bar Campino</h1>
      <p class="text-stone-400 mt-1">Prossimi eventi</p>
    </div>
  </header>

  <!-- Contenuto -->
  <main class="max-w-2xl mx-auto px-4 py-8">

    {#if loading}
      <p class="text-stone-400 text-center py-16">Caricamento...</p>

    {:else if error}
      <p class="text-red-400 text-center py-16">{error}</p>

    {:else if events.length === 0}
      <p class="text-stone-400 text-center py-16">
        Nessun evento in programma al momento.
      </p>

    {:else}
      <div class="flex flex-col gap-4">
        {#each events as event}
          <div class="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">

            <!-- Locandina -->
            {#if event.poster}
              <img
                src={`http://127.0.0.1:8090/api/files/${event.collectionId}/${event.id}/${event.poster}`}
                alt={event.title}
                class="w-full object-cover max-h-64"
              />
            {/if}

            <div class="p-5">
              <!-- Data -->
              <p class="text-amber-400 text-sm font-medium uppercase tracking-wide mb-1">
                {formatDate(event.date)}
              </p>

              <!-- Titolo -->
              <h2 class="text-xl font-bold mb-1">{event.title}</h2>

              <!-- Orario -->
              {#if event.start_time}
                <p class="text-stone-400 text-sm mb-3">
                  🕐 {event.start_time}{event.end_time ? ' – ' + event.end_time : ''}
                </p>
              {/if}

              <!-- Descrizione -->
              {#if event.description}
                <p class="text-stone-300 text-sm leading-relaxed">
                  {event.description}
                </p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

  </main>
</div>