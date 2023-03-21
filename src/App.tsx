import React, {useEffect, useState} from 'react';
import { ethers } from 'ethers';
import { sequence } from '0xsequence';

import 'animate.css';
import './App.css'

import EmojiPicker from 'emoji-picker-react';

function Login(props: any) {
  return(
  <>
    <div className='center'>
      <button className='sequence-button' onClick={props.connectWallet}>Connect</button>
    </div>
  </>
  )
}

function Signature(props: any) {
  return(
  <>
    <button className='sequence-button' onClick={() => {console.log('test'); props.authorizeSessionKey()}}>
      Authorize Session Key
    </button>
  </>
  )
}

function Showcase(props: any) {
  return(
  <> 
  <br/>
  <br/>
  <br/>
  <br/>
  <br/>
  <br/>
  <br/>
  <div className='showcase'>
    {props.emojis}
    <img src={props.nftImageSrc} />
    <p>{props.signature}</p>
      <div className='emoji-picker'>
        <EmojiPicker onEmojiClick={async (emoji) => {
          console.log(emoji.emoji)
          props.setEmojis((prev: any) => [...prev, <p className='emoji-fade animate__slower animate__animated animate__fadeOutUp'>{emoji.emoji}</p>])
          await props.express(emoji.emoji)
        }}/>
      </div>
    </div> 
  </>
  )
}

function App() {
  const [appState, setAppState] = useState<number>(0);
  const [wallet, setWallet] = useState<any>(null);
  const [sessionPrivateKey, setSessionPrivateKey] = useState<any>(null);
  const [sessionWallet, setSessionWallet] = useState<any>(null);
  const [sessionAddress, setSessionAddress] = useState<any>(null);
  const [authorizationSignature, setAuthorizationSignature] = useState<any>(null);
  const [isSessionKeyAuthorized, setIsSessionKeyAuthorized] = useState<any>(false);
  const [actionNonce, setActionNonce] = useState<any>(0)
  const [signature, setSignature] = useState<any>('')

  const [nftImageSrc, setNftImageSrc] = useState<string>('')
  const [emojis, setEmojis] = useState<any>([])

  const download = async () => {
    const res = await fetch('https://metadata.sequence.app/tokens/polygon/0x2953399124f0cbb46d2cbacd8a89cf0599974963/12009058710472782335826669257788533186281607146119802832846727407861399289966')
    const nftMetaData = await res.json()
    console.log(nftMetaData)
    setNftImageSrc(nftMetaData[0].image)
  }

  const connectWallet = async () => {
    try {
      const wallet = await sequence.initWallet('polygon');
      await wallet.connect({
        app: 'EMOJIS',
        authorize: true,
      });
      setWallet(wallet);
      setAppState(1)
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const generateOrLoadSessionKey = () => {
    let storedKey = localStorage.getItem('sessionPrivateKey');
    if (storedKey) {
      setSessionPrivateKey(storedKey);
    } else {
      const sessionPrivateKey = ethers.utils.randomBytes(32);
      localStorage.setItem('sessionPrivateKey', ethers.utils.hexlify(sessionPrivateKey));
      setSessionPrivateKey(sessionPrivateKey);
    }
  };

  const authorizeSessionKey = async () => {
    console.log(wallet)
    console.log(sessionAddress)
    if (wallet && sessionAddress) {
      const message = `Authorize session key: ${sessionAddress}`;
      const signer = await wallet.getSigner();
      const signature = await signer.signMessage(message);
      setAuthorizationSignature(signature);
      setAppState(2)
    }
  };

  useEffect(() => {
    const initSessionWallet = async () => {
      if (wallet && sessionPrivateKey) {
        const newSessionWallet = new ethers.Wallet(ethers.utils.arrayify(sessionPrivateKey));
        setSessionWallet(newSessionWallet);
        const newSessionAddress = await newSessionWallet.getAddress();
        setSessionAddress(newSessionAddress);
      }
    };
    generateOrLoadSessionKey();
    initSessionWallet();
  }, [wallet, sessionAddress, sessionPrivateKey]);

  const express = async (emoji: any) => {
    const message = `Play ${emoji}. Nonce: ${actionNonce}`;
    const sessionSignature = await sessionWallet.signMessage(message);
    const recoveredSessionAddress = ethers.utils.verifyMessage(message, sessionSignature);
    if (recoveredSessionAddress === sessionAddress) {
      console.log('true')
      setSignature(sessionSignature)
    }
  }
  const Compass = (appState: number) => {
    let navigator;
    switch(appState){
      case 0:
        navigator = <Login 
                          connectWallet={connectWallet} 
                          setAppState={setAppState}
                    />
        break;
      case 1:
        navigator = <Signature 
                              authorizeSessionKey={authorizeSessionKey} 
                    />
        break;
      case 2:
        navigator = <Showcase 
                              express={express} 
                              nftImageSrc={nftImageSrc} 
                              emojis={emojis}
                              setEmojis={setEmojis}
                              signature={signature}
                    />
        break;
    }
    return navigator;
  }
  useEffect(() => {
    download()
  })

  return (
    <div className="App">
      <br/>
      <br/>
      <p className='title' style={{textAlign: 'center'}}>NFT showcase</p>
      <div className="container">
        <div className='center' style={{textAlign: 'center'}}>
          {Compass(appState)}
        </div>
      </div>
      <br/>
    </div>
  );
}

export default App;
 