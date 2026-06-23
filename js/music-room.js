const buttons = document.querySelectorAll('[data-audio]');
buttons.forEach((button) => {
  const audio = document.getElementById(button.dataset.audio);
  const status = document.querySelector(`[data-status="${button.dataset.audio}"]`);
  audio.addEventListener('play', () => {
    document.querySelectorAll('audio').forEach((other) => {
      if (other !== audio) other.pause();
    });
    button.textContent = '⏸ Pause';
    if (status) status.textContent = 'Playing Nara’s song.';
  });
  audio.addEventListener('pause', () => {
    button.textContent = button.dataset.audio.endsWith('1') ? '▶ Play Song 1' : '▶ Play Song 2';
  });
  audio.addEventListener('error', () => {
    if (status) status.textContent = 'Audio file not found in assets/audio yet.';
  });
  button.addEventListener('click', async () => {
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch (error) {
      if (status) status.textContent = 'Add the MP3 to assets/audio, then this button will play it.';
    }
  });
});
