import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { ethers } from "ethers";
import contractABI from "./utils/contractABI.json";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import { networks } from "./utils/networks.js";

// Constants
const TWITTER_HANDLE = "laszlo-ratesic";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// The domain to mint
const tld = ".ganggang";
const CONTRACT_ADDRESS = "0x9daC84A90a925cd3f81A19ecb461728F4047cFD1";

const App = () => {
  // Stateful variable to store network next to others
  const [network, setNetwork] = useState("");
  // State variable storing user wallet
  const [currentAccount, setCurrentAccount] = useState("");
  // State data properties
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  // Stateful var to handle editing
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  // For all mints
  const [mints, setMints] = useState([]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      // request access to account
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      // Should print pubKey after auth
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkWallet = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // Check if we're authorized to access wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });

    // Grab first auth'd account
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found!");
    }

    // Check the user's network chain ID
    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);

    ethereum.on("chainChanged", handleChainChanged);

    // Reload page when network changes
    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  // Switch networks function
  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to Mumbai Testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }], // Check network.js for hexd network ids
        });
      } catch (error) {
        // This error means chain we want hasn't been added to MetaMask
        // Asks user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x13881',
                  chainName: 'Polygon Mumbai Testnet',
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum isn't found then MetaMask is not installed
      alert('MetaMask is not installed. PLease install it to use this app: https://metamask.io/download.html');
    }
  }

  // Mint domain function
  const mintDomain = async () => {
    // Don't run if domain is empty
    if (!domain) { return }
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }
    if (domain.length > 5) {
      alert("Domain must be no more than 5 characters long");
      return;
    }
    // Calculate price based on length of domain (based on contract)
    // 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
    const price =
      domain.length === 3 ? "0.5" : domain.length === 4 ? "0.3" : "0.1";
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas.");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        // Wait for transaction to be mined
        const receipt = await tx.wait();

        // Check if transaction was success
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          // Set the record for the domain
          tx = await contract.setRecord(domain, record);
          await tx.wait();

          console.log(
            "Record set! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          setTimeout(() => {
            fetchMints();
          }, 2000);

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please Try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

        // Get all the domain names from contract
        const names = await contract.getAllNames();

        // Retrieve record and address for each name
        const mintRecords = await Promise.all(names.map(async (name) => {
          const mintRecord = await contract.records(name);
          const owner = await contract.domains(name);
          return {
            id: names.indexOf(name),
            name: name,
            record: mintRecord,
            owner: owner,
          };
        }));

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (network === 'Polygon Mumbai Testnet') {
      fetchMints();
    }
  }, [currentAccount, network]);

  const updateDomain = async () => {
    if (!record || !domain) { return }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);

        fetchMints();
        setRecord();
        setDomain();
      }
    } catch(error) {
      console.log(error);
    }
    setLoading(false);
  }

  // Render function if wallet not connected yet
  const renderNoConnect = () => (
    <div className="connect-wallet-container">
      <img
        src="https://media.giphy.com/media/fVsYnFsaZDXXkIPPYM/giphy.gif"
        alt="gang gang gif"
      />
      <button
        onClick={connectWallet}
        className="cta-button connect-wallet-button"
      >
        Connect Wallet
      </button>
    </div>
  );

  // Domain name/data form
  const renderInputForm = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div className="connect-wallet-container">
          <h2>Please switch to the Polygon Mumbai Testnet</h2>
          <button className="cta-button mint-button" onClick={switchNetwork}>Click here to switch</button>
        </div>
      );
    }
    return (
      <div className="form-container">
        <div className="first-row">
          <input
            type="text"
            value={domain}
            placeholder="domain"
            onChange={(event) => setDomain(event.target.value)}
          />
          <p className="tld"> {tld} </p>
        </div>

        <input
          type="text"
          value={record}
          placeholder="u ganggang or nah?"
          onChange={(event) => setRecord(event.target.value)}
        />

        {/* If the editing variable is true, return the "Set record" and "Cancel" button */}
        {editing ? (
          <div className="button-container">
            <button className="cta-button mint-button" disabled={loading} onClick={updateDomain}>
              Set record
            </button>
            <button className="cta-button mint-button" onClick={() => {setEditing(false)}}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="cta-button mint-button" disabled={loading} onClick={mintDomain}>
            Mint
          </button>
        )}
      </div>
    );
  }

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="mint-container">
          <p className="subtitle">Recently minted domains!</p>
          <div className="mint-list">
            { mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className="mint-row">
                    <a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
                      <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
                    </a>
                    {/* If mint.owner is currentAccount, add edit button */}
                    { mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
                      <button className="edit-button" onClick={() => editRecord(mint.name)}>
                        <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
                      </button>
                      :
                      null
                      }
                    </div>
                <p> {mint.record} </p>
                </div>)
            })}
          </div>
        </div>);
    }
  };

  const editRecord = name => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  }

  useEffect(() => {
    checkWallet();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">🐱‍🐉 GangGang Name Service</p>
              <p className="subtitle">"It's that gang-gang type shi"</p>
            </div>
            <div className="right">
              <img
                alt="Network logo"
                className="logo"
                src={network.includes("Polygon") ? polygonLogo : ethLogo}
              />
              {currentAccount ? (
                <p>
                  {" "}
                  Wallet: {currentAccount.slice(0, 6)}...
                  {currentAccount.slice(-4)}{" "}
                </p>
              ) : (
                <p> Not Connected </p>
              )}
            </div>
          </header>
        </div>

        {!currentAccount && renderNoConnect()}
        {currentAccount && renderInputForm()}
        {mints && renderMints()}

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
