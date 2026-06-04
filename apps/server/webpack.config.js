const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = function (options) {
  const config = { ...options };

  const tsCheckerIdx = config.plugins.findIndex(
    (p) => p.constructor.name === "ForkTsCheckerWebpackPlugin"
  );

  if (tsCheckerIdx >= 0) {
    config.plugins[tsCheckerIdx] = new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
        configOverwrite: {
          compilerOptions: {
            skipLibCheck: true,
            strict: false,
            noImplicitAny: false,
          },
        },
      },
      issue: {
        exclude: [
          { file: "**/*.spec.ts" },
          { file: "**/*.integration.spec.ts" },
          { file: "**/database.service.ts" },
          { file: "**/portal.module.ts" },
          { file: "**/registry.module.ts" },
          { file: "**/registry.module.spec.ts" },
        ],
      },
    });
  }

  return config;
};
