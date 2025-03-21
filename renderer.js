const { ipcRenderer } = require("electron");

// Store webviews and their original URLs in memory
const webviewStore = new Map();
const originalUrls = new Map();

// Function to get favicon URL
function getFaviconUrl(url) {
  try {
    const urlObject = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObject.hostname}&size=128`;
  } catch (e) {
    return "https://www.google.com/s2/favicons?domain=default&size=128";
  }
}

// Function to update window title
function updateWindowTitle(title) {
  document.getElementById("titlebar-title").textContent = title;
  ipcRenderer.invoke("update-window-title", title);
}

// Function to load URL in webview
function loadUrlInWebview(url) {
  const container = document.getElementById("webview-container");
  const welcomeScreen = document.getElementById("welcome-screen");
  const preferencesScreen = document.getElementById("preferences-screen");
  const resetButton = document.getElementById("reset-button");

  // Update active state in sidebar
  const urlItems = document.querySelectorAll(".url-item");
  urlItems.forEach((item) => item.classList.remove("active"));
  const activeItem = Array.from(urlItems).find(
    (item) => item.dataset.url === url
  );
  if (activeItem) {
    activeItem.classList.add("active");
  }

  // Hide preferences screen if visible
  if (preferencesScreen.classList.contains("active")) {
    preferencesScreen.classList.remove("active");
  }

  // Hide welcome screen
  if (welcomeScreen) {
    welcomeScreen.style.display = "none";
  }

  // Show webview container
  container.style.display = "flex";

  // Hide all existing webviews
  webviewStore.forEach((webview) => {
    webview.style.display = "none";
  });

  // Get or create webview for this URL
  let webview = webviewStore.get(url);
  if (!webview) {
    webview = document.createElement("webview");
    webview.src = url;
    webview.setAttribute("allowpopups", "true");
    webview.style.display = "flex";

    // Store original URL
    originalUrls.set(webview, url);

    // Add event listeners for the webview
    webview.addEventListener("page-title-updated", (e) => {
      if (webview.style.display === "flex") {
        updateWindowTitle(e.title);
      }
    });

    webview.addEventListener("did-navigate", (e) => {
      if (webview.style.display === "flex") {
        resetButton.classList.toggle(
          "visible",
          e.url !== originalUrls.get(webview)
        );
      }
    });

    webview.addEventListener("did-navigate-in-page", (e) => {
      if (webview.style.display === "flex") {
        resetButton.classList.toggle(
          "visible",
          e.url !== originalUrls.get(webview)
        );
      }
    });

    container.appendChild(webview);
    webviewStore.set(url, webview);
  } else {
    webview.style.display = "flex";
    resetButton.classList.toggle(
      "visible",
      webview.getURL() !== originalUrls.get(webview)
    );
  }

  // Update window title
  updateWindowTitle(url);
}

// Function to create URL item element for sidebar
function createUrlItem(urlData) {
  const div = document.createElement("div");
  div.className = "url-item";
  // Add active class if this URL is currently loaded
  const activeWebview = Array.from(webviewStore.values()).find(
    (webview) => webview.style.display === "flex"
  );
  if (activeWebview && activeWebview.src === urlData.url) {
    div.classList.add("active");
  }
  div.dataset.url = urlData.url;
  div.draggable = true;

  const favicon = document.createElement("img");
  favicon.src = getFaviconUrl(urlData.url);
  favicon.onerror = () => {
    favicon.src = "https://www.google.com/s2/favicons?domain=default&size=128";
  };

  const tooltip = document.createElement("span");
  tooltip.className = "url-tooltip";
  tooltip.textContent = urlData.url;

  div.appendChild(favicon);
  div.appendChild(tooltip);

  div.onclick = () => {
    loadUrlInWebview(urlData.url);
  };

  // Add drag and drop event listeners
  div.addEventListener("dragstart", handleSidebarDragStart);
  div.addEventListener("dragend", handleSidebarDragEnd);
  div.addEventListener("dragover", handleSidebarDragOver);
  div.addEventListener("drop", handleSidebarDrop);

  return div;
}

// Function to create URL list item for preferences
function createUrlListItem(urlData) {
  const li = document.createElement("li");
  li.className = "url-list-item";
  li.draggable = true;
  li.dataset.url = urlData.url;

  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⋮";

  const favicon = document.createElement("img");
  favicon.src = getFaviconUrl(urlData.url);
  favicon.onerror = () => {
    favicon.src = "https://www.google.com/s2/favicons?domain=default&size=128";
  };

  const urlText = document.createElement("span");
  urlText.textContent = urlData.url;

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.onclick = (e) => {
    e.stopPropagation();
    removeUrl(urlData);
  };

  li.appendChild(dragHandle);
  li.appendChild(favicon);
  li.appendChild(urlText);
  li.appendChild(removeBtn);

  return li;
}

// Function to refresh URL lists
async function refreshUrlLists() {
  const urlList = document.getElementById("url-list");
  const preferencesUrlList = document.getElementById("preferences-url-list");

  urlList.innerHTML = "";
  preferencesUrlList.innerHTML = "";

  const urls = await ipcRenderer.invoke("get-urls");
  urls.forEach((url) => {
    urlList.appendChild(createUrlItem(url));
    preferencesUrlList.appendChild(createUrlListItem(url));
  });

  // Reinitialize drag and drop
  initializeDragAndDrop();
}

// Function to initialize drag and drop
function initializeDragAndDrop() {
  const urlList = document.getElementById("preferences-url-list");
  const items = urlList.getElementsByClassName("url-list-item");

  Array.from(items).forEach((item) => {
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragend", handleDragEnd);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
  });
}

// Drag and drop handlers
let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  this.style.opacity = "0.4";
}

function handleDragEnd(e) {
  this.style.opacity = "1";
  draggedItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  if (this === draggedItem) return;

  const rect = this.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;

  if (e.clientY < midY) {
    this.parentNode.insertBefore(draggedItem, this);
  } else {
    this.parentNode.insertBefore(draggedItem, this.nextSibling);
  }
}

function handleDrop(e) {
  e.preventDefault();
  if (this === draggedItem) return;

  const urlList = document.getElementById("preferences-url-list");
  const items = Array.from(urlList.getElementsByClassName("url-list-item"));
  const newUrls = items.map((item) => ({ url: item.dataset.url }));

  ipcRenderer.invoke("update-urls", newUrls).then(() => {
    refreshUrlLists();
  });
}

// Sidebar drag and drop handlers
let sidebarDraggedItem = null;

function handleSidebarDragStart(e) {
  sidebarDraggedItem = this;
  this.style.opacity = "0.4";
}

function handleSidebarDragEnd(e) {
  this.style.opacity = "1";
  sidebarDraggedItem = null;
}

function handleSidebarDragOver(e) {
  e.preventDefault();
  if (this === sidebarDraggedItem) return;

  const rect = this.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;

  if (e.clientY < midY) {
    this.parentNode.insertBefore(sidebarDraggedItem, this);
  } else {
    this.parentNode.insertBefore(sidebarDraggedItem, this.nextSibling);
  }
}

function handleSidebarDrop(e) {
  e.preventDefault();
  if (this === sidebarDraggedItem) return;

  const urlList = document.getElementById("url-list");
  const items = Array.from(urlList.getElementsByClassName("url-item"));
  const newUrls = items.map((item) => ({ url: item.dataset.url }));

  ipcRenderer.invoke("update-urls", newUrls).then(() => {
    refreshUrlLists();
  });
}

// Function to add new URL
async function addUrl(url) {
  try {
    new URL(url); // Validate URL
    await ipcRenderer.invoke("add-url", { url });
    await refreshUrlLists();
    return true;
  } catch (e) {
    alert("Please enter a valid URL");
    return false;
  }
}

// Function to remove URL
async function removeUrl(urlData) {
  // Remove webview from store and DOM
  const webview = webviewStore.get(urlData.url);
  if (webview) {
    webview.remove();
    webviewStore.delete(urlData.url);
    originalUrls.delete(webview);
  }

  await ipcRenderer.invoke("remove-url", urlData);
  await refreshUrlLists();
}

// Function to show preferences
function showPreferences() {
  document.getElementById("preferences-screen").classList.add("active");
  document.getElementById("webview-container").style.display = "none";
  // Store the currently active webview URL
  const activeWebview = Array.from(webviewStore.values()).find(
    (webview) => webview.style.display === "flex"
  );
  if (activeWebview) {
    document.body.dataset.lastActiveUrl = activeWebview.src;
  }
}

// Function to hide preferences
function hidePreferences() {
  document.getElementById("preferences-screen").classList.remove("active");
  document.getElementById("webview-container").style.display = "flex";

  // Restore the last active webview
  const lastActiveUrl = document.body.dataset.lastActiveUrl;
  if (lastActiveUrl) {
    loadUrlInWebview(lastActiveUrl);
    delete document.body.dataset.lastActiveUrl;
  } else {
    // Show welcome screen if no last active URL
    const welcomeScreen = document.getElementById("welcome-screen");
    if (welcomeScreen) {
      welcomeScreen.style.display = "flex";
    }
  }
}

// Event listeners
document.getElementById("preferences-button").addEventListener("click", () => {
  showPreferences();
});

document.getElementById("close-preferences").addEventListener("click", () => {
  hidePreferences();
});

document
  .getElementById("add-url-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("url-input");
    const url = input.value.trim();

    if (url && (await addUrl(url))) {
      input.value = "";
    }
  });

// Reset button handler
document.getElementById("reset-button").addEventListener("click", () => {
  const activeWebview = Array.from(webviewStore.values()).find(
    (webview) => webview.style.display === "flex"
  );

  if (activeWebview) {
    const originalUrl = originalUrls.get(activeWebview);
    activeWebview.loadURL(originalUrl);
    document.getElementById("reset-button").classList.remove("visible");
    updateWindowTitle(originalUrl);
  }
});

// Function to cycle through URLs
function cycleUrls(direction = "forward") {
  const urlItems = Array.from(document.querySelectorAll(".url-item"));
  if (urlItems.length === 0) return;

  // Find current active item index
  const currentIndex = urlItems.findIndex((item) =>
    item.classList.contains("active")
  );
  let nextIndex;

  if (currentIndex === -1) {
    // If no active item, start from beginning
    nextIndex = 0;
  } else {
    // Calculate next index with looping
    if (direction === "forward") {
      nextIndex = (currentIndex + 1) % urlItems.length;
    } else {
      nextIndex = (currentIndex - 1 + urlItems.length) % urlItems.length;
    }
  }

  // Load the next URL
  const nextUrl = urlItems[nextIndex].dataset.url;
  loadUrlInWebview(nextUrl);
}

// Keyboard shortcut handler
document.addEventListener("keydown", (e) => {
  // Check if preferences screen is active
  const preferencesScreen = document.getElementById("preferences-screen");
  if (preferencesScreen.classList.contains("active")) return;

  // Option (Alt) + Tab for forward cycling
  if (e.ctrlKey && e.key === "Tab") {
    e.preventDefault(); // Prevent default Alt+Tab behavior
    cycleUrls("forward");
  }

  // Option (Alt) + Shift + Tab for backward cycling
  if (e.ctrlKey && e.shiftKey && e.key === "Tab") {
    e.preventDefault(); // Prevent default Alt+Shift+Tab behavior
    cycleUrls("backward");
  }
});

// Initial load
refreshUrlLists();
