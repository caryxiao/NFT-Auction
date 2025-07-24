const js = require('@eslint/js');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  // 基础推荐配置
  js.configs.recommended,

  // Prettier 配置（必须在最后）
  prettierConfig,

  {
    // 全局配置
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.mocha,

        // Hardhat 全局变量
        hre: 'readonly',
        ethers: 'readonly',
        network: 'readonly',
        artifacts: 'readonly',
        web3: 'readonly',
      },
    },

    plugins: {
      prettier,
    },

    rules: {
      // Prettier 规则
      'prettier/prettier': 'error',

      // ESLint 规则
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
    },
  },

  {
    // Hardhat 配置文件特殊处理
    files: ['hardhat.config.js'],
    languageOptions: {
      globals: {
        task: 'readonly',
      },
    },
  },
  {
    // 允许测试文件使用 console
    files: ['test/**/*.js', 'scripts/**/*.js', 'hardhat.config.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // 忽略文件
    ignores: [
      'node_modules/',
      'artifacts/',
      'cache/',
      'coverage/',
      'typechain/',
      'typechain-types/',
    ],
  },
];
