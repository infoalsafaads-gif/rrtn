(() => {
  'use strict';
  document.querySelector('.motion-toggle')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    const paused = button.closest('.infinite-gallery').classList.toggle('is-paused');
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'تشغيل حركة المعرض' : 'إيقاف حركة المعرض';
  });

  // Match the focused control to the active layer, including browser Back.
  const project = document.getElementById('ov');
  const lightbox = document.getElementById('lb');
  if (!project || !lightbox) return;
  const layers = [project, lightbox];
  const previousFocus = new Map();
  const originalTitle = "AL SAFA — صفا | تصميم · فيديو · إعلانات بالذكاء الاصطناعي";
  const wasOpen = new Map(layers.map(layer => [layer, false]));
  const focusables = layer => [...layer.querySelectorAll('a[href], button, video[controls], [tabindex="0"]')]
    .filter(node => !node.hidden && node.getClientRects().length);
  const sync = () => {
    const projectOpen = project.classList.contains('open');
    const lightboxOpen = lightbox.classList.contains('open');
    [...document.body.children].forEach(node => {
      if (['SCRIPT','STYLE','LINK'].includes(node.tagName)) return;
      if (node === lightbox) node.inert = !lightboxOpen;
      else if (node === project) node.inert = !projectOpen || lightboxOpen;
      else node.inert = projectOpen || lightboxOpen;
    });
    layers.forEach(layer => {
      const open = layer.classList.contains('open');
      if (open && !wasOpen.get(layer)) {
        previousFocus.set(layer, document.activeElement);
        (focusables(layer)[0] || layer).focus({ preventScroll: true });
      } else if (!open && wasOpen.get(layer)) {
        const previous = previousFocus.get(layer);
        if (previous?.isConnected) previous.focus({ preventScroll: true });
        if (layer === project) document.title = originalTitle;
      }
      layer.setAttribute('aria-hidden', String(!open));
      wasOpen.set(layer, open);
    });

  };
  const observer = new MutationObserver(sync);
  layers.forEach(layer => observer.observe(layer, { attributes: true, attributeFilter: ['class'] }));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const layer = lightbox.classList.contains('open') ? lightbox : project.classList.contains('open') ? project : null;
    if (!layer) return;
    const items = focusables(layer);
    const first = items[0] || layer, last = items.at(-1) || layer;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === layer)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !layer.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  });
  sync();
})();
