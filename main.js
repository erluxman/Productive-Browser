const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Store = require("electron-store");

// Initialize remote module
require("@electron/remote/main").initialize();

const store = new Store();

// Initialize store with default values if empty
if (!store.get("urls")) {
  store.set("urls", []);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "LLMs",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      sandbox: false,
    },
  });

  require("@electron/remote/main").enable(win.webContents);
  win.loadFile("index.html");

  // Handle title updates from renderer
  ipcMain.handle("update-window-title", (event, title) => {
    win.setTitle(title);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers for URL management
ipcMain.handle("get-urls", () => {
  return store.get("urls");
});

ipcMain.handle("add-url", (event, urlData) => {
  const urls = store.get("urls");
  urls.push(urlData);
  store.set("urls", urls);
  return urls;
});

ipcMain.handle("remove-url", (event, urlData) => {
  const urls = store.get("urls");
  const filteredUrls = urls.filter((u) => u.url !== urlData.url);
  store.set("urls", filteredUrls);
  return filteredUrls;
});

ipcMain.handle("update-urls", (event, newUrls) => {
  store.set("urls", newUrls);
  return newUrls;
});
