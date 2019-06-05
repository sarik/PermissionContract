import React, { Component, Fragment } from "react";
import ReactDOM from "react-dom";
import Web3 from "web3";
import TruffleContract from "truffle-contract";
import Content from "./Content";
import "bootstrap/dist/css/bootstrap.css";
import HDWalletProvider from "truffle-hdwallet-provider";
import Tx from "ethereumjs-tx";
import blockChainConnector from "./BlockChainConnector";

class App extends React.Component {
  ContractObject = "";

  state = {
    name: "initial"
  };

  constructor(props) {
    super(props);

    if (typeof web3 !== "undefined" && web3.currentProvider.isMetaMask) {
      this.web3 = new Web3(web3.currentProvider);
    }
  }

  componentDidMount() {
    this.web3.eth.getAccounts((err, accounts) => {
      console.log("all accounts", accounts);
    });

    let testABI = [
      {
        "constant": false,
        "inputs": [
          {
            "name": "sig",
            "type": "bytes"
          },
          {
            "name": "user",
            "type": "address"
          },
          {
            "name": "fullPermissionObj",
            "type": "string"
          }
        ],
        "name": "registerUserPermission",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "version",
            "type": "string"
          }
        ],
        "name": "changeLatestVersion",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "addr",
            "type": "address"
          }
        ],
        "name": "returnFullPermissionString",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_user",
            "type": "address"
          }
        ],
        "name": "getPermissionObj",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_versionName",
            "type": "string"
          },
          {
            "name": "_versionObj",
            "type": "string"
          }
        ],
        "name": "addNewVersion",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "latestVersion",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "returnFullPermissionString",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "addAdmins",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      }
    ];
    this.target = "0x56444a8f39aaac27dc8088a75d3284e2a091d2a2";
    this.ContractObject = new this.web3.eth.Contract(testABI, this.target);
    window.cont = this.ContractObject;
    window.web4 = this.web3;
  }

  submitHandler = e => {
    e.preventDefault();
    this.setState({ name: "loading" });
    let msg = e.target.name.value;

    this.web3.eth.getAccounts((err, accounts) => {
      const user = accounts[0];
      const payer = accounts[0];

      console.log("user is ", user);
      let nonce, data, hash, sig;
      const target = this.ContractObject.options.address;
      console.log();

      this.web3.eth.personal
        .sign(msg, user)

        .then(sigValue => {
          sig = sigValue;
          console.log("sig is", sig);
          this.storeUsersPermission(msg, sig, user);
        });
    });
  };

  storeUsersPermission(msg, sig, user) {
    const payerWallet = "0x24096E225d57965239017Ede2186282dE3FaAb68";
    const payerPK = Buffer.from(
      "F64BBCFA21D94ABE1AA66663B977C152256160CCE4B72088C2E15ED045D91618",
      "hex"
    );

    const INFURA_URL =
      "https://rinkeby.infura.io/v3/1c538f09b8874d259eb3b38b91147863";
    const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));

    web3.eth.getTransactionCount(payerWallet, (err, txCount) => {
      const txObject = {
        nonce: web3.utils.toHex(txCount),
        gasLimit: web3.utils.toHex(1600000), // Raise the gas limit to a much higher amount
        gasPrice: web3.utils.toHex(web3.utils.toWei("60", "gwei")),
        to: this.target,
        data: this.ContractObject.methods
          .registerUserPermission(
            // Hashes the given message to be passed web3.eth.accounts.recover() function.
            // The data will be UTF-8 HEX decoded and enveloped as follows:
            // "\x19Ethereum Signed Message:\n" + message.length + message and hashed using keccak256.
            sig,
            user,
            msg
          )
          .encodeABI()
      };

      const tx = new Tx(txObject);
      tx.sign(payerPK);

      const serializedTx = tx.serialize();
      const raw = "0x" + serializedTx.toString("hex");

      this.web3.eth
        .sendSignedTransaction(raw)
        .once("transactionHash", hash => {
          console.log("Trx Hash::" + hash);
          this.setState({ name: "Trx Hash::" + hash });
        })
        .once("receipt", receipt => {
          console.log("Trx receipt::" + receipt);
          this.setState({ name: "Trx receipt::" + receipt });
        })
        .on("confirmation", (confNumber, receipt) => {
          console.log("ConfirmationNo::" + confNumber + " Receipt::" + receipt);
          this.setState({
            name: "ConfirmationNo::" + confNumber + " Receipt::" + receipt
          });
        })
        .on("error", error => {
          this.setState({ name: "Error::" + error });
        })
        .then(receipt => {
          // will be fired once the receipt is mined
          console.log("Receipt mined::" + receipt);
          console.log(receipt);
          this.setState({ name: "Receipt mined::" + receipt });
        });
    });
  }

  render() {
    return (
      <div>
        <form onSubmit={this.submitHandler}>
          <textarea style={{ height: "400px", width: "400px" }} name="name" />
          <button>Submit</button>
        </form>
        {this.state.name}
      </div>
    );
  }
}

ReactDOM.render(<App name="sarik" />, document.querySelector("#root"));
