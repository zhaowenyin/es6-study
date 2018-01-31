const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin'); //生成html模板
const ExtractTextPlugin = require('extract-text-webpack-plugin'); //提出css
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin') // 友好提示
const glob = require('glob'); //循环所有文件
const env = process.env.NODE_ENV //当前环境

function resolve(dir) {
  return path.join(__dirname, '/', dir)
}
//__dirname目录地址 __filename文件地址

const config = {
  entry: {},
  output: {
    path: `${__dirname}/dist`,
    filename: '[name]-[hash].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
        },
        include: resolve('src')
      },
      {
        test: /\.css$/,
        use: env === 'production' ?
          ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader']
          }) :
          ['style-loader?sourceMap', 'css-loader?sourceMap', 'postcss-loader?sourceMap']
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1000,
          name: 'img/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'fonts/[name].[hash:7].[ext]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json'], //自动解析后缀
    alias: {
      '@': resolve('src'),
    }
  },
  plugins: []
}


function getEntry(globPath, pathDir) {
  var files = glob.sync(globPath);
  var entries = {},
    entry, dirname, basename, extname, chunks;


  files.forEach((entry) => {
    dirname = path.dirname(entry);
    basename = /apps\/(.*)\/index\.js/.exec(entry)[1];
    chunks = env === 'production' ? ['vendor', basename] : [basename];
    entries[basename] = entry;
    const plug = new HtmlWebpackPlugin({
      filename: `${__dirname}/dist/${basename}.html`,
      chunks,
      template: `${dirname}/index.html`,
      inject: true
    });
    config.plugins.push(plug);
  });
  return entries;
}
const newEntries = getEntry('./src/apps/*/index.js');

if (env === 'production') { // 生产环境
  // config.entry = {
  //     vendor: ['vue', 'vue-router', 'vuex'] // 公用方法
  // };
  config.plugins = config.plugins.concat([
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor']
    }),
    //new webpack.optimize.UglifyJsPlugin(), //压缩JS代码,开发中使用它不能sourcemap了
    new ExtractTextPlugin({
      filename: (getPath) => {
        return getPath('[name].[hash].css');
      },
    }) //分离CSS
  ]);
} else { //开发环境
  config.devtool = 'source-map';
  config.devServer = {
    //contentBase: `${__dirname}/dist`, // 不怎么清楚
    historyApiFallback: true, //不跳转
    inline: true, //实时刷新
    hot: true, //热加载
    port: 8080, //端口
  };
  config.plugins = config.plugins.concat([
    new webpack.HotModuleReplacementPlugin(), //热加载插件
    new webpack.NoEmitOnErrorsPlugin(),  // webpack 进程遇到错误代码将不会退出
    new FriendlyErrorsPlugin() // 友好错误提示
  ]);
}

config.entry = Object.assign({}, config.entry, newEntries);

module.exports = config;
