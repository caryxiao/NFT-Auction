module.exports = {
  // 基本格式设置
  semi: true, // 语句末尾添加分号
  singleQuote: true, // 使用单引号
  quoteProps: 'as-needed', // 仅在需要时为对象属性添加引号
  trailingComma: 'es5', // 在ES5中有效的尾随逗号

  // 缩进和空格
  tabWidth: 2, // 缩进宽度
  useTabs: false, // 使用空格而不是制表符

  // 行宽和换行
  printWidth: 80, // 行宽限制
  endOfLine: 'lf', // 换行符类型

  // 括号和引号
  bracketSpacing: true, // 对象字面量的括号间添加空格
  bracketSameLine: false, // 多行JSX元素的>单独一行
  arrowParens: 'avoid', // 箭头函数参数括号

  // 文件类型特定设置
  overrides: [
    {
      files: ['*.sol'],
      options: {
        printWidth: 120, // Solidity文件使用更宽的行宽
        tabWidth: 4, // Solidity使用4个空格缩进
      },
    },
    {
      files: ['*.json'],
      options: {
        tabWidth: 2,
        singleQuote: false, // JSON文件使用双引号
      },
    },
    {
      files: ['*.md'],
      options: {
        printWidth: 100, // Markdown文件稍宽一些
        proseWrap: 'preserve', // 保持原有的换行
      },
    },
  ],
};
