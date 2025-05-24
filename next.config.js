/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ビルド時の ESLint エラーを無視
    ignoreDuringBuilds: true,
  },

  // 画像最適化を無効化
  images: { unoptimized: true },

  // Next.js 実験的オプション
  experimental: {
    typedRoutes: true,
    // 🚀 MASTRAサポート: esmExternalsを無効化
    esmExternals: false,
  },

  // 🚀 MASTRA対応: サーバー専用パッケージを調整
  serverExternalPackages: [
    // MASTRAコアパッケージは外部化しない（バンドルに含める）
    // "@mastra/*", // この行をコメントアウト
  ],

  webpack(config, { isServer }) {
    // -------- 1) .md ファイルをそのまま取り込む --------
    config.module.rules.unshift({
      test: /\.md$/,
      type: 'asset/source',
    });

    // -------- 1.5) LICENSE など拡張子なしテキストを取り込む --------
    config.module.rules.unshift({
      // libsql/hrana-client が LICENSE を require してくるのでテキストとして扱う
      test: /LICENSE$/,
      type: 'asset/source',
    });

    // -------- 1.6) *.d.ts 型定義ファイルをテキストとして取り込む --------
    config.module.rules.unshift({
      // libsql/core が api.d.ts などを require してくるため、テキストとして扱う
      test: /\.d\.ts$/,
      type: 'asset/source',
    });

    // -------- 1.7) 🚀 ネイティブバイナリファイル(.node)を適切に処理 --------
    config.module.rules.unshift({
      test: /\.node$/,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]',
        outputPath: 'static/native/',
        publicPath: '/_next/static/native/',
      },
    });

    // -------- 1.8) 🚀 libsql関連モジュールをサーバーサイドで外部化 --------
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@libsql/darwin-arm64');
        config.externals.push('@libsql/linux-x64');
        config.externals.push('@libsql/win32-x64');
        config.externals.push('libsql');
      }
    }

    // -------- 2) 🚀 ai/test解決: MASTRAが参照するai/testをfallbackで処理 --------
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'ai/test': require.resolve('./ai-test-fallback.js'), // フォールバックファイルを指定
    };

    // -------- 2.1) ai/testのaliasを設定 --------
    config.resolve.alias = {
      ...config.resolve.alias,
      'ai/test': require.resolve('./ai-test-fallback.js'),
    };

    // -------- 3) サーバーサイド向けの設定 --------
    if (isServer) {
      // Node.js専用モジュールをfallbackで無効化
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };

      // MASTRAパッケージはサーバーサイドでバンドルに含める
      // (externalsに追加しない)
    }

    // -------- 4) クライアントサイド向けの設定 --------
    if (!isServer) {
      // クライアントサイドではNode.jsモジュールを無効化
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        '@mastra/core': false, // クライアントサイドではMASTRA無効化
      };
    }

    return config;
  },
};

module.exports = nextConfig;
