(() => {
  'use strict';
  const panel = document.getElementById('welcomeIntro');
  const video = document.getElementById('welcomeVideo');
  if (!panel || !video) return;
  const skip = panel.querySelector('.welcome-skip');
  let timeout, restoreFocus, background = [];
  const finish = () => {
    clearTimeout(timeout);
    video.pause();
    panel.hidden = true;
    document.body.classList.remove('welcome-playing');
    background.forEach(([node, inert]) => { node.inert = inert; });
    background = [];
    try { sessionStorage.setItem('al-safa-welcome-v1', 'seen'); } catch (_) {}
    if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll:true });
  };
  const open = (manual = false) => {
    if (!panel.hidden) return;
    restoreFocus = manual ? document.activeElement : null;
    background = [...document.body.children].filter(node => node !== panel && !['SCRIPT','STYLE','LINK'].includes(node.tagName)).map(node => [node,node.inert]);
    background.forEach(([node]) => { node.inert = true; });
    panel.hidden = false;
    document.body.classList.add('welcome-playing');
    video.currentTime = 0;
    video.muted = true;
    skip.focus({ preventScroll:true });
    const play = video.play();
    if (play?.catch) play.catch(() => { if (!manual) finish(); });
    timeout = window.setTimeout(finish, 24000);
  };
  skip.addEventListener('click', finish);
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);
  document.querySelector('.welcome-replay')?.addEventListener('click', () => open(true));
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); finish(); }
    if (event.key === 'Tab') {
      // Native media controls stay usable; Tab always has a visible exit.
      if (event.shiftKey && document.activeElement === skip) { event.preventDefault(); video.focus(); }
      else if (!event.shiftKey && document.activeElement === video) { event.preventDefault(); skip.focus(); }
    }
  });
  video.tabIndex = 0;
  let seen = false;
  try { seen = sessionStorage.getItem('al-safa-welcome-v1') === 'seen'; } catch (_) {}
  if (!seen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData && !location.hash) open();
})();
