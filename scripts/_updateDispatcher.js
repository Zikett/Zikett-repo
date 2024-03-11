// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { getDispatcherAddress, getIbcApp } = require("./_vibc-helpers");

async function main() {
    await hre.ethers.getSigners();
    const networkName = hre.network.name;

    // Determine the new dispatcher, based on the network.
    const newDispatcher = getDispatcherAddress(networkName);

    // Get the contract type from the config and get the contract
    const ibcApp = await getIbcApp(networkName, false);

    await ibcApp.updateDispatcher(newDispatcher);
    console.log(`Dispatcher updated to ${newDispatcher}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });