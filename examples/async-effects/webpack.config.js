const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const packageJSON = require('./package.json');

const isDev = true;

const config = {
  entry: packageJSON.entry,
  output: {
    path: path.resolve('./www/'),
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].chunk.js',
  },
  resolve: {
    extensions: ['.jsx', '.js'],
    alias: {
      dva: path.join(__dirname, './src/lib/dva'),
      'dva-core': path.join(__dirname, './src/lib/dva-core'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              sourceType: 'unambiguous',
              presets: [
                ['@babel/preset-react', { development: isDev }],
                ['@babel/preset-env', { useBuiltIns: 'usage', corejs: '3', loose: true }],
              ],
              plugins: [
                [
                  '@babel/plugin-transform-runtime',
                  {
                    // "corejs": false, // default
                    // "helpers": true, // default
                    regenerator: false,
                    useESModules: true,
                  },
                ],
                // ['@babel/plugin-transform-modules-commonjs', { loose: true }],
                // ['@babel/plugin-proposal-class-properties', { loose: true }],
                // ['@babel/plugin-proposal-private-methods', { loose: true }],
              ],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: `index.html`,
      template: `src/layout/index.html`,
      chunks: ['index'],
      chunksSortMode: 'auto',
    }),
  ],
  optimization: {
    minimize: true,
  },
  externals: {},
};

if (isDev) {
  config.optimization.minimize = false;
  config.devtool = 'source-map'; // https://webpack.js.org/configuration/devtool/#devtool
  config.devServer = {
    hot: true,
    port: '8080',
    host: '0.0.0.0',
    allowedHosts: ['all'],
  };
  config.mode = 'development';
  config.plugins.push(
    new webpack.DefinePlugin({
      ENV: '"development"',
    }),
  );
} else {
  config.mode = 'production';
  config.plugins.push(
    new webpack.DefinePlugin({
      ENV: '"production"',
    }),
  );
}

module.exports = config;
