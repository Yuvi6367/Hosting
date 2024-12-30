document.addEventListener("DOMContentLoaded", () => {
    const siteSelector = document.getElementById("open-selector");
    const sitePopup = document.getElementById("site-popup");
    const overlay = document.getElementById("overlay");
    const closePopup = document.getElementById("close-popup");
    const siteList = document.getElementById("site-list");
    const addSiteButton = document.getElementById("add-site-button");
    const newSiteInput = document.getElementById("new-site");
    const selectedSite = document.getElementById("selected-site");
    const deletePopup = document.getElementById("delete-popup");
    const siteToDelete = document.getElementById("site-to-delete");
    const confirmDelete = document.getElementById("confirm-delete");
    const cancelDelete = document.getElementById("cancel-delete");
  
    let currentSiteToDelete = null;
  
    // Open popup
    siteSelector.addEventListener("click", () => {
      sitePopup.classList.add("show");
      overlay.classList.add("show");
    });
  
    // Close popup
    closePopup.addEventListener("click", closePopupHandler);
    overlay.addEventListener("click", closePopupHandler);
  
    function closePopupHandler() {
      sitePopup.classList.remove("show");
      overlay.classList.remove("show");
    }
  
    // Add new site
    addSiteButton.addEventListener("click", () => {
      const siteName = newSiteInput.value.trim();
      if (siteName === "") return;
  
      // Create new list item
      const li = document.createElement("li");
      li.classList.add("site-option");
      li.setAttribute("data-site", siteName);
      li.innerHTML = `
        ${siteName}
        <button class="delete-site" data-site="${siteName}">Delete</button>
      `;
  
      // Add to list and clear input
      siteList.appendChild(li);
      newSiteInput.value = "";
  
      // Attach event listeners for new site
      li.addEventListener("click", selectSite);
      li.querySelector(".delete-site").addEventListener("click", deleteSiteHandler);
    });
  
    // Select a site
    function selectSite(event) {
      if (event.target.classList.contains("delete-site")) return; // Skip if delete button clicked
      const siteName = event.currentTarget.getAttribute("data-site");
      selectedSite.textContent = siteName;
      closePopupHandler();
    }
  
    // Delete site
    function deleteSiteHandler(event) {
      event.stopPropagation();
      const siteName = event.target.getAttribute("data-site");
      currentSiteToDelete = event.target.closest(".site-option");
      siteToDelete.textContent = siteName;
      deletePopup.classList.add("show");
      overlay.classList.add("show");
    }
  
    // Confirm delete
    confirmDelete.addEventListener("click", () => {
      if (currentSiteToDelete) {
        currentSiteToDelete.remove();
        currentSiteToDelete = null;
      }
      closeDeletePopup();
    });
  
    // Cancel delete
    cancelDelete.addEventListener("click", closeDeletePopup);
  
    function closeDeletePopup() {
      deletePopup.classList.remove("show");
      overlay.classList.remove("show");
    }
  
    // Attach listeners to initial sites
    document.querySelectorAll(".site-option").forEach((site) => {
      site.addEventListener("click", selectSite);
      site.querySelector(".delete-site").addEventListener("click", deleteSiteHandler);
    });
  });