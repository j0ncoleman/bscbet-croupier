require("dotenv").config();
const ethers = require("ethers");
const abi = require("./abis/bsccoinflip");

const { JsonRpcProvider } = require("@ethersproject/providers");
const url = process.env.BSCTestnetJSONRPC;
const provider = new JsonRpcProvider(url);

const bscFGameAddress = process.env.BSCFGAMEADDRESS;
const wallet = new ethers.Wallet(process.env.SECRETKEY);
const account = wallet.connect(provider);
const bscFGame = new ethers.Contract(bscFGameAddress, abi, account);
var completingGames = false;

const http = require("http");

const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

const shouldCompleteGames = async () => {
  const numGames = (await bscFGame._globalQueueSize()).toString();

  return numGames > 0;
};

const completeGames = async () => {
  completingGames = true;
  try {
    const gasEstimate = await bscFGame.estimateGas.forceCompleteQueuedGames(0);
    var options = {
      gasLimit: gasEstimate.mul(18).div(10),
    };
    const transaction = await bscFGame.forceCompleteQueuedGames(
      Math.floor(Math.random() * 100),
      options
    );
    const receipt = await transaction.wait();
    console.log(JSON.stringify(receipt));
  } catch (err) {
    console.log(err);
  }
  completingGames = false;
};

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, async () => {
  setInterval(async () => {
    if (!completingGames) {
      try {
        console.log("Checking for games");
        var complete = await shaouldCompleteGames();
        if (complete) {
          console.log("Completing games");
          completeGames();
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log(
        "Won't complete games while waiting on a transaction to complete"
      );
    }
  }, process.env.GameWaitTime);
});
