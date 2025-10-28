
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const PrivateSwapABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [],
      "name": "PricesUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "Quoted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getLastQuoteHandle",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getPrices",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint32",
          "name": "priceAtoB_1e4",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "priceBtoA_1e4",
          "type": "uint32"
        }
      ],
      "name": "initPrices",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "amountIn_encrypted",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "maxSlippagePpm_encrypted",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "quoteAtoB",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "amountIn_encrypted",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "maxSlippagePpm_encrypted",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "quoteBtoA",
      "outputs": [
        {
          "internalType": "euint64",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "priceAtoB_encrypted",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "priceBtoA_encrypted",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "setPrices",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
