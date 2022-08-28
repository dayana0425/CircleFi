// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CircleNFT is ERC721, Ownable {
    /// A URI used to reference off-chain metadata.
    // This will use the Tableland gateway and query: https://testnet.tableland.network/query?mode=list&s=
    // See the `query?mode=list&s=` appended -- a SQL query `s` and mode to format to ERC721 standard
    string public baseURIString;
    /// The name of the main metadata table in Tableland
    // Schema: id int primary key, name text, description text, image text
    string public mainTable;
    /// The name of the attributes table in Tableland
    // Schema: main_id int not null, trait_type text not null, value text
    string public attributesTable;
    /// A token counter, to track NFT tokenIds
    uint256 public tokenIdCounter;

    /**
     * @dev Initialize CircleNFT
     * baseURI - Set the contract's base URI to the Tableland gateway
     * _mainTable - The name of the 'main' table for NFT metadata
     * _attributesTable - The corresponding 'attributes' table
     */
    constructor(
        string memory baseURI,
        string memory _mainTable,
        string memory _attributesTable
    ) ERC721("CircleNFT", "CNFT") {
        // Initialize with token counter at zero
        tokenIdCounter = 0;
        // Set the baseURI to the Tableland gateway
        baseURIString = baseURI;
        // Set the table names
        mainTable = _mainTable;
        attributesTable = _attributesTable;
    }

    /**
     *  @dev Must override the default implementation, which returns an empty string.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURIString;
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
                mainTable,
                "%20JOIN%20",
                attributesTable,
                "%20ON%20",
                mainTable,
                "%2Eid%20%3D%20",
                attributesTable,
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

    /**
     * @dev Mint an NFT, incrementing the `_tokenIdCounter` upon each call.
     */
    function mint() public {
        _safeMint(msg.sender, tokenIdCounter);
        tokenIdCounter++;
    }
}
