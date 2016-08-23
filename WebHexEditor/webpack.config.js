var webpack = require("webpack")

module.exports = {
    entry: "./src/index.tsx",
    output: {
        filename: "./dist/app.js"
    },
    resolve: {
        extensions: ['', '.Webpack.js', '.web.js', '.ts', '.js', '.tsx']
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'ts-loader'
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            ReactDOM: 'react-dom',
            React: 'react'
        })
    ]
}