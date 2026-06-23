const buttons = document.querySelectorAll('[data-audio]');

function filename(src) {
  try {
    return decodeURIComponent(src.split('/').pop() || src);
  } catch (_) {
    return src;
  }
}

function sourceList(audio) {
  const raw = audio?.dataset?.sources || audio?.getAttribute('src') || '';
  return raw
    .split('|')
    .map((src) => src.trim())
    .filter(Boolean);
}

function sourceIndex(audio) {
  const index = Number(audio.dataset.sourceIndex || 0);
  return Number.isFinite(index) ? index : 0;
}

function setAudioSource(audio, index, status) {
  const sources = sourceList(audio);
  if (!sources.length) return false;

  const safeIndex = Math.max(0, Math.min(index, sources.length - 1));
  const nextSource = sources[safeIndex];
  audio.dataset.sourceIndex = String(safeIndex);

  if (audio.getAttribute('src') !== nextSource) {
    audio.setAttribute('src', nextSource);
    audio.load();
  }

  if (status) status.textContent = `Loading ${filename(nextSource)}...`;
  return true;
}

function tryNextSource(audio, status) {
  const sources = sourceList(audio);
  const nextIndex = sourceIndex(audio) + 1;
  if (nextIndex >= sources.length) return false;
  setAudioSource(audio, nextIndex, status);
  return true;
}

function resetButton(button) {
  if (!button) return;
  button.textContent = button.dataset.audio.endsWith('1') ? '▶ Play Song 1' : '▶ Play Song 2';
}

function pauseOtherSongs(currentAudio) {
  document.querySelectorAll('audio').forEach((audio) => {
    if (audio !== currentAudio && !audio.paused) {
      audio.pause();
      resetButton(document.querySelector(`[data-audio="${audio.id}"]`));
    }
  });
}

async function playWithFallback(audio, status) {
  const sources = sourceList(audio);
  if (!sources.length) throw new Error('No MP3 source found.');

  let attempts = 0;
  while (attempts < sources.length) {
    try {
      await audio.play();
      return true;
    } catch (error) {
      if (error && error.name === 'NotAllowedError') throw error;
      if (!tryNextSource(audio, status)) throw error;
      attempts += 1;
    }
  }
  return false;
}

buttons.forEach((button) => {
  const audio = document.getElementById(button.dataset.audio);
  const status = document.querySelector(`[data-status="${button.dataset.audio}"]`);

  if (!audio) return;

  setAudioSource(audio, 0, status);

  audio.addEventListener('loadedmetadata', () => {
    if (status) status.textContent = `Ready: ${filename(audio.getAttribute('src'))}`;
  });

  audio.addEventListener('play', () => {
    pauseOtherSongs(audio);
    button.textContent = '⏸ Pause';
    if (status) status.textContent = `Playing ${filename(audio.getAttribute('src'))}`;
  });

  audio.addEventListener('pause', () => {
    resetButton(button);
    if (status) status.textContent = 'Paused.';
  });

  audio.addEventListener('ended', () => {
    resetButton(button);
    if (status) status.textContent = 'Finished.';
  });

  audio.addEventListener('error', () => {
    if (tryNextSource(audio, status)) return;
    resetButton(button);
    if (status) {
      status.textContent = 'Could not load any committed MP3 source. Check the file names in the repo.';
    }
  });

  button.addEventListener('click', async () => {
    try {
      if (audio.paused) {
        pauseOtherSongs(audio);
        await playWithFallback(audio, status);
      } else {
        audio.pause();
      }
    } catch (error) {
      resetButton(button);
      if (status) {
        status.textContent = 'Could not play yet. Tap the native audio control below, or check the MP3 file names.';
      }
    }
  });
});
