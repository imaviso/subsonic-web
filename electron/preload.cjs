const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
	platform: process.platform,
	isElectron: true,

	// MPV audio backend
	mpv: {
		// Availability and configuration
		isAvailable: (customPath) =>
			ipcRenderer.invoke("mpv:isAvailable", customPath),
		setPath: (path) => ipcRenderer.invoke("mpv:setPath", path),
		getPath: () => ipcRenderer.invoke("mpv:getPath"),
		selectPath: () => ipcRenderer.invoke("mpv:selectPath"),

		// Lifecycle
		initialize: (data) => ipcRenderer.invoke("mpv:initialize", data),
		restart: (data) => ipcRenderer.invoke("mpv:restart", data),
		isRunning: () => ipcRenderer.invoke("mpv:isRunning"),
		cleanup: () => ipcRenderer.invoke("mpv:cleanup"),
		quit: () => ipcRenderer.send("mpv:quit"),

		// Playback controls
		play: (url) => ipcRenderer.invoke("mpv:play", url),
		setQueue: (current, next, pause) =>
			ipcRenderer.invoke("mpv:setQueue", current, next, pause),
		setQueueNext: (url) => ipcRenderer.invoke("mpv:setQueueNext", url),
		autoNext: (url) => ipcRenderer.send("mpv:autoNext", url),
		pause: () => ipcRenderer.invoke("mpv:pause"),
		resume: () => ipcRenderer.invoke("mpv:resume"),
		stop: () => ipcRenderer.invoke("mpv:stop"),
		seek: (time) => ipcRenderer.invoke("mpv:seek", time),
		setVolume: (volume) => ipcRenderer.invoke("mpv:setVolume", volume),
		mute: (mute) => ipcRenderer.invoke("mpv:mute", mute),

		// State queries
		getPosition: () => ipcRenderer.invoke("mpv:getPosition"),
		getDuration: () => ipcRenderer.invoke("mpv:getDuration"),

		// Event listeners - return cleanup functions
		onTimeUpdate: (callback) => {
			const handler = (_, data) => callback(data);
			ipcRenderer.on("mpv:timeUpdate", handler);
			return () => ipcRenderer.removeListener("mpv:timeUpdate", handler);
		},
		onEnded: (callback) => {
			const handler = () => callback();
			ipcRenderer.on("mpv:ended", handler);
			return () => ipcRenderer.removeListener("mpv:ended", handler);
		},
		onAutoNext: (callback) => {
			const handler = () => callback();
			ipcRenderer.on("mpv:autoNext", handler);
			return () => ipcRenderer.removeListener("mpv:autoNext", handler);
		},
		onError: (callback) => {
			const handler = (_, error) => callback(error);
			ipcRenderer.on("mpv:error", handler);
			return () => ipcRenderer.removeListener("mpv:error", handler);
		},
		onStateChange: (callback) => {
			const handler = (_, state) => callback(state);
			ipcRenderer.on("mpv:stateChange", handler);
			return () => ipcRenderer.removeListener("mpv:stateChange", handler);
		},
		onFallback: (callback) => {
			const handler = (_, isError) => callback(isError);
			ipcRenderer.on("mpv:fallback", handler);
			return () => ipcRenderer.removeListener("mpv:fallback", handler);
		},
	},
});
