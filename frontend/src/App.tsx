import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import CreateGame from './Screens/CreateGame';
import CurrentOpenGames from './Screens/CurrentOpenGames';
import HomeScreen from './Screens/HomeScreen';
import CommitPhaseScreen from './Screens/CommitPhaseScreen';
import RevealPhaseScreen from './Screens/RevealPhaseScreen';
import { connectWallet, getCurrentWalletConnected } from "./utils/interact";


function App() {

  const navigate = useNavigate();

  const [walletAddress, setWallet] = useState<string>();

  const connectWalletPressed = async () => {
    const walletResponse: any = await connectWallet();
    if (typeof walletResponse.address == 'string') {
      setWallet(walletResponse.address);
    }
  };

  async function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: any) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
        }
        else {
          setWallet("");
          navigate('/');
        }
      });
    };
  }

  async function fetchWallet() {
    const { address } = await getCurrentWalletConnected();
    setWallet(address);
  }

  useEffect(() => {
    fetchWallet();
    addWalletListener();
  }, []);

  return (

    <div className="App">
      <button id="connectwalletbtn" className="btn" onClick={connectWalletPressed}>
        {walletAddress && walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/creategame" element={<CreateGame />} />
        <Route path="/commitphase/:address" element={<CommitPhaseScreen />} />
        <Route path="/opengames" element={<CurrentOpenGames />} />
        <Route path="/revealphase/:address" element={<RevealPhaseScreen />} />
      </Routes>
    </div>
  );
}

export default App;
