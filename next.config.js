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
  },

  webpack(config) {
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

    // -------- 2) .node ネイティブバイナリを読み込む --------
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // -------- 3) Node.js 標準モジュールのポリフィル & 不要ライブラリの無効化 --------
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      path: false,
      fs: false,
    };

    // Edge ランタイムでは使用しない @libsql 系パッケージを空モジュール化して
    // .d.ts や ESM ファイルの解析をスキップさせる
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@libsql/core': false,
      '@libsql/client': false,
      '@libsql/hrana-client': false,
    };

    // -------- 4) バイナリをバンドル対象から除外 --------
    const externals = [
      '@libsql/darwin-arm64/index.node',
      '@libsql/darwin-x86_64/index.node',
      '@libsql/linux-x64-gnu/index.node',
      '@libsql/linux-x64-musl/index.node',
      '@libsql/linux-arm64-gnu/index.node',
      '@libsql/linux-arm64-musl/index.node',
      '@libsql/win32-x64/index.node',
    ];
    config.externals = [...(config.externals || []), ...externals];

    return config;
  },
};

module.exports = nextConfig;
