const buttons = document.querySelectorAll('[data-audio]');

function resetButton(button) {
  if (!button) return;
  button.textContent = button.dataset.audio.endsWith('1') ? '▶ Play Song 1' : '▶ Play Song 2';
}

function pauseOtherSongs(currentAudio) {
  document.querySelectorAll('audio').forEach((audio) => {
    if (audio !== currentAudio) audio.pause();
  });
}

buttons.forEach((button) => {
  const audio = document.getElementById(button.dataset.audio);
  const status = document.querySelector(`[data-status="${button.dataset.audio}"]`);

  if (!audio) return;

  audio.addEventListener('loadedmetadata', () => {
    if (status) status.textContent = 'Ready to play Nara’s MP3.';
  });

  audio.addEventListener('play', () => {
    pauseOtherSongs(audio);
    button.textContent = '⏸ Pause';
    if (status) status.textContent = 'Playing Nara’s MP3.';
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
    resetButton(button);
    if (status) {
      status.textContent = `Could not load ${audio.getAttribute('src')}. Check the committed MP3 file name.`;
    }
  });

  button.addEventListener('click', async () => {
    try {
      if (audio.paused) {
        pauseOtherSongs(audio);
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      resetButton(button);
      if (status) {
        status.textContent = `Could not play ${audio.getAttribute('src')}. Browser may still be loading it.`;
      }
    }
  });
});
