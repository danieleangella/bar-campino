<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  const BASE_URL = 'http://127.0.0.1:8090';

  let event = null;
  let shifts = [];
  let volunteers = [];
  let signups = {};
  let loading = true;
  let error = null;

  // Per l'iscrizione
  let selectedVolunteer = '';
  let selectedShift = '';
  let signingUp = false;
  let message = null;

  $: eventId = $page.params.id;

  onMount(async () => {
    try {
      // Carica evento
      const eventRes = await fetch(`${BASE_URL}/api/collections/events/records/${eventId}`);
      if (!eventRes.ok) throw new Error('Evento non trovato');
      event = await eventRes.json();

      // Carica turni
      const shiftsRes = await fetch(
        `${BASE_URL}/api/collections/shifts/records?filter=event%3D"${eventId}"&sort=%2Bstart_time`
      );
      const shiftsData = await shiftsRes.json();
      shifts = shiftsData.items ?? [];

      // Carica volontari attivi
      const volRes = await fetch(
        `${BASE_URL}/api/collections/volunteers/records?filter=active%3Dtrue&sort=%2Bname&perPage=200`
      );
      const volData = await volRes.json();
      volunteers = volData.items ?? [];

      // Carica iscrizioni per ogni turno
      await loadSignups();

    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  async function loadSignups() {
    for (const shift of shifts) {
      const res = await fetch(
        `${BASE_URL}/api/collections/shift_signups/records?filter=shift%3D"${shift.id}"&expand=volunteer&perPage=200`
      );
      const data = await res.json();
      signups[shift.id] = data.items ?? [];
    }
    signups = { ...signups };
  }

  async function signup() {
    if (!selectedVolunteer || !selectedShift) {
      message = { type: 'error', text: 'Seleziona un turno e il tuo nome.' };
      return;
    }

    // Controlla se già iscritto
    const already = signups[selectedShift]?.find(
      s => s.volunteer === selectedVolunteer
    );
    if (already) {
      message = { type: 'error', text: 'Sei già iscritto a questo turno.' };
      return;
    }

    signingUp = true;
    message = null;

    try {
      const res = await fetch(`${BASE_URL}/api/collections/shift_signups/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift: selectedShift,
          volunteer: selectedVolunteer,
          signed_up_at: new Date().toISOString(),
        })
      });

      if (!res.ok) throw new Error('Errore durante l\'iscrizione');

      message = { type: 'success', text: 'Iscrizione completata!' };
      await loadSignups();
      selectedVolunteer = '';
      selectedShift = '';

    } catch (e) {
      message = { type: 'error', text: e.message };
    } finally {
      signingUp = false;
    }
  }

  async function cancelSignup(signupId, shiftId) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/collections/shift_signups/records/${signupId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Errore durante la cancellazione');
      await loadSignups();
      message = { type: 'success', text: 'Iscrizione cancellata.' };
    } catch (e) {
      message = { type: 'error', text: e.message };
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric',
      month: 'long', year: 'numeric'
    });
  }

  function getVolunteerName(volunteerId) {
    return volunteers.find(v => v.id === volunteerId)?.name ?? '–';
  }
</script>

<svelte:head>
  <title>{event?.title ?? 'Evento'} — Bar Campino</title>
</svelte:head>

<div class="min-h-screen bg-stone-950 text-stone-100">

  <!-- Header -->
  <header class="bg-stone-900 border-b border-stone-800 px-4 py-4">
    <div class="max-w-2xl mx-auto flex items-center gap-3">
      <a href="/" class="text-amber-400 hover:text-amber-300">← Eventi</a>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-8">

    {#if loading}
      <p class="text-stone-400 text-center py-16">Caricamento...</p>

    {:else if error}
      <p class="text-red-400 text-center py-16">{error}</p>

    {:else if event}

      <!-- Locandina -->
      {#if event.poster}
        <img
          src={`${BASE_URL}/api/files/${event.collectionId}/${event.id}/${event.poster}`}
          alt={event.title}
          class="w-full rounded-2xl object-cover max-h-72 mb-6"
        />
      {/if}

      <!-- Info evento -->
      <div class="mb-8">
        <p class="text-amber-400 text-sm font-medium uppercase tracking-wide mb-1">
          {formatDate(event.date)}
        </p>
        <h1 class="text-2xl font-bold mb-2">{event.title}</h1>
        {#if event.start_time}
          <p class="text-stone-400">
            🕐 {event.start_time}{event.end_time ? ' – ' + event.end_time : ''}
          </p>
        {/if}
        {#if event.description}
          <p class="text-stone-300 mt-3 leading-relaxed">{event.description}</p>
        {/if}
      </div>

      <!-- Turni -->
      <h2 class="text-lg font-bold mb-4">Turni</h2>

      {#if shifts.length === 0}
        <p class="text-stone-400">Nessun turno configurato.</p>
      {:else}
        <div class="flex flex-col gap-4 mb-8">
          {#each shifts as shift}
            {@const shiftSignups = signups[shift.id] ?? []}
            {@const isFull = shiftSignups.length >= shift.min_volunteers}

            <div class="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="font-semibold">{shift.name}</h3>
                  {#if shift.start_time}
                    <p class="text-stone-400 text-sm">
                      {shift.start_time}{shift.end_time ? ' – ' + shift.end_time : ''}
                    </p>
                  {/if}
                </div>
                <span class="text-sm px-2 py-1 rounded-full {isFull ? 'bg-green-900 text-green-300' : 'bg-amber-900 text-amber-300'}">
                  {shiftSignups.length}/{shift.min_volunteers}
                </span>
              </div>

              <!-- Lista iscritti -->
              {#if shiftSignups.length > 0}
                <ul class="mb-3 flex flex-col gap-1">
                  {#each shiftSignups as s}
                    <li class="flex items-center justify-between text-sm bg-stone-800 rounded-lg px-3 py-2">
                      <span>{getVolunteerName(s.volunteer)}</span>
                      <button
                        on:click={() => cancelSignup(s.id, shift.id)}
                        class="text-red-400 hover:text-red-300 text-xs"
                      >
                        Cancella
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Form iscrizione -->
        <div class="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <h3 class="font-semibold mb-4">Iscriviti a un turno</h3>

          <!-- Messaggio -->
          {#if message}
            <p class="mb-4 px-3 py-2 rounded-lg text-sm
              {message.type === 'success'
                ? 'bg-green-900 text-green-300'
                : 'bg-red-900 text-red-300'}">
              {message.text}
            </p>
          {/if}

          <div class="flex flex-col gap-3">
            <!-- Seleziona turno -->
            <div>
              <label class="text-sm text-stone-400 block mb-1">Turno</label>
              <select
                bind:value={selectedShift}
                class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              >
                <option value="">Scegli un turno...</option>
                {#each shifts as shift}
                  <option value={shift.id}>{shift.name} ({shift.start_time} – {shift.end_time})</option>
                {/each}
              </select>
            </div>

            <!-- Seleziona volontario -->
            <div>
              <label class="text-sm text-stone-400 block mb-1">Il tuo nome</label>
              <select
                bind:value={selectedVolunteer}
                class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100"
              >
                <option value="">Scegli il tuo nome...</option>
                {#each volunteers as vol}
                  <option value={vol.id}>{vol.name}</option>
                {/each}
              </select>
            </div>

            <button
              on:click={signup}
              disabled={signingUp}
              class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                     text-stone-950 font-semibold py-2 rounded-lg transition-colors"
            >
              {signingUp ? 'Iscrizione...' : 'Iscriviti'}
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </main>
</div>