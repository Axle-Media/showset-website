(() => {
  const modal = document.getElementById("access-modal");
  const openButton = document.getElementById("open-access-modal");
  const secondaryButton = document.getElementById("open-access-secondary");
  const closeButton = document.getElementById("close-access-modal");
  const form = document.getElementById("preview-login-form");
  const password = document.getElementById("preview-password");
  const visibility = document.getElementById("toggle-password");
  const status = document.getElementById("login-status");
  const submit = document.getElementById("submit-preview-login");
  if (!modal || !form || !password || !status || !submit) return;

  const openModal = () => {
    if (!modal.open) modal.showModal();
    window.setTimeout(() => password.focus(), 30);
  };
  const closeModal = () => {
    if (modal.open) modal.close();
    if (openButton) openButton.focus();
  };

  if (openButton) {
    openButton.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  }
  secondaryButton?.addEventListener("click", openModal);
  closeButton?.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  visibility?.addEventListener("click", () => {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    visibility.textContent = show ? "Hide" : "Show";
    visibility.setAttribute("aria-label", show ? "Hide password" : "Show password");
    visibility.setAttribute("aria-pressed", show ? "true" : "false");
    password.focus();
  });

  if (document.body.dataset.openModal === "true") openModal();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!password.value) {
      status.textContent = "Enter the preview password to continue.";
      password.focus();
      return;
    }

    submit.disabled = true;
    submit.querySelector(".submit-label").textContent = "Checking access…";
    try {
      const response = await fetch(form.action, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: new URLSearchParams(new FormData(form))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        status.textContent = result.error || "Access could not be verified. Please try again.";
        password.select();
        return;
      }
      const destination = typeof result.redirect === "string" &&
        result.redirect.startsWith("/") &&
        !result.redirect.startsWith("//") ? result.redirect : "/";
      window.location.assign(destination);
    } catch (_error) {
      status.textContent = "We couldn’t reach the preview. Check your connection and try again.";
    } finally {
      submit.disabled = false;
      submit.querySelector(".submit-label").textContent = "Enter website";
    }
  });
})();