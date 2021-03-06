import express from "express";
import bodyParser from "body-parser";
import Blockchain from "../blockchain";
import P2PServer from "./p2p-server";
import Wallet from "../wallet";
import TransactionPool from "../wallet/transaction-pool";
import Miner from "./miner";

const HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();
const bc = new Blockchain();
const wallet = new Wallet();
const tp = new TransactionPool();
const p2pServer = new P2PServer(bc, tp);
const miner = new Miner(bc, tp, wallet, p2pServer);

app.use(bodyParser.json());

app.get("/blocks", (req, res) => {
	res.json(bc.chain);
});

app.post("/mine", (req, res) => {
	const block = bc.addBlock(req.body.data);

	p2pServer.syncChains();

	res.redirect("/blocks");
});

app.get("/transactions", (req, res) => {
	res.json(tp.transactions);
});

app.post("/transact", (req, res) => {
	const { recipient, amount } = req.body;
	const transaction = wallet.createTransaction(recipient, amount, bc, tp);

	p2pServer.broadcastTransaction(transaction);

	res.redirect("/transactions");
});

app.get("/mine-transactions", (req, res) => {
	const block = miner.mine();
	res.redirect("/blocks");
});

app.get("/public-key", (req, res) => {
	res.json({ publicKey: wallet.publicKey });
});

app.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));
p2pServer.listen();
