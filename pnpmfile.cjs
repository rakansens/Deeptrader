// 🔸 pnpmfile.js  ← ルートに新規作成
module.exports = {
    hooks: {
      readPackage(pkg) {
        console.log('HOOK ACTIVE', pkg.name);
        // ① 普通の dependencies から除去／ダミー化
        if (pkg.dependencies && pkg.dependencies['onnxruntime-node']) {
          pkg.dependencies['onnxruntime-node'] = '0.0.0-ignored';
        }
  
        // ② optionalDependencies も同様に
        if (
          pkg.optionalDependencies &&
          pkg.optionalDependencies['onnxruntime-node']
        ) {
          pkg.optionalDependencies['onnxruntime-node'] = '0.0.0-ignored';
        }
  
        // ③ fastembed が再度追加しようとしてもブロック
        if (pkg.name === 'fastembed') {
          pkg.dependencies = pkg.dependencies || {};
          pkg.dependencies['onnxruntime-node'] = '0.0.0-ignored';
        }
  
        return pkg;
      },
    },
  };
