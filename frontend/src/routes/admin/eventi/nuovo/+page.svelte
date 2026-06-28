<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import { PUBLIC_TOKEN, PUBLIC_BASE_URL } from '$env/static/public';

  $: token = $page.url.searchParams.get('token');
  $: auth = token === PUBLIC_TOKEN;

  let saving = false;
  let message = null;
  let form = { title: '', description: '', date: '', start_time: '', end_time: '', published: false };
  let shifts = [{ name: '', start_time: '', end_time: '', min_volunteers: 3 }];

  function addShift() {
    shifts = [...shifts, { name: '', start_time: '', end_time: '', min_volunteers: 3 }];
  }

  function removeShift(i) {
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
      const res = await fetch(`${PUBLIC_BASE_URL}/api/collections/events/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Errore nella creazione evento');
      const event = await res.json();
      for (const shift of shifts) {
        if (!shift.name) continue;
        await fetch(`${PUBLIC_BASE_URL}/api/collections/shifts/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...shift, event: event.id })
        });
      }
      goto(`/admin?token=${token}`);
    } catch (e) {
      message = { type: 'error', text: e.message };
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>Nuovo evento — Bar Campino</title></svelte:head>

<div style="min-height: 100vh; background: {auth ? 'var(--sfondo-auth)' : 'var(--sfondo)'};">
  <Header titolo="Nuovo evento" auth={auth} token={token} linkIndietro="/admin?token={token}" testoIndietro="← Admin" />

  <main class="max-w-2xl mx-auto px-4 py-8">
    {#if !auth}
      <div class="text-center py-16">
        <p class="text-4xl mb-4">🔒</p>
        <p style="color: var(--testo-muted)">Accesso non autorizzato.</p>
      </div>
    {:else}
      {#if message}
        <p class="mb-6 px-4 py-3 rounded-lg text-sm {message.type === 'success' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">{message.text}</p>
      {/if}
      <div class="flex flex-col gap-6">
        <div style="background: var(--sfondo-card); border: 1px solid var(--bordo);" class="rounded-2xl p-5">
          <h2 class="font-semibold mb-4">Informazioni evento</h2>
          <div class="flex flex-col gap-4">
            <div>
              <label class="text-sm block mb-1" style="color: var(--testo-muted)">Titolo *</label>
              <input type="text" bind:value={form.title} style="background: var(--sfondo-input); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2" placeholder="Es. Apertura estiva" />
            </div>
            <div>
              <label class="text-sm block mb-1" style="color: var(--testo-muted)">Descrizione</label>
              <textarea bind:value={form.description} rows="3" style="background: var(--sfondo-input); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2 resize-none"></textarea>
            </div>
            <div>
              <label class="text-sm block mb-1" style="color: var(--testo-muted)">Data *</label>
              <input type="date" bind:value={form.date} style="background: var(--sfondo-input); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm block mb-1" style="color: var(--testo-muted)">Orario inizio</label>
                <input type="time" bind:value={form.start_time} style="background: var(--sfondo-input); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2" />
              </div>
              <div>
                <label class="text-sm block mb-1" style="color: var(--testo-muted)">Orario fine</label>
                <input type="time" bind:value={form.end_time} style="background: var(--sfondo-input); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2" />
              </div>
            </div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={form.published} class="w-4 h-4 accent-yellow-400" />
              <span class="text-sm">Pubblica subito</span>
            </label>
          </div>
        </div>
        <div style="background: var(--sfondo-card); border: 1px solid var(--bordo);" class="rounded-2xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold">Turni</h2>
            <button on:click={addShift} class="text-sm hover:opacity-80" style="color: var(--colore-primario)">+ Aggiungi turno</button>
          </div>
          <div class="flex flex-col gap-4">
            {#each shifts as shift, i}
              <div style="background: var(--sfondo-input); border: 1px solid var(--bordo);" class="rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm" style="color: var(--testo-muted)">Turno {i + 1}</span>
                  {#if shifts.length > 1}
                    <button on:click={() => removeShift(i)} class="text-red-400 hover:text-red-300 text-xs">Rimuovi</button>
                  {/if}
                </div>
                <div class="flex flex-col gap-3">
                  <div>
                    <label class="text-sm block mb-1" style="color: var(--testo-muted)">Nome turno</label>
                    <input type="text" bind:value={shift.name} style="background: var(--sfondo-card); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2" placeholder="Es. Turno bar" />
                  </div>
                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="text-sm block mb-1" style="color: var(--testo-muted)">Inizio</label>
                      <input type="time" bind:value={shift.start_time} style="background: var(--sfondo-card); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label class="text-sm block mb-1" style="color: var(--testo-muted)">Fine</label>
                      <input type="time" bind:value={shift.end_time} style="background: var(--sfondo-card); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label class="text-sm block mb-1" style="color: var(--testo-muted)">Min. volontari</label>
                      <input type="number" bind:value={shift.min_volunteers} min="1" style="background: var(--sfondo-card); border: 1px solid var(--bordo); color: var(--testo);" class="w-full rounded-lg px-3 py-2" />
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        <button on:click={save} disabled={saving} style="background: var(--colore-primario);" class="w-full hover:opacity-90 disabled:opacity-50 text-stone-950 font-semibold py-3 rounded-xl transition-opacity">
          {saving ? 'Salvataggio...' : 'Crea evento'}
        </button>
      </div>
    {/if}
  </main>
</div>
