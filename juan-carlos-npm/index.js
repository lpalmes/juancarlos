"use strict";

const path = require("path");

let binary;
if (process.platform === "darwin" && process.arch === "x64") {
  binary = path.join(__dirname, "macos-x64", "juancarlos");
} else if (process.platform === "darwin" && process.arch === "arm64") {
  binary = path.join(__dirname, "macos-arm64", "juancarlos");
} else if (process.platform === "linux" && process.arch === "x64") {
  binary = path.join(__dirname, "linux-x64", "juancarlos");
} else if (process.platform === "linux" && process.arch === "arm64") {
  binary = path.join(__dirname, "linux-arm64", "juancarlos");
} else if (process.platform === "win32" && process.arch === "x64") {
  binary = path.join(__dirname, "win-x64", "juancarlos.exe");
} else {
  binary = null;
}

module.exports = binary;
