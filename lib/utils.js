const fs = require("fs");

function safeFileName(text) {
  return text
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function getFontFileFilterOption() {
  const winFont = "C:/Windows/Fonts/arial.ttf";
  const macFont = "/Library/Fonts/Arial.ttf";
  const linuxFont = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

  let fontPath = null;
  if (process.platform === "win32" && fs.existsSync(winFont)) {
    fontPath = winFont;
  } else if (process.platform === "darwin" && fs.existsSync(macFont)) {
    fontPath = macFont;
  } else if (fs.existsSync(linuxFont)) {
    fontPath = linuxFont;
  }

  if (fontPath) {
    const escaped = fontPath.replace(/\\/g, "/");
    return `fontfile='${escaped}':`;
  }
  return "";
}

module.exports = {
  safeFileName,
  getFontFileFilterOption,
};
