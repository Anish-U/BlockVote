pragma solidity >=0.4.2;

contract Election {
    struct Candidate {
        uint256 candidateId;
        string candidateName;
        string partyName;
        uint256 voteCount;
    }

    address admin;

    uint256 public candidateCount;

    mapping(address => bool) hasVoted;
    mapping(uint256 => Candidate) candidates;

    constructor() {
        admin = msg.sender;
        candidateCount = 0;
        addCandidate("NOTA", "NOTA");
        hasVoted[admin] = true;
    }

    function addCandidate(string memory _name, string memory _party) public {
        require(msg.sender == admin, "Only admin has this privilege!!");
        candidateCount++;
        candidates[candidateCount] = Candidate(
            candidateCount,
            _name,
            _party,
            0
        );
    }

    function getCandidate(uint256 _candidateId)
        public
        view
        returns (
            string memory _candidateName,
            string memory _partyName,
            uint256 _voteCount
        )
    {
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate"
        );
        _candidateName = candidates[_candidateId].candidateName;
        _partyName = candidates[_candidateId].partyName;
        _voteCount = candidates[_candidateId].voteCount;
    }

    function vote(uint256 _candidateId) public {
        require(msg.sender != admin, "Admin doesnt have the right to vote");
        require(!hasVoted[msg.sender], "User have voted before!!");
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate"
        );
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
    }

    function doneVoting() public view returns (bool _voted) {
        _voted = hasVoted[msg.sender];
    }
}
