const path = require("path")

module.exports = {
  entry: path.resolve(__dirname, "Umd.js"),
  output: {
    path: __dirname,
    filename: "Umd.min.js",
    library: "$",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  mode: "production",
}