(() => {
  const shareButton = document.querySelector("[data-share]");
  const status = document.querySelector("[data-share-status]");

  if (!shareButton) return;

  const label = shareButton.dataset.resultLabel || "Roomie";
  const shareData = {
    title: `My Roomie Type is ${label}`,
    text: `I got ${label} on the MyRoomeo Roomie Type Test. What are you?`,
    url: window.location.href,
  };

  shareButton.addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        if (status) status.textContent = "Shared.";
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        if (status) status.textContent = "Share link copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError" && status) {
        status.textContent = "Copy the page URL to share your result.";
      }
    }
  });
})();
