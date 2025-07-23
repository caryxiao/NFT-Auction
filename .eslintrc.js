module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true,
  },
  extends: [
    'eslint:recommended',
    'prettier', // 必须放在最后，禁用与Prettier冲突的规则
  ],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  globals: {
    // Hardhat 全局变量
    hre: 'readonly',
    ethers: 'readonly',
    network: 'readonly',
    artifacts: 'readonly',
    web3: 'readonly',
  },
  overrides: [
    {
      files: ['hardhat.config.js'],
      globals: {
        task: 'readonly',
        require: 'readonly',
      },
    },
    {
      files: ['test/**/*.js'],
      globals: {
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
      },
    },
  ],
  rules: {
    // Prettier 规则
    'prettier/prettier': 'error',

    // ESLint 规则
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
  },
  ignorePatterns: ['node_modules/', 'artifacts/', 'cache/', 'coverage/'],
};
