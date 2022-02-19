import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";

// Constants
const TWITTER_HANDLE = "laszlo-ratesic";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
// The domain to mint
const tld = '.ganggang';
const CONTRACT_ADDRESS = '0x7BafEe73F362C960995eC56e6c81510134A508b2';


const App = () => {
	// State variable storing user wallet
	const [currentAccount, setCurrentAccount] = useState('');
  // State data properties
  const [domain, setDomain] = useState('');
  const [record, setRecord] = useState('');

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask -> https://metamask.io/");
				return;
			}

			// request access to account
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });

			// Should print pubKey after auth
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	}

  const checkWallet = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

  // Check if we're authorized to access wallet
  const accounts = await ethereum.request({ method: 'eth_accounts' });

  // Grab first auth'd account
  if (accounts.length !== 0) {
	  const account = accounts[0];
	  console.log('Found an authorized account:', account);
	  setCurrentAccount(account);
  } else {
	  console.log('No authorized account found!');
  }
};

  // Render function if wallet not connected yet
  const renderNoConnect = () => (
    <div className="connect-wallet-container">
      <img
        src="https://media.giphy.com/media/fVsYnFsaZDXXkIPPYM/giphy.gif"
        alt="gang gang gif"
      />
      <button onClick={connectWallet} className="cta-button connect-wallet-button">
        Connect Wallet
      </button>
    </div>
  );

// Domain name/data form
const renderInputForm = () => {
  return (
    <div className="form-container">
      <div className="first-row">
        <input
          type="text"
          value={domain}
          placeholder='domain'
          onChange={event => setDomain(event.target.value)}
          />
          <p className="tld"> {tld} </p>
      </div>

      <input
        type="text"
        value={record}
        placeholder="what ur gang gang shit?"
        onChange={event => setRecord(event.target.value)}
      />

      <div className="button-container">
        <button className="cta-button mint-button" disabled={null} onClick={null}>
          Mint
        </button>
        <button className="cta-button mint-button" disabled={null} onClick={null}>
          Set data
        </button>
      </div>

    </div>
  );
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
          </header>
        </div>

        {!currentAccount && renderNoConnect()}
        {currentAccount && renderInputForm()}

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
