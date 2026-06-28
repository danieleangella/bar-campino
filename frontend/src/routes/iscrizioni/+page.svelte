<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { PUBLIC_TOKEN } from '$env/static/public';

  const BASE_URL = 'http://127.0.0.1:8090';

  let authorized = false;
  let events = [];
  let shifts = {};
  let volunteers = [];
  let signups = {};
  let loading = true;
  let error = null;

  // Evento selezionato
  let selectedEvent = null;

  // Per l'iscrizione
  let selectedVolunteer = '';
  let selectedShift = '';
  let signingUp = false;
  let message = null;

  onMount(async () => {
    // Controlla il token
    const token = $page.url.searchParams.get('token');
    if (token !== PUBLIC_TOKEN) {
      authorized = false;
      loading = false;
      return;
    }
    authorized = true;

    try {
      // Carica eventi futuri pubblicati
      const today = new Date().toISOString().split('T')[0];
      const eventsRes = await fetch(
        `${BASE_URL}/api/collections/events/records?filter=published%3Dtrue%26%26date>%3D"${today}"&sort=%2Bdate&perPage=200`
      );
      const eventsData = await eventsRes.json();
      events = eventsData.items ?? [];

      // Carica volontari attivi
      const volRes = await fetch(
        `${BASE_URL}/api/collections/volunteers/records?filter=active%3Dtrue&sort=%2Bname&perPage=200`
      );
      const volData = await volRes.json();
      volunteers = volData.items ?? [];

    } catch (e) {
      error = 'Errore nel caricamento dei dati.';
    } finally {
      loading = false;
    }
  });

  async function selectEvent(event) {
    selectedEvent = event;
    selectedShift = '';
    selectedVolunteer = '';
    message = null;

    // Carica turni dell'evento
    const shiftsRes = await fetch(
      `${BASE_URL}/api/collections/shifts/records?filter=event%3D"${event.id}"&sort=%2Bstart_time&perPage=200`
    );
    const shiftsData = await shiftsRes.json();
    shifts[event.id] = shiftsData.items ?? [];
    shifts = { ...shifts };

    // Carica iscrizioni
    await loadSignups(event.id);
  }

  async function loadSignups(eventId) {
    const eventShifts = shifts[eventId] ?? [];
    for (const shift of eventShifts) {
      const res = await fetch(
        `${BASE_URL}/api/collections/shift_signups/records?filter=shift%3D"${shift.id}"&perPage=200`
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
      await loadSignups(selectedEvent.id);
      selectedShift = '';
      selectedVolunteer = '';

    } catch (e) {
      message = { type: 'error', text: e.message };
    } finally {
      signingUp = false;
    }
  }

  async function cancelSignup(signupId, shiftId) {
    try {
      await fetch(
        `${BASE_URL}/api/collections/shift_signups/records/${signupId}`,
        { method: 'DELETE' }
      );
      await loadSignups(selectedEvent.id);
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
  <title>Iscrizione turni — Bar Campino</title>
</svelte:head>

<div class="min-h-screen bg-stone-950 text-stone-100">

  <header class="bg-stone-900 border-b border-stone-800 px-4 py-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-amber-400">Bar Campino</h1>
      <p class="text-stone-400 mt-1">Iscrizione turni volontari</p>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-8">

    {#if loading}
      <p class="text-stone-400 text-center py-16">Caricamento...</p>

    {:else if !authorized}
      <div class="text-center py-16">
        <p class="text-4xl mb-4">🔒</p>
        <p class="text-stone-400">Link non valido o scaduto.</p>
      </div>

    {:else if error}
      <p class="text-red-400 text-center py-16">{error}</p>

    {:else}

      <!-- Lista eventi -->
      {#if !selectedEvent}
        <h2 class="text-lg font-bold mb-4">Scegli un evento</h2>

        {#if events.length === 0}
          <p class="text-stone-400">Nessun evento in programma.</p>
        {:else}
          <div class="flex flex-col gap-3">
            {#each events as event}
              <button
                on:click={() => selectEvent(event)}
                class="bg-stone-900 border border-stone-800 hover:border-amber-500
                       rounded-2xl p-5 text-left transition-colors"
              >
                <p class="text-amber-400 text-sm mb-1">{formatDate(event.date)}</p>
                <p class="font-semibold">{event.title}</p>
                {#if event.start_time}
                  <p class="text-stone-400 text-sm mt-1">
                    🕐 {event.start_time}{event.end_time ? ' – ' + event.end_time : ''}
                  </p>
                {/if}
              </button>
            {/each}
          </div>
        {/if}

      <!-- Dettaglio evento e turni -->
      {:else}
        <button
          on:click={() => { selectedEvent = null; message = null; }}
          class="text-amber-400 hover:text-amber-300 mb-6 block"
        >
          ← Tutti gli eventi
        </button>

        <p class="text-amber-400 text-sm mb-1">{formatDate(selectedEvent.date)}</p>
        <h2 class="text-xl font-bold mb-6">{selectedEvent.title}</h2>

        <!-- Turni -->
        <div class="flex flex-col gap-4 mb-6">
          {#each shifts[selectedEvent.id] ?? [] as shift}
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
                <span class="text-sm px-2 py-1 rounded-full
                  {isFull ? 'bg-green-900 text-green-300' : 'bg-amber-900 text-amber-300'}">
                  {shiftSignups.length}/{shift.min_volunteers}
                </span>
              </div>

              {#if shiftSignups.length > 0}
                <ul class="flex flex-col gap-1">
                  {#each shiftSignups as s}
                    <li class="flex items-center justify-between text-sm
                               bg-stone-800 rounded-lg px-3 py-2">
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

          {#if message}
            <p class="mb-4 px-3 py-2 rounded-lg text-sm
              {message.type === 'success'
                ? 'bg-green-900 text-green-300'
                : 'bg-red-900 text-red-300'}">
              {message.text}
            </p>
          {/if}

          <div class="flex flex-col gap-3">
            <div>
              <label class="text-sm text-stone-400 block mb-1">Turno</label>
              <select
                bind:value={selectedShift}
                class="w-full bg-stone-800 border border-stone-700
                       rounded-lg px-3 py-2 text-stone-100"
              >
                <option value="">Scegli un turno...</option>
                {#each shifts[selectedEvent.id] ?? [] as shift}
                  <option value={shift.id}>
                    {shift.name} ({shift.start_time} – {shift.end_time})
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label class="text-sm text-stone-400 block mb-1">Il tuo nome</label>
              <select
                bind:value={selectedVolunteer}
                class="w-full bg-stone-800 border border-stone-700
                       rounded-lg px-3 py-2 text-stone-100"
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