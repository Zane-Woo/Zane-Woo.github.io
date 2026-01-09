/**
 * Force Service Worker to update and activate immediately, so visitors
 * can see new content after deployment without needing Ctrl+F5.
 *
 * Works with hexo-offline generated `service-worker.js` (Workbox).
 */
(function () {
  if (!("serviceWorker" in navigator)) return;

  // Prevent reload loops on controllerchange.
  let reloading = false;

  function onControllerChangeReloadOnce() {
    if (reloading) return;
    reloading = true;
    // Normal reload is enough; new SW will serve the updated precache revisions.
    window.location.reload();
  }

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      // Ensure we will reload when the new SW takes control.
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChangeReloadOnce
      );

      // Ask browser to check for a new SW script now.
      await reg.update();

      // If there's already a waiting SW, activate it immediately.
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      // If a new SW is found later during this session, activate it immediately.
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;

        installing.addEventListener("statechange", () => {
          // When installed with an existing controller, it becomes "waiting".
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            installing.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    } catch (err) {
      // Don't break the site if SW update fails.
      // eslint-disable-next-line no-console
      console.warn("[sw-update] Failed to update service worker:", err);
    }
  });
})();

