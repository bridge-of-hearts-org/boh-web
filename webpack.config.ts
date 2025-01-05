const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/index.tsx",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_moduels/,
                use: "ts-loader",
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader", "postcss-loader"],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "public", // Copies everything from public/ to dist/
                    to: "", // Keeps the folder structure
                },
            ],
        }),
    ],
    devServer: {
        static: [
            {
                directory: path.join(__dirname, "dist"), // Serve files from ./dist
            },
            {
                directory: path.join(__dirname, "public"), // Serve static files from ./public
                publicPath: "/", // Serve files as if they are at the root
            },
        ],
        hot: true,
        port: 3000,
    },
    mode: process.env.NODE_ENV || "development",
};
