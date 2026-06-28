<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import { PUBLIC_TOKEN, PUBLIC_BASE_URL } from '$env/static/public';

  let event = null;
  let shifts = [];
  let volunteers = [];
  let signups = {};
  let loading = true;
  let error = null;
  let selectedVolunteer = '';
  let selectedShift = '';
  let signingUp = false;
  let message = null;

  $: eventId = $page.params.id;
  $: token = $page.url.searchParams.get('token');
  $: auth = token === PUBLIC_TOKEN;

  onMount(async () => {
    try {
      const eventRes = await fetch(`${PUBLIC_BASE_URL}/api/collections/events/records/${eventId}`);
      if (!eventRes.ok) throw new Error('Evento non trovato');
      event = await eventRes.json();
      const shiftsRes = await fetch(
        `${PUBLIC_BASE_URL}/api/collections/shifts/records?filter=event%3D"${eventId}"&sort=%2Bstart_time`
      );
      const shiftsData = await shiftsRes.json();
      shifts = shiftsData.items ?? [];
      const volRes = await fetch(
        `${PUBLIC_BASE_URL}/api/collections/volunteers/records?filter=active%3Dtrue&sort=%2Bname&perPage=200`
      );
      const volData = await volRes.json();
      volunteers = volData.items ?? [];
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
        `${PUBLIC_BASE_URL}/api/collections/shift_signups/records?filter=shift%3D"${shift.id}"&perPage=200`
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
    const already = signups[selectedShift]?.find(s => s.volunteer === selectedVolunteer);
    if (already) {
      message = { type: 'error', text: 'Sei già iscritto a questo turno.' };
      return;
    }
    signingUp = true;
    message = null;
    try {
      const res = await fetch(`${PUBLIC_BASE_URL}/api/collections/shift_signups/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift: selectedShift, volunteer: selectedVolunteer, signed_up_at: new Date().toISOString() })
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

  async function cancelSignup(signupId) {
    try {
      await fetch(`${PUBLIC_BASE_URL}/api/collections/shift_signups/records/${signupId}`, { method: 'DELETE' });
      await loadSignups();
      message = { type: 'success', text: 'Iscrizione cancellata.' };
    } catch (e) {
      message = { type: 'error', text: e.message };
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function getVolunteerName(volunteerId) {
    return volunteers.find(v => v.id === volunteerId)?.name ?? '–';
  }
</script>

<svelte:head><title>{event?.title ?? 'Evento'} — Bar Campino</title></svelte:head>

<div style="min-height: 100vh; background: {auth ? 'var(--sfondo-auth)' : 'var(--sfondo)'};">
  <Header titolo="Bar Campino" auth={auth} token={token} linkIndietro="/?token={token}" testoIndietro="← Eventi" />

  <main class="max-w-2xl mx-auto px-4 py-8">
    {#if loading}
      <p class="text-center py-16" style="color: var(--testo-muted)">Caricamento...</p>
    {:else if error}
      <p class="text-center py-16 text-red-400">{error}</p>
    {:else if event}
      {#if event.poster}
        <img src={`${PUBLIC_BASE_URL}/api/files/${event.collectionId}/${event.id}/${event.poster}`} alt={event.title} class="w-full rounded-2xl object-cover max-h-72 mb-6" />
      {/if}
      <div class="mb-8">
        <p class="text-sm font-medium uppercase tracking-wide mb-1" style="color: var(--colore-primario)">{formatDate(event.date)}</p>
        <h1 class="text-2xl font-bold mb-2">{event.title}</h1>
        {#if event.start_time}
          <p class="text-sm mb-3" style="color: var(--testo-muted)">🕐 {event.start_time}{event.end_time ? ' – ' + event.end_time : ''}</p>
        {/if}
        {#if event.description}
          <div class="text-sm leading-relaxed" style="color: var(--testo-muted)">{@html event.description}</div>
        {/if}
      </div>

      <h2 class="text-lg font-bold mb-4">Turni</h2>
      {#if shifts.length === 0}
        <p style="color: var(--testo-muted)">Nessun turno configurato.</p>
      {:else}
        <div class="flex flex-col gap-4 mb-8">
          {#each shifts as shift}
            {@const shiftSignups = signups[shift.id] ?? []}
            {@const isFull = shiftSignups.length >= shift.min_volunteers}
            <div style="background: var(--sfondo-card); border: 1px solid var(--bordo);" class="rounded-2xl p-5">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h3 class="font-semibold">{shift.name}</h3>
                  {#if shift.start_time}
                    <p class="text-sm" style="color: var(--testo-muted)">{shift.start_time}{shift.end_time ? ' – ' + shift.end_time : ''}</p>
                  {/if}
                </div>
                <span class="text-sm px-2 py-1 rounded-full {isFull ? 'bg-green-900 text-green-300' : 'bg-amber-900 text-amber-300'}">{shiftSignups.length}/{shift.min_volunteers}</span>
              </div>
              {#if shiftSignups.length > 0}
                <ul class="mb-3 flex flex-col gap-1">
                  {#each shiftSignups as s}
                    <li class="flex items-center justify-between text-sm rounded-lg px-3 py-2" style="background: var(--sfondo-input)">
                      <span>{getVolunteerName(s.volunteer)}</span>
                      <button on:click={() => cancelSignup(s.id)} class="text-red-400 hover:text-red-300 text-xs">Cancella</button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/each}
        </div>

        <div style="background: var(--sfondo-card); border: 1px solid var(--bordo);" class="rounded-2xl p-5">
          <h3 class="font-semibold mb-4">Iscriviti a un turno</h3>
          {#if message}
            <p class="mb-4 px-3 py-2 rounded-lg text-sm {message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">{message.text}</p>
          {/if}
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-sm block mb-1" style="color: var(--testo-muted)">Turno</label>
              <select bind:value={selectedShift} style="background: var(--sfondo-input); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2">
                <option value="">Scegli un turno...</option>
                {#each shifts as shift}
                  <option value={shift.id}>{shift.name} ({shift.start_time} – {shift.end_time})</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="text-sm block mb-1" style="color: var(--testo-muted)">Il tuo nome</label>
              <select bind:value={selectedVolunteer} style="background: var(--sfondo-input); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2">
                <option value="">Scegli il tuo nome...</option>
                {#each volunteers as vol}
                  <option value={vol.id}>{vol.name}</option>
                {/each}
              </select>
            </div>
            <button on:click={signup} disabled={signingUp} style="background: var(--colore-primario);" class="w-full hover:opacity-90 disabled:opacity-50 text-stone-950 font-semibold py-2 rounded-lg transition-opacity">
              {signingUp ? 'Iscrizione...' : 'Iscriviti'}
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </main>
</div>
