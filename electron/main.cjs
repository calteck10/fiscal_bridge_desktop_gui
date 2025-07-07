const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setMenu(null);
  win.webContents.openDevTools(); // <- show console

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    win.loadURL(startUrl);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}


app.whenReady().then(() => {
  // Launch your Python backend on port 8000 (adjust path and port as needed)
  const backendScript = path.join("C:", "Projects", "fiscal_bridge_src", "bridge.py");
  const backendProcess = exec(`python "${backendScript}"`, (err) => {
    if (err) {
      console.error("❌ Backend failed to start:", err);
    } else {
      console.log("✅ Backend started successfully.");
    }
  });

  backendProcess.stdout?.on("data", data => console.log(`[PY] ${data}`));
  backendProcess.stderr?.on("data", data => console.error(`[PY:ERR] ${data}`));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
