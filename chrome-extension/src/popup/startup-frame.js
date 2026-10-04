// Paint the static HTML frame without waiting for the full stylesheet.
// An external script handles the stylesheet swap to comply with extension CSP.
(function () {
  const stylesheet = document.getElementById("popup-styles");
  let stylesReady = !stylesheet || Boolean(stylesheet.sheet);
  let uiReady = false;

  function revealUI() {
    if (!stylesReady || !uiReady) return;
    const app = document.getElementById("popup-app");
    if (app) {
      app.inert = false;
      app.removeAttribute("aria-busy");
    }
    document.body.classList.remove("booting");
  }

  const applyStyles = () => {
    if (stylesheet) stylesheet.media = "all";
    stylesReady = true;
    revealUI();
  };
  if (stylesReady) applyStyles();
  else {
    stylesheet.addEventListener("load", applyStyles, { once: true });
    // The inline frame styles still provide a usable fallback if CSS fails.
    stylesheet.addEventListener("error", applyStyles, { once: true });
  }

  globalThis.NutEggStartup = {
    finish() {
      uiReady = true;
      revealUI();
    },
  };
})();
