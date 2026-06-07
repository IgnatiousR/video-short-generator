import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  startProcessing: (options) => ipcRenderer.send('start-processing', options),
  onProgress: (callback) => ipcRenderer.on('process-progress', (_event, value) => callback(value)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  showItemInFolder: (pathStr) => ipcRenderer.send('shell:showItemInFolder', pathStr)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
