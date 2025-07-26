import {ethers} from "hardhat";

function calculateAdminSlot() {
    const hash = ethers.id("eip1967.proxy.admin");
    const adminSlot = ethers.toBeHex(BigInt(hash)-1n);
    console.log(adminSlot);
}

calculateAdminSlot();