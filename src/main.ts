#!/usr/bin/env node
import 'dotenv/config'
import getNetworkCoinConfig from "./flow-frontend/src/config/coinConfig.js";
import netConfApt from "./flow-frontend/src/config/configuration.aptos.js";
import TelegramBot from 'node-telegram-bot-api';
import { AptosClient, AptosAccount, Types } from 'aptos';
import retry from 'async-retry';
import fetch from "node-fetch";

const MIN_DEPOSIT_BALANCE = "10000"; // 0.0001 APT(decimals=8)
const MONITOR_INTERVAL = 2 * 60 * 60 * 1000; // 2H, configurable
const MAX_RETRY_ATTEMPTS = 18;
const MIN_TIMEOUT = 10000;
const MAX_TIMEOUT = 100000;

const coinConfigs = getNetworkCoinConfig(process.env.COIN_NETWORK!);
const NODE_URL = netConfApt.fullNodeUrl || "https://fullnode.mainnet.aptoslabs.com/v1";
const chatId = '@X7TGNycJepVlODI12233';

interface StreamReportMsg {
  status: boolean;
  network: string;
  streamId: string;
  streamName: string;
  remark: string;
  sender: string;
  senderBalance: string;
}

// Configure Aptos client / account and Telegram bot
const aptosClient = new AptosClient(NODE_URL);
const pkStr = process.env.APTOS_API_KEY!.toString()
  .replace("0x", "")
  .replace("0X", "")
  .trim();
const pkHex = Uint8Array.from(Buffer.from(pkStr, 'hex'));
const account = new AptosAccount(pkHex);
const receiver = process.env.RECEIVER_ADD!;

const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!);

console.log(netConfApt);

async function main() {
  console.log(`=============== Retrieving balance of receiver: ${receiver}`);
  let resources2 = await aptosClient.getAccountResources(receiver);
  let accountResource2 = resources2.find((r:any) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
  let balance2 = (accountResource2?.data as { coin: { value: string } }).coin.value;
  console.log(`=============== receiver balance: ${balance2}`);

  while (true) {  
    try {
      console.log(`=============== Retrieving balance of sender: ${account.address()}`);
      let resources = await aptosClient.getAccountResources(account.address());
      let accountResource = resources.find((r:any) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
      let balance = (accountResource?.data as { coin: { value: string } }).coin.value;
      console.log(`=============== sender balance: ${balance}`);
  
      const now = new Date();
      const year = now.getFullYear(); // Gets the current year (e.g., 2023)
      const month = now.getMonth() + 1; // Gets the current month (0-11, +1 to make it 1-12)
      const day = now.getDate(); // Gets the current day of the month (1-31)
      const hour = now.getHours(); // Gets the current hour (0-23)
      const strName = `${year}-${month}-${day}:${hour}`;
      const tsSecond = Math.floor(now.getTime() / 1000);
      const remark = `${tsSecond}rm`; 
      console.log(`Start creating stream: ${strName}-${remark}`);

      // Create a new stream
      let payload: Types.TransactionPayload_EntryFunctionPayload = {
        type: "entry_function_payload",
        function: `${netConfApt.contract}::stream::create`,
        type_arguments: ["0x1::aptos_coin::AptosCoin"],
        arguments: [
          strName, 
          remark,
          receiver, MIN_DEPOSIT_BALANCE,
          tsSecond+60, tsSecond+61, 
          "1", true, true, false],
      };

      const txRe = await retry(async () => {
        let txnRequest = await aptosClient.generateTransaction(account.address(), payload);
        let signedTxn = await aptosClient.signTransaction(account, txnRequest);
        let transactionRes = await aptosClient.submitTransaction(signedTxn);
        const txRe = await aptosClient.waitForTransactionWithResult(transactionRes.hash, {checkSuccess: true});
        // txRe.events.filter((x:any) => x.type.indexOf("::StreamEvent") !== -1)
        return txRe;
      }, {
        retries: MAX_RETRY_ATTEMPTS,
        onRetry: (error: Error, attempt:number) => {
          console.error(`Stream creation failed on attempt ${attempt}:`, error);
          telegramBot.sendMessage(chatId, `Stream creation failed: ${strName} \nSender: ${account.address()} \nAttempt: ${attempt}\nError: ${error.message}`);
        },
        minTimeout: MIN_TIMEOUT,
        maxTimeout: MAX_TIMEOUT
      });      
      console.log(`Stream created: ${txRe.hash}`);

      // Query the stream from the backend every 10 seconds
      await sleep(MIN_TIMEOUT);
      const streamInfo = await retry(
        async () => {
           const streamInfo = await queryStream();
           if(streamInfo[0].remark === remark)
             return streamInfo;
          else
            throw new Error(`${strName}'s remark ${remark} mismatches with stream: \n${JSON.stringify(streamInfo[0], null, 2)}`);
        },
        { 
          retries: MAX_RETRY_ATTEMPTS,
          minTimeout: MIN_TIMEOUT,
          maxTimeout: MAX_TIMEOUT,
          onRetry: (error: Error, attempt:number) => {
            console.error(`Stream query failed on attempt ${attempt}:`, error);
            telegramBot.sendMessage(chatId, `Stream query failed: ${strName} \nAttempt: ${attempt}\nError: ${error.message}`);
          }  
        }
      );

      if(streamInfo[0].remark === remark) {
        const message: StreamReportMsg = {
          status: true,
          network: process.env.REACT_APP_CURRENT_NETWORK!,
          streamName: streamInfo[0].name,
          streamId: streamInfo[0].id,
          remark: streamInfo[0].remark,
          sender: streamInfo[0].sender,
          senderBalance: `${Number(balance) / Number(10 ** 8)} APT`,
        };
        await telegramBot.sendMessage(chatId, `Stream received correctly: ${strName} \n${JSON.stringify(message, null, 2)}`);
      }

      await sleep(MONITOR_INTERVAL);
    } catch (error: any) {
      // Handle errors and ensure fault tolerance
      console.error('Error:', error);
      telegramBot.sendMessage(chatId, `Stream monitor encounter addictional errors.\nError: ${error}`);
    }
  }

}

async function queryStream(): Promise<any[]> {
  const body = {
    where: {
      sender: account.address().toString,
    },
    orderBy: {
      create_at: 'desc',
    },
    pageNumber: 0,
    pageSize: 1,
  };

  const queryURL = `${netConfApt.backend}/streams/1`;
  console.log(`querying`, queryURL)
  const str:any = await fetch(queryURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    redirect: "follow",
  }).then(data => data.json());
  console.log("stream queried", str);
  return str.data;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

main()
