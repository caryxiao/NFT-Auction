#!/bin/bash

# 强制重新部署脚本
echo "🧹 开始清理所有缓存和部署状态..."

# 1. 清理编译缓存
echo "1. 清理 Hardhat 编译缓存..."
npx hardhat clean

# 2. 删除 OpenZeppelin 缓存
echo "2. 删除 OpenZeppelin 缓存..."
rm -rf .openzeppelin/

# 3. 删除 hardhat-deploy 部署记录
echo "3. 删除 hardhat-deploy 部署记录..."
rm -rf deployments/

# 4. 删除 TypeChain 生成文件
echo "4. 删除 TypeChain 生成文件..."
rm -rf typechain-types/

# 5. 重新编译
echo "5. 重新编译合约..."
npx hardhat compile

echo "✅ 清理完成！现在可以进行全新部署："
echo ""
echo "本地测试网络:"
echo "  npx hardhat deploy"
echo ""
echo "Sepolia 测试网:"
echo "  npx hardhat deploy --network sepolia"
echo ""
echo "仅部署特定标签:"
echo "  npx hardhat deploy --tags ddnft --network sepolia"
echo "  npx hardhat deploy --tags ddnftv2 --network sepolia"
echo ""