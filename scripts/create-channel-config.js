const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const configRelativePath = process.env.CONFIG_PATH || 'config.json';
const configPath = path.join(__dirname, '..' , configRelativePath);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { listenForIbcChannelEvents } = require('./_events.js');
const { getDispatcher } = require('./_vibc-helpers.js');

// Function to update config.json
function updateConfig(network, channel, cpNetwork, cpChannel) {

  // Update the config object
  config["sendPacket"][`${network}`]["channelId"] = channel;
  config["sendPacket"][`${cpNetwork}`]["channelId"] = cpChannel;

  // Write the updated config back to the file
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Function to run the deploy script and capture output
function createChannelAndCapture() {
  exec(`npx hardhat run scripts/_create-channel.js --network ${config.createChannel.srcChain}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    // Process stdout to find the contract address and network
    const output = stdout.trim();
    const match = output.match(/Channel created: (\S+) with portID (\S+) on network (\S+), Counterparty: (\S+) on network (\S+)/);

    if (match) {
      const channel = match[1];
      const portId = match[2];
      const network = match[3];
      const cpChannel = match[4];
      const cpNetwork = match[5];

      console.log(`
          🎊   Created Channel   🎊
          -----------------------------------------
          🛣️  Channel ID: ${channel}
          🔗 Port ID: ${portId}
          🌍 Network: ${network}
          -----------------------------------------
          🛣️  Counterparty Channel ID: ${cpChannel}
          🪐 Counterparty Network: ${cpNetwork}
          -----------------------------------------\n`
        );

      // Update the config.json file
      updateConfig(network, channel, cpNetwork, cpChannel);
      console.log(`Updated config.json with ${channel} on network ${network} and ${cpChannel} on network ${cpNetwork}`);
    } else {
      console.error("Could not find required parameters in output");
    }
  });
}

async function main() {
  const opDispatcher = await getDispatcher("optimism");
  const baseDispatcher = await getDispatcher("base");
  config["createChannel"]["srcChain"]
  listenForIbcChannelEvents(config["createChannel"]["srcChain"], true , opDispatcher);
  listenForIbcChannelEvents(config["createChannel"]["dstChain"], false, baseDispatcher);

  createChannelAndCapture();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
