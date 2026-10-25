(() => {
  const modal = document.getElementById("access-modal");
  const openButton = document.getElementById("open-access-modal");
  const closeButton = document.getElementById("close-access-modal");
  const form = document.getElementById("preview-login-form");
  const password = document.getElementById("preview-password");
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
  closeButton?.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  if (status.textContent.trim()) password.setAttribute("aria-invalid", "true");
  password.addEventListener("input", () => password.removeAttribute("aria-invalid"));

  if (document.body.dataset.openModal === "true") openModal();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!password.value) {
      status.textContent = "";
      password.setAttribute("aria-invalid", "true");
      password.focus();
      return;
    }

    submit.disabled = true;
    submit.querySelector(".submit-label").textContent = "Submitting…";
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
        password.setAttribute("aria-invalid", "true");
        password.select();
        return;
      }
      const destination = typeof result.redirect === "string" &&
        result.redirect.startsWith("/") &&
        !result.redirect.startsWith("//") ? result.redirect : "/";
      window.location.assign(destination);
    } catch (_error) {
      status.textContent = "We couldn’t reach the preview. Check your connection and try again.";
      password.setAttribute("aria-invalid", "true");
    } finally {
      submit.disabled = false;
      submit.querySelector(".submit-label").textContent = "Submit";
    }
  });
})();