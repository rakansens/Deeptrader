/**
 * pnpmfile.cjs
 * Strip onnxruntime-node from every spot in the dependency graph so its
 * postinstall (and 80 MB download) never runs in CI.
 */
module.exports = {
    hooks: {
      readPackage(pkg) {
        // ❶ Stub out onnxruntime-node in normal dependencies
        if (pkg.dependencies && pkg.dependencies['onnxruntime-node']) {
          pkg.dependencies['onnxruntime-node'] = '0.0.0-ignored';
        }
  
        // ❷ …and in optionalDependencies
        if (
          pkg.optionalDependencies &&
          pkg.optionalDependencies['onnxruntime-node']
        ) {
          pkg.optionalDependencies['onnxruntime-node'] = '0.0.0-ignored';
        }
  
        // ❸ Extra safety: fastembed should never re-add it
        if (pkg.name === 'fastembed') {
          pkg.dependencies = pkg.dependencies || {};
          pkg.dependencies['onnxruntime-node'] = '0.0.0-ignored';
        }
  
        return pkg;
      },
    },
  };