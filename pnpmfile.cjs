// pnpmfile.cjs
module.exports = {
    hooks: {
      readPackage(pkg) {
        if (pkg.name === 'fastembed') {
          // ダミーに差し替えて onnxruntime-node を引っこ抜く
          pkg.dependencies['onnxruntime-node'] = '0.0.0-ignored';
        }
        return pkg;
      }
    }
  };