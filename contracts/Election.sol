pragma solidity >=0.4.2;

contract Election {
    struct Candidate {
        string candidateId;
        string candidateName;
        string partyName;
        uint256 voteCount;
    }

    address admin;

    uint256 public candidateCount;

    mapping(address => bool) hasVoted;
    mapping(string => Candidate) candidates;

    constructor() public {
        admin = msg.sender;
        candidateCount = 0;
        addCandidate("NOTA", "NOTA");
        hasVoted[admin] = true;
    }

    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + (j % 10)));
            j /= 10;
        }
        str = string(bstr);
    }

    function addCandidate(string memory _name, string memory _party) public {
        require(msg.sender == admin, "Only admin has this privilege!!");
        candidateCount++;
        string memory candidateId = uint2str(candidateCount);
        candidates[candidateId] = Candidate(candidateId, _name, _party, 0);
    }

    function getCandidate(string memory _candidateId)
        public
        view
        returns (
            string memory _candidateName,
            string memory _partyName,
            uint256 _voteCount
        )
    {
        _candidateName = candidates[_candidateId].candidateName;
        _partyName = candidates[_candidateId].partyName;
        _voteCount = candidates[_candidateId].voteCount;
    }

    function vote(string memory _candidateId) public {
        require(msg.sender != admin, "Admin doesnt have the right to vote");
        require(!hasVoted[msg.sender], "User have voted before!!");
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount += 1;
    }

    function doneVoting() public view returns (bool _voted) {
        _voted = hasVoted[msg.sender];
    }
}
