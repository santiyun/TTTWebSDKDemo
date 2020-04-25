const path = require('path');
const webpack = require('webpack');

module.exports = {
    cache: true,
    entry: {
        websdkwrap: './src/js/tttwebsdkwrap.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        publicPath: '/dist'
    },
    mode: 'development',
    // mode: 'production',
    module: {
        rules: [
            {
                test: /\.css$/,
                loaders: ["style-loader", "css-loader"]
            },
            {
                test: /\.(jpe?g|png|gif)$/i,
                loader: "file-loader",
                options: {
                    name: '[name].[ext]',
                    outputPath: 'assets/images/'
                    //the images will be emited to dist/assets/images/ folder
                }
            }
        ]
    },
    plugins: []
};