// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract GuessingGame {
    struct Rules {
        uint256 minGuess;
        uint256 maxGuess;
        uint256 minPlayers;
        uint256 entryFee;
    }

    mapping(address => uint256) private playersGuesses;
    address[] public players;

    Rules public RULES;
    address public owner;
    address public winner;

    mapping(bytes32 => uint256) private randomNumbers;

    // constructor(
    //     uint256 _minGuess,
    //     uint256 _maxGuess,
    //     uint256 _minPlayers,
    //     uint256 _entryFee
    // ) {
    //     owner = msg.sender;
    //     RULES = Rules(_minGuess, _maxGuess, _minPlayers, _entryFee);
    // }

    function init(
        uint256 _minGuess,
        uint256 _maxGuess,
        uint256 _minPlayers,
        uint256 _entryFee,
        address _owner
    ) external {
        owner = _owner;
        RULES = Rules(_minGuess, _maxGuess, _minPlayers, _entryFee);
    }

    receive() external payable {
        revert(
            "This contract does not accept Ether, if you don't participate in the Game."
        );
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only the owner can use this function.");
        _;
    }

    function getPlayerCount() public view returns (uint256) {
        return players.length;
    }

    function getMyGuess() public view returns (uint256) {
        return playersGuesses[msg.sender];
    }

    function enterGuess(uint256 _guess) public payable {
        require(msg.value == RULES.entryFee, "Insufficient entry fee.");
        require(
            _guess >= RULES.minGuess && _guess <= RULES.maxGuess,
            "Check your input value."
        );
        require(
            playersGuesses[msg.sender] == 0,
            "You have already entered a guess."
        );
        players.push(msg.sender);
        playersGuesses[msg.sender] = _guess;
    }

    function startGame() public onlyOwner {
        require(players.length >= RULES.minPlayers, "Not enough players.");
        uint256 target = ((sumGuesses() / players.length) * 66) / 100; // geändert von /3 * 2 wegen genauigkeit und rundung von solidity

        uint256 minDiff = calcWinningDiff(RULES.maxGuess, target);
        uint256 countWinners = getAmountOfWinners(minDiff, target, 0);
        address[] memory possibleWinners = getPossibleWinners(
            minDiff,
            target,
            countWinners
        );
        //uint256 winnerIndex = randomNumbers[0] % (possibleWinners.length);
        uint256 winnerIndex = 123456789 % (possibleWinners.length);
        winner = possibleWinners[winnerIndex];
        payout();
    }

    function sumGuesses() private view returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < players.length; i++) {
            sum = playersGuesses[players[i]];
        }
        return sum;
    }

    function getPossibleWinners(
        uint256 minDiff,
        uint256 target,
        uint256 countWinners
    ) private view returns (address[] memory) {
        address[] memory possibleWinners = new address[](countWinners);
        for (uint256 i = 0; i < players.length; i++) {
            if (minDiff == absDiff(playersGuesses[players[i]], target)) {
                possibleWinners[i] = players[i];
            }
        }
        return possibleWinners;
    }

    function calcWinningDiff(
        uint256 minDiff,
        uint256 target
    ) private view returns (uint256) {
        for (uint256 i = 0; i < players.length; i++) {
            if (absDiff(playersGuesses[players[i]], target) <= minDiff) {
                minDiff = absDiff(playersGuesses[players[i]], target);
            }
        }
        return minDiff;
    }

    function getAmountOfWinners(
        uint256 minDiff,
        uint256 target,
        uint256 count
    ) private view returns (uint256) {
        for (uint256 i = 0; i < players.length; i++) {
            if (minDiff == absDiff(playersGuesses[players[i]], target)) {
                count++;
            }
        }
        return count;
    }

    function absDiff(
        uint256 num1,
        uint256 num2
    ) private pure returns (uint256) {
        if (num1 >= num2) {
            return num1 - num2;
        } else {
            return num2 - num1;
        }
    }

    function payout() private {
        require(winner != address(0), "Winner has not been announced yet.");
        uint256 amount = address(this).balance;
        require(amount > 0, "No balance to payout.");
        payable(winner).transfer(amount);
    }

    // function requestRandomNumber() private returns (bytes32) {
    //     require(
    //         LINK.balanceOf(address(this)) >= 1,
    //         "Not enough LINK to fulfill request"
    //     );
    //     bytes memory encodedSeed = abi.encodePacked(
    //         block.timestamp,
    //         block.number
    //     );
    //     bytes32 requestId = requestRandomness(bytes32(encodedSeed), 0);
    //     randomNumbers[requestId] = 0;
    //     return requestId;
    // }

    // function fulfillRandomness(
    //     bytes32 requestId,
    //     uint256 randomness
    // ) internal override {
    //     randomNumbers[requestId] = randomness;
    // }

    // function autoStart() private {
    //     require(players.length >= RULES.minPlayers, "Not enough players.");
    //     // start startGame if enterGuess
    // }
}
