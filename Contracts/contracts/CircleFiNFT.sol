// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "@tableland/evm/contracts/ITablelandTables.sol";

contract CircleFiNFT is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct UserInfo {
        uint256 roundsCompleted;
        uint256 tokenIndex;
    }
    /// A URI used to reference off-chain metadata.
    // This will use the Tableland gateway and query: https://testnet.tableland.network/query?mode=list&s=
    // See the `query?mode=list&s=` appended -- a SQL query `s` and mode to format to ERC721 standard
    string public baseURIString;

    // Connection to tableland
    ITablelandTables private _tableland;
    // Table identifiers
    uint256 private mainTableId;
    uint256 private attributesTableId;
    // The name of the main metadata table in Tableland
    // Schema: id int primary key, name text, description text, image text
    string private mainTableName;
    // The name of the attributes table in Tableland
    // Schema: main_id int not null, trait_type text not null, value text
    string private attributesTableName;
    // Map containing info about the user's current number of completed rounds and token index
    mapping(address => UserInfo) private userInfoMap;

    /**
     * @dev Initialize CircleNFT
     * registry - Location of the Tableland smart contract (for goerli: 0xda8ea22d092307874f30a1f277d1388dca0ba97a)
     * baseURI - Set the contract's base URI to the Tableland gateway
     * _mainTablePrefix - The name prefix of the 'main' table for NFT metadata
     * _attributesTablePrefixgh 09 ,≥ - The corresponding 'attributes' table prefix
     */
    constructor(
        address registry,
        string memory baseURI,
        string memory _mainTablePrefix,
        string memory _attributesTablePrefix
    ) ERC721("CircleFiNFT", "CFNFT") {
        // Set the baseURI to the Tableland gateway
        baseURIString = baseURI;
        // Set up tableland and table names
        _tableland = ITablelandTables(registry);
        _createTables(_mainTablePrefix, _attributesTablePrefix);
    }

    function _createTables(string memory mainTablePrefix, string memory attributesTablePrefix) internal {
        string memory mainTableExtendedPrefix = string(abi.encodePacked(
            mainTablePrefix,
            "_",
            Strings.toString(block.chainid)
        ));
        mainTableId = _tableland.createTable(
            address(this),
            string(abi.encodePacked(
                "CREATE TABLE ",
                mainTableExtendedPrefix,
                " (id int primary key, name text, description text, image text);"
            ))
        );
        mainTableName = string(abi.encodePacked(
            mainTableExtendedPrefix,
            "_",
            Strings.toString(mainTableId)
        ));
        string memory attributesTableExtendedPrefix = string(abi.encodePacked(
            attributesTablePrefix,
            "_",
            Strings.toString(block.chainid)
        ));
        attributesTableId = _tableland.createTable(
            address(this),
            string(abi.encodePacked(
                "CREATE TABLE ",
                attributesTableExtendedPrefix,
                " (main_id int not null, trait_type text not null, value text);"
            ))
        );
        attributesTableName = string(abi.encodePacked(
            attributesTableExtendedPrefix,
            "_",
            Strings.toString(attributesTableId)
        ));
    } 

    function _baseURI() internal view override returns (string memory) {
        return baseURIString;
    }

    function getMainTableId() external view returns (uint256) {
        return mainTableId;
    }

    function getAttributesTableId() external view returns (uint256) {
        return attributesTableId;
    }

    function getMainTableName() external view returns (string memory) {
        return mainTableName;
    }

    function getAttributesTableName() external view returns (string memory) {
        return attributesTableName;
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function getTokenCount() public view returns (uint256 tokenCount) {
        return _tokenIdCounter.current();
    }

    function getRoundCountForUser(address user) external view returns(uint256) {
        return userInfoMap[user].roundsCompleted;
    }

    function getTokenIdForUser(address user) external view returns(uint256) {
        require(userInfoMap[user].roundsCompleted > 0, "User doesn't currently own this token.");
        return userInfoMap[user].tokenIndex;
    }

    function mintOrUpdateMetadata(address recipient) public {
        UserInfo memory userInfo = userInfoMap[recipient];
        // Check whether the user already owns this NFT via whether they've previously completed rounds
        if (userInfo.roundsCompleted == 0) {
            // Generate metadata for user completing their first round
            (string memory uri, string memory level) = getUserMetadata(1);
            // Insert NFT metadata for user into main table
            string memory query = string(abi.encodePacked(
                "INSERT INTO ",
                mainTableName,
                " (id, name, description, image) VALUES (",
                Strings.toString(_tokenIdCounter.current()),
                ", 'CircleFiNFT #",
                Strings.toString(_tokenIdCounter.current()),
                "', 'An NFT commemorating your achievements completing full Circle rounds.', '",
                uri,
                "')"
            ));
            _tableland.runSQL(
                address(this),
                mainTableId,
                query
            );
            query = string(abi.encodePacked(
                    "INSERT INTO ",
                    attributesTableName,
                    " (main_id, trait_type, value) VALUES (",
                    Strings.toString(_tokenIdCounter.current()),
                    ", 'NumCompletedCircles', 1)"
                ));
            // Insert NFT attributes into attributes table
            _tableland.runSQL(
                address(this),
                attributesTableId,
                query
            );
            query = string(abi.encodePacked(
                    "INSERT INTO ",
                    attributesTableName,
                    " (main_id, trait_type, value) VALUES (",
                    Strings.toString(_tokenIdCounter.current()),
                    ", 'Level', '",
                    level,
                    "')"
                ));
            _tableland.runSQL(
                address(this),
                attributesTableId,
                query
            );
            // Add user to userInfoMap
            userInfoMap[recipient] = UserInfo(1, _tokenIdCounter.current());
            // Mint token for user
            safeMint(recipient);
        } else {
            // If the user already owns the token, find their tokenId
            uint256 tokenId = userInfoMap[recipient].tokenIndex;
            // Find and increment round count to reflect the latest completed circle
            uint256 roundCount = userInfoMap[recipient].roundsCompleted + 1;
            // Generate user metadata for given round count
            (string memory uri, string memory level) = getUserMetadata(roundCount);
            // Update NFT metadata for user in main table
            string memory query = 
                string(abi.encodePacked(
                    "UPDATE ",
                    mainTableName,
                    " SET image = '",
                    uri,
                    "' WHERE id =",
                    Strings.toString(tokenId)
                ));
            _tableland.runSQL(
                address(this),
                mainTableId,
                query
            );
            // Update NFT attributes in attributes table
            query =
                string(abi.encodePacked(
                    "UPDATE ",
                    attributesTableName,
                    " SET value = '",
                    level,
                    "' WHERE main_id = ",
                    Strings.toString(tokenId),
                    " AND trait_type = 'Level'"
                ));
            _tableland.runSQL(
                address(this),
                attributesTableId,
                query
            );
            query = 
                string(abi.encodePacked(
                    "UPDATE ",
                    attributesTableName,
                    " SET value = ",
                    Strings.toString(roundCount),
                    " WHERE main_id = ",
                    Strings.toString(tokenId),
                    " AND trait_type = 'NumCompletedCircles'"
                ));
            _tableland.runSQL(
                address(this),
                attributesTableId,
                query
            );
            // Update userInfoMap to reflect the latest completed round
            userInfoMap[recipient] = UserInfo(roundCount, tokenId);
        }
    }

    function getUserMetadata(uint256 roundCount) internal pure returns (string memory uri, string memory level) {
        require(roundCount > 0, "Round count must be greater than zero.");
        if (roundCount < 4) {
            uri = "https://ipfs.io/ipfs/bafkreidrajeqz2ja2mrjkpyqccysskeyw27nkketa6n3pwjsdp7kxds4x4";
            level = "Beginner";
        } else if (roundCount < 11) {
            uri = "https://ipfs.io/ipfs/bafkreiacwatbslyi32qv5vbhnro7pinbkfhdcuxqiwnitkzlovuffb42xe";
            level = "Intermediate";
        } else if (roundCount < 21) {
            uri = "https://ipfs.io/ipfs/bafkreicystubdzxuw3qm53fhmkx6mrqvfhqemevol3xb5s6kdp4nqy34li";
            level = "Advanced";
        } else {
            uri = "https://ipfs.io/ipfs/bafkreidi5wrrzsgwguwmm5udjdo5ah7b3paf6slec2j6g7c6yi643rzm6m";
            level = "Expert";
        }
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
    }

    /**
     *  @dev Must override the default implementation, which simply appends a `tokenId` to _baseURI.
     *  tokenId - The id of the NFT token that is being requested
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
         require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        string memory baseURI = _baseURI();

        if (bytes(baseURI).length == 0) {
            return "";
        }

        string memory query = string(
            abi.encodePacked(
                "SELECT%20json_object%28%27id%27%2Cid%2C%27name%27%2Cname%2C%27image%27%2Cimage%2C%27description%27%2Cdescription%2C%27attributes%27%2Cjson_group_array%28json_object%28%27trait_type%27%2Ctrait_type%2C%27value%27%2Cvalue%29%29%29%20FROM%20",
                mainTableName,
                "%20JOIN%20",
                attributesTableName,
                "%20ON%20",
                mainTableName,
                "%2Eid%20%3D%20",
                attributesTableName,
                "%2Emain_id%20WHERE%20id%3D"
            )
        );
        // Return the baseURI with a query string, which looks up the token id in a row.
        // `&mode=list` formats into the proper JSON object expected by metadata standards.
        return
            string(
                abi.encodePacked(
                    baseURI,
                    query,
                    Strings.toString(tokenId),
                    "%20group%20by%20id"
                )
            );
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
