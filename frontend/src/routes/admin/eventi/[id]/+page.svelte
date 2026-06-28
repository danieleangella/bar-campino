<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  const BASE_URL = 'http://127.0.0.1:8090';
  const ADMIN_TOKEN = 'campino2026admin';

  $: token = $page.url.searchParams.get('token');
  $: authorized = token === ADMIN_TOKEN;
  $: eventId = $page.params.id;

  let loading = true;
  let saving = false;
  let message = null;

  let form = {
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    published: false,
  };

  let shifts = [];
  let deletedShifts = [];

  onMount(async () => {
    if (!authorized) { loading = false; return; }

    try {
      // Carica evento
      const res = await fetch(`${BASE_URL}/api/collections/events/records/${eventId}`);
      if (!res.ok) throw new Error('Evento non trovato');
      const event = await res.json();

      form = {
        title: event.title ?? '',
        description: event.description ?? '',
        date: event.date ? event.date.split(' ')[0] : '',
        start_time: event.start_time ?? '',
        end_time: event.end_time ?? '',
        published: event.published ?? false,
      };

      // Carica turni
      const shiftsRes = await fetch(
        `${BASE_URL}/api/collections/shifts/records?filter=event%3D"${eventId}"&sort=%2Bstart_time&perPage=200`
      );
      const shiftsData = await shiftsRes.json();
      shifts = shiftsData.items.map(s => ({
        id: s.id,
        name: s.name,
        start_time: s.start_time ?? '',
        end_time: s.end_time ?? '',
        min_volunteers: s.min_volunteers ?? 3,
      }));

    } catch (e) {
      message = { type: 'error', text: e.message };
    } finally {
      loading = false;
    }
  });

  function addShift() {
    shifts = [...shifts, { name: '', start_time: '', end_time: '', min_volunteers: 3 }];
  }

  function removeShift(i) {
    const shift = shifts[i];
    if (shift.id) deletedShifts = [...deletedShifts, shift.id];
    shifts = shifts.filter((_, idx) => idx !== i);
  }

  async function save() {
    if (!form.title || !form.date) {
      message = { type: 'error', text: 'Titolo e data sono obbligatori.' };
      return;
    }

    saving = true;
    message = null;

    try {
      // Aggiorna evento
      const res = await fetch(`${BASE_URL}/api/collections/events/records/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Errore aggiornamento evento');

      // Elimina turni rimossi
      for (const id of deletedShifts) {
        await fetch(`${BASE_URL}/api/collections/shifts/records/${id}`, {
          method: 'DELETE'
        });
      }

      // Salva turni
      for (const shift of shifts) {
        if (!shift.name) continue;
        if (shift.id) {
          // Aggiorna turno esistente
          await fetch(`${BASE_URL}/api/collections/shifts/records/${shift.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: shift.name,
              start_time: shift.start_time,
              end_time: shift.end_time,
              min_volunteers: shift.min_volunteers,
            })
          });
        } else {
          // Crea nuovo turno
          await fetch(`${BASE_URL}/api/collections/shifts/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...shift, event: eventId })
          });
        }
      }

      goto(`/admin?token=${token}`);

    } catch (e) {
      message = { type: 'error', text: e.message };
    } finally {
      saving = false;
    }
  }
</script>

<div class="min-h-screen bg-stone-950 text-stone-100">
  <header class="bg-stone-900 border-b border-stone-800 px-4 py-4">
    <div class="max-w-2xl mx-auto flex items-center justify-between">
      <h1 class="text-xl font-bold text-amber-400">Modifica evento</h1>
      <a href="/admin" class="text-stone-400 hover:text-stone-300 text-sm">← Admin</a>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-8">
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

      <div class="flex flex-col gap-6">

        <div class="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <h2 class="font-semibold mb-4">Informazioni evento</h2>
          <div class="flex flex-col gap-4">
            <div>
              <label class="text-sm text-stone-400 block mb-1">Titolo *</label>
              <input type="text" bind:value={form.title} class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100" />
            </div>
            <div>
              <label class="text-sm text-stone-400 block mb-1">Descrizione</label>
              <textarea bind:value={form.description} rows="3" class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 resize-none"></textarea>
            </div>
            <div>
              <label class="text-sm text-stone-400 block mb-1">Data *</label>
              <input type="date" bind:value={form.date} class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm text-stone-400 block mb-1">Orario inizio</label>
                <input type="time" bind:value={form.start_time} class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100" />
              </div>
              <div>
                <label class="text-sm text-stone-400 block mb-1">Orario fine</label>
                <input type="time" bind:value={form.end_time} class="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-100" />
              </div>
            </div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={form.published} class="w-4 h-4 accent-amber-500" />
              <span class="text-sm">Pubblicato (visibile nella pagina pubblica)</span>
            </label>
          </div>
        </div>

        <div class="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold">Turni</h2>
            <button on:click={addShift} class="text-sm text-amber-400 hover:text-amber-300">+ Aggiungi turno</button>
          </div>
          <div class="flex flex-col gap-4">
            {#each shifts as shift, i}
              <div class="bg-stone-800 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm text-stone-400">Turno {i + 1}</span>
                  <button on:click={() => removeShift(i)} class="text-red-400 hover:text-red-300 text-xs">Rimuovi</button>
                </div>
                <div class="flex flex-col gap-3">
                  <div>
                    <label class="text-sm text-stone-400 block mb-1">Nome turno</label>
                    <input type="text" bind:value={shift.name} class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100" />
                  </div>
                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="text-sm text-stone-400 block mb-1">Inizio</label>
                      <input type="time" bind:value={shift.start_time} class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100" />
                    </div>
                    <div>
                      <label class="text-sm text-stone-400 block mb-1">Fine</label>
                      <input type="time" bind:value={shift.end_time} class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100" />
                    </div>
                    <div>
                      <label class="text-sm text-stone-400 block mb-1">Min. volontari</label>
                      <input type="number" bind:value={shift.min_volunteers} min="1" class="w-full bg-stone-700 border border-stone-600 rounded-lg px-3 py-2 text-stone-100" />
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <button on:click={save} disabled={saving} class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold py-3 rounded-xl transition-colors">
          {saving ? 'Salvataggio...' : 'Salva modifiche'}
        </button>

      </div>
    {/if}
  </main>
</div>
