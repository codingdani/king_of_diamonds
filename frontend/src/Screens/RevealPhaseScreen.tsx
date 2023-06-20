import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom';
import {
    checkIfGameStarted,
    checkIfOwnerHasWithdrawn,
    checkIfPlayerHasRevealed,
    checkIfWinnerHasWithdrawn,
    claimServiceFee,
    claimWinnings,
    createGameContractInstance,
    deactivateGame,
    getResults,
    Result,
    getRevealedPlayerCount,
    revealGuess,
    startGame
} from '../utils/interact';
import loading from "../gif/loading-spinner.gif";

function RevealPhaseScreen() {

    const { state } = useLocation();
    const { gameDetails, gameAddress, playerCount, walletAddress, isMaster } = state;

    const [guess, setGuess] = useState<number>(0);
    const [salt, setSalt] = useState<number>(0);
    const [hasRevealed, setHasRevealed] = useState<boolean>(false);
    const [newReveal, setNewReveal] = useState<boolean>(false);
    const [revealCount, setRevealCount] = useState<number>(0);
    const [allRevealed, setAllRevealed] = useState<boolean>(false);
    const [gameHasStarted, setGameHasStarted] = useState<boolean>(false);
    const [winnerAddress, setWinnerAddress] = useState<string>("");
    const [isWinner, setIsWinner] = useState<boolean>(false);
    const [scoreboard, setScoreboard] = useState<Result[]>([]);
    const [serviceFeeWithdrawn, setServiceFeeWithdrawn] = useState<boolean>(false);
    const [winnerHasWithdrawn, setWinnerHasWithdrawn] = useState<boolean>(false);
    const [gameMasterNotResponding, setGameMasterNotResponding] = useState<boolean>(false);

    useEffect(() => {
        scRevealMadeEventListener(gameAddress);
        scWinnerDeclaredEventListener(gameAddress);
        scWinnerHasWithdrawnPriceEventListener(gameAddress);
        scServiceFeeHasBeenWithdrawnEventListener(gameAddress);
        const fetchCurrentRevealCount = async () => {
            const count = await getRevealedPlayerCount(gameAddress);
            setRevealCount(count);
        }
        const fetchIfHasRevealed = async () => {
            const revealed = await checkIfPlayerHasRevealed(walletAddress, gameAddress);
            setHasRevealed(revealed);
        }
        const fetchIfGameHasStarted = async () => {
            const started = await checkIfGameStarted(gameAddress);
            setGameHasStarted(started);
        }
        const fetchIfWinnerHasWithdrawn = async () => {
            const withdrawn = await checkIfWinnerHasWithdrawn(gameAddress);
            setWinnerHasWithdrawn(withdrawn);
        }
        const fetchIfOwnerHasWithdrawn = async () => {
            const withdrawn = await checkIfOwnerHasWithdrawn(gameAddress);
            setServiceFeeWithdrawn(withdrawn);
        }
        fetchCurrentRevealCount();
        fetchIfHasRevealed();
        fetchIfGameHasStarted();
        fetchIfWinnerHasWithdrawn();
        fetchIfOwnerHasWithdrawn();
    }, []);

    useEffect(() => {
        if (revealCount == playerCount) setAllRevealed(true);
    }, [revealCount])

    useEffect(() => {
        if (gameHasStarted) {
            fetchWinnerAddress(gameAddress);
            fetchResults(gameAddress);
        }
    }, [gameHasStarted])

    useEffect(() => {
        if (winnerAddress.trim().toLowerCase() == walletAddress.trim().toLowerCase()) setIsWinner(true);
    }, [winnerAddress])

    function scRevealMadeEventListener(address: string) {
        const contract = createGameContractInstance(address);
        contract.events.RevealMade({}, (error: Error) => {
            if (error) console.log(error.message);
            else {
                setNewReveal(true);
                let count = revealCount
                setRevealCount(count++);
                setTimeout(() => {
                    setNewReveal(false);
                }, 5000);
            };
        });
    }

    function scWinnerDeclaredEventListener(address: string) {
        const contract = createGameContractInstance(address);
        contract.events.WinnerDeclared({}, (error: Error) => {
            if (error) console.log("Error: ", error.message)
            else {
                console.log("winner declared");
                setGameHasStarted(true);
                fetchWinnerAddress(address);
            }
        })
    }

    function scWinnerHasWithdrawnPriceEventListener(address: string) {
        const contract = createGameContractInstance(address);
        contract.events.WinnerWithdrawn({}, (error: Error) => {
            if (error) console.log("Error: ", error.message)
            else {
                console.log("winner has withdrawn");
                setWinnerHasWithdrawn(true);
            }
        })
    }

    function scServiceFeeHasBeenWithdrawnEventListener(address: string) {
        const contract = createGameContractInstance(address);
        contract.events.OwnerWithdrawn({}, (error: Error) => {
            if (error) console.log("Error: ", error.message);
            else {
                console.log("service fee has been withdrawn");
                setServiceFeeWithdrawn(true);
            }
        })
    }

    const changeGuess = ({ target }: any) => {
        setGuess(target.value);
    }
    const changeSalt = ({ target }: any) => {
        setSalt(target.value);
    }

    const submitGuess = () => {
        if (guess > Number(gameDetails?.maxGuess) || guess < Number(gameDetails?.minGuess)) {
            console.log("The Guess is invalid. Check your Input.");
            return {
                status: "Invalid Guess."
            };
        } else if (guess && salt && walletAddress.length > 0) {
            revealGuess(gameAddress, walletAddress, guess, salt).then((res) => {
                if (res.confirmed == true) setHasRevealed(true);
            });
            return {
                status: "Transaction went through."
            };
        } else {
            console.log("something's not right");
            return {
                status: "There was a mistake",
            };
        };
    }

    const startLastPhase = () => {
        startGame(gameAddress, walletAddress);
    }

    const fetchWinnerAddress = async (address: string) => {
        const contract = createGameContractInstance(address);
        const winner = await contract.methods.winner().call();
        setWinnerAddress(winner);
    }

    const fetchResults = async (address: string) => {
        const results = await getResults(address);
        setScoreboard(results);
    }

    const getWinnings = async () => {
        claimWinnings(gameAddress, walletAddress).then((res) => {
            if (res.confirmed == true) setWinnerHasWithdrawn(true);
        });
    }

    const getServiceFee = async () => {
        claimServiceFee(gameAddress, walletAddress).then((res) => {
            if (res.confirmed == true) setServiceFeeWithdrawn(true);
        })
    }

    const deactivateTheGame = async () => {
        if (serviceFeeWithdrawn && winnerHasWithdrawn) deactivateGame(walletAddress, gameAddress);
    }

    return (
        <>
            <Link to={`/commitphase/${gameAddress}`} state={{ from: gameAddress }} id="backbtn" className="btn">
                back
            </Link>
            {newReveal ?
                <>
                    <p>a player has revealed his guess</p>
                    <br />
                </>
                : null}
            {isMaster && serviceFeeWithdrawn && winnerHasWithdrawn ? <button className="btn" onClick={deactivateTheGame}>deactivate game</button> : null}
            <section className="flex evenly width100 height100">
                <div className="textfield bordergold glowy">
                    <h3>reveal phase</h3>
                    <p className="secondarytext">{revealCount} / {playerCount} revealed</p>
                    {hasRevealed ?
                        <>
                            {gameHasStarted ?
                                <>
                                    <p className="padding20">the game is over</p>
                                    {isWinner ?
                                        <>
                                            <h3 className="greentext">you won !</h3>
                                            {winnerHasWithdrawn ?
                                                <p>the price has been withdrawn.</p>
                                                :
                                                <button className="btn" onClick={getWinnings}>claim your price</button>
                                            }
                                        </>
                                        :
                                        <>
                                            <h3 className="primarytext">you lost.</h3>
                                            <p>the <span className="secondarytext">winner</span> is {winnerAddress}</p>
                                        </>
                                    }
                                    <br />
                                    <h4>Scoreboard:</h4>
                                    <div id="scoreboardhead">
                                        <span>address</span>
                                        <span className="primarytext">guess</span>
                                    </div>
                                    {scoreboard ? (
                                        scoreboard.map((score) => (
                                            <section id="scoreboard">
                                                <div>
                                                    {String(score._address).substring(0, 6) + "..." + String(score._address).substring(38)}
                                                </div>
                                                <div>
                                                    {String(score.guess)}
                                                </div>
                                            </section>
                                        ))
                                    )
                                        :
                                        null
                                    }
                                </>
                                :
                                <>
                                    <img src={loading} id="loadinggifsmall"></img>
                                    {allRevealed ?
                                        <p>waiting for game master...</p>
                                        :
                                        <p>waiting for other players...</p>
                                    }
                                </>
                            }
                        </>
                        :
                        <>
                            <p>make sure to enter the exact same guess and salt as you committed in the first step. Otherwise you get disqualified without payback.</p>
                            <section className="flex evenly">
                                <div className="padding20">
                                    <h3 className="primarytext padding20">guess: </h3>
                                    <form className="form-group">
                                        <input type="number" id="input" className="form-input" onChange={changeGuess} />
                                    </form>
                                </div>
                                <div className="padding20">
                                    <h3 className="secondarytext padding20">salt: </h3>
                                    <form className="form-group">
                                        <input type="number" id="input" className="form-input" onChange={changeSalt} />
                                    </form>
                                </div>
                            </section>
                            <button id="buttonintextfield" className="btn padding20" onClick={submitGuess}>reveal</button>
                        </>
                    }
                </div>
                {isMaster ?
                    <div className="textfield borderwhite">
                        <h3>you are the game master</h3>
                        {gameHasStarted ?
                            <>
                                {serviceFeeWithdrawn ?
                                    <p>service fee has been withdrawn.</p>
                                    :
                                    <button className="btn" onClick={getServiceFee}>claim your service fee</button>
                                }
                            </>
                            :
                            <>
                                <p><b>Condition</b>: all players have revealed their guess.</p>
                                <br />
                                <button className="btn padding20" onClick={startLastPhase}>Start</button>
                            </>
                        }
                        <br />
                    </div>
                    :
                    <>
                        {gameHasStarted ?
                            null
                            :
                            <div className="textfield">
                                <div className="pointer borderred padding20 round" onClick={() => setGameMasterNotResponding(!gameMasterNotResponding)}>
                                    the gamemaster does not respond?
                                </div>
                                {gameMasterNotResponding ?
                                    <>
                                        <p>
                                            if the game master does not respond after <span className="primarytext"> 24 hours</span>, every players can start the game.
                                        </p>
                                        <p>
                                            <span className="secondarytext">remember</span>: you will have to pay the gas fees for starting the game.
                                        </p>
                                        <button className="btn padding20" onClick={startLastPhase}>Start</button>

                                    </>
                                    :
                                    null
                                }
                            </div>
                        }
                    </>
                }
            </section>
        </>
    )
}

export default RevealPhaseScreen