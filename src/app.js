require('dotenv').config({ path: '../.env' });
const { MongoClient } = require("mongodb");
const axios = require("axios");
const symbolMap = require("./symbol-map");
const { sha256 } = require("js-sha256");
const { DB_USERNAME, DB_PASSWORD } = process.env;

// Connection URL
const url =
  `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.d9tv0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(url);

// Database Name
const dbName = "crypto-price-history";

// Interval (15 minutes)
const time = 60 * 1000 * 1;

const insertStuff = async (collection, stuff) =>
  await collection.insertMany(stuff);

const getPriceData = async() =>  {
  const { data } = await axios(
    "https://api.coingecko.com/api/v3/simple/price?ids=binance-peg-cardano%2Cbitcoin%2Cchiliz%2Cbinance-peg-dogecoin%2Cbittorrent-2%2Ctether%2Cmatic-network%2Cbinance-peg-polkadot%2Cdodo%2Cbinance-peg-litecoin%2Cethereum%2Czcash%2Cdash%2Cswipe%2Cchainlink%2Ctezos%2Cvechain%2Cbinance-peg-xrp%2Cbinancecoin%2Caave%2Cfio-protocol%2Ctron%2Cwaves%2Cwazirx%2Cbinance-peg-eos%2Cethereum-classic%2Cshiba-inu%2Cbinance-usd%2Csolana%2Cunicorn-token%2Cklay-token%2Cinternet-computer&vs_currencies=sek%2Cusd&include_last_updated_at=true"
  );
  const result = Object.keys(data).map((key) => {
    const priceData = {
      id: key,
      symbol: symbolMap[key],
      last_updated_at: data[key].last_updated_at,
      sek: data[key].sek,
      usd: data[key].usd,
      date: new Date(data[key].last_updated_at * 1000).toLocaleString(),
    };
    const hash = sha256(JSON.stringify(priceData));
    priceData.hash = hash;
    return priceData;
  });
  return result;
}
async function main() {
  // Use connect method to connect to the server
  setInterval(async () => {
    try {
      await client.connect();
      const db = client.db(dbName);
      const prices = await getPriceData();
      const collection = db.collection("prices");
      await insertStuff(collection, prices);
      client.close();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }, time);
}

main().then(console.log).catch(console.error);

