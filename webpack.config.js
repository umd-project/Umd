const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    "Umd.min.js": ["./src/Umd.js"]
  },
  output: {
    filename: "[name]",
    path: path.resolve(__dirname, "dist")
  }
};