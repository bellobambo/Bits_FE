export const CONTRACT_ADDRESS =
  "0xcDFb1272Fad230337C553e8c5649d5C5cf361f03" as `0x${string}`;

export const CONTRACT_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "BPS_DENOMINATOR",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "FULL_YEAR_DURATION",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "HALF_YEAR_DURATION",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "INVESTOR_RENT_SHARE_BPS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "LANDLORD_RENT_SHARE_BPS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PAYMENT_GRACE_PERIOD",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PLATFORM_RENT_SHARE_BPS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "RENT_START_DELAY",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAIReview",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct Bits.AIReview",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "houseId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "reviewType",
            type: "uint8",
            internalType: "enum Bits.AIReviewType",
          },
          {
            name: "reviewer",
            type: "address",
            internalType: "address",
          },
          {
            name: "reviewerRole",
            type: "uint8",
            internalType: "enum Bits.Role",
          },
          {
            name: "status",
            type: "string",
            internalType: "string",
          },
          {
            name: "confidenceBps",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "summary",
            type: "string",
            internalType: "string",
          },
          {
            name: "evidenceHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "evidenceURI",
            type: "string",
            internalType: "string",
          },
          {
            name: "createdAt",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAIReviewCount",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAIReviews",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct Bits.AIReview[]",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "houseId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "reviewType",
            type: "uint8",
            internalType: "enum Bits.AIReviewType",
          },
          {
            name: "reviewer",
            type: "address",
            internalType: "address",
          },
          {
            name: "reviewerRole",
            type: "uint8",
            internalType: "enum Bits.Role",
          },
          {
            name: "status",
            type: "string",
            internalType: "string",
          },
          {
            name: "confidenceBps",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "summary",
            type: "string",
            internalType: "string",
          },
          {
            name: "evidenceHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "evidenceURI",
            type: "string",
            internalType: "string",
          },
          {
            name: "createdAt",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllHouses",
    inputs: [],
    outputs: [
      {
        name: "allHouses",
        type: "tuple[]",
        internalType: "struct Bits.House[]",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "landlord",
            type: "address",
            internalType: "address payable",
          },
          {
            name: "hostelName",
            type: "string",
            internalType: "string",
          },
          {
            name: "hostelLocation",
            type: "string",
            internalType: "string",
          },
          {
            name: "schoolName",
            type: "string",
            internalType: "string",
          },
          {
            name: "proofOfOwnership",
            type: "string",
            internalType: "string",
          },
          {
            name: "roomCount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "availableRooms",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "yearlyRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "halfYearRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "propertyValue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "totalInvested",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "fundingClosed",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getHouse",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct Bits.House",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "landlord",
            type: "address",
            internalType: "address payable",
          },
          {
            name: "hostelName",
            type: "string",
            internalType: "string",
          },
          {
            name: "hostelLocation",
            type: "string",
            internalType: "string",
          },
          {
            name: "schoolName",
            type: "string",
            internalType: "string",
          },
          {
            name: "proofOfOwnership",
            type: "string",
            internalType: "string",
          },
          {
            name: "roomCount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "availableRooms",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "yearlyRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "halfYearRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "propertyValue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "totalInvested",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "fundingClosed",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getHouseInvestors",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getHousePhotos",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string[]",
        internalType: "string[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInvestment",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "investor",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct Bits.Investment",
        components: [
          {
            name: "houseId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "investor",
            type: "address",
            internalType: "address",
          },
          {
            name: "amount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "investedAt",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInvestorHouses",
    inputs: [
      {
        name: "investor",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "investorHouses",
        type: "tuple[]",
        internalType: "struct Bits.House[]",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "landlord",
            type: "address",
            internalType: "address payable",
          },
          {
            name: "hostelName",
            type: "string",
            internalType: "string",
          },
          {
            name: "hostelLocation",
            type: "string",
            internalType: "string",
          },
          {
            name: "schoolName",
            type: "string",
            internalType: "string",
          },
          {
            name: "proofOfOwnership",
            type: "string",
            internalType: "string",
          },
          {
            name: "roomCount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "availableRooms",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "yearlyRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "halfYearRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "propertyValue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "totalInvested",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "fundingClosed",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMyPayoutHistory",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct Bits.Payout[]",
        components: [
          {
            name: "receiptId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "houseId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "recipient",
            type: "address",
            internalType: "address",
          },
          {
            name: "recipientRole",
            type: "uint8",
            internalType: "enum Bits.Role",
          },
          {
            name: "amount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "paidAt",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOwnerHouses",
    inputs: [
      {
        name: "landlord",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "ownerHouses",
        type: "tuple[]",
        internalType: "struct Bits.House[]",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "landlord",
            type: "address",
            internalType: "address payable",
          },
          {
            name: "hostelName",
            type: "string",
            internalType: "string",
          },
          {
            name: "hostelLocation",
            type: "string",
            internalType: "string",
          },
          {
            name: "schoolName",
            type: "string",
            internalType: "string",
          },
          {
            name: "proofOfOwnership",
            type: "string",
            internalType: "string",
          },
          {
            name: "roomCount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "availableRooms",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "yearlyRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "halfYearRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "propertyValue",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "totalInvested",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "fundingClosed",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "active",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPayoutHistory",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "recipient",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct Bits.Payout[]",
        components: [
          {
            name: "receiptId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "houseId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "recipient",
            type: "address",
            internalType: "address",
          },
          {
            name: "recipientRole",
            type: "uint8",
            internalType: "enum Bits.Role",
          },
          {
            name: "amount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "paidAt",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReceipt",
    inputs: [
      {
        name: "receiptId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct Bits.RentalReceipt",
        components: [
          {
            name: "id",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "houseId",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "student",
            type: "address",
            internalType: "address",
          },
          {
            name: "studentName",
            type: "string",
            internalType: "string",
          },
          {
            name: "studentSchoolName",
            type: "string",
            internalType: "string",
          },
          {
            name: "landlord",
            type: "address",
            internalType: "address",
          },
          {
            name: "landlordName",
            type: "string",
            internalType: "string",
          },
          {
            name: "amountPaid",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "term",
            type: "uint8",
            internalType: "enum Bits.RentTerm",
          },
          {
            name: "paidAt",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "startDate",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "dueDate",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "endDate",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "houseCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "invest",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "investedAtByHouse",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "investedByHouse",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextAIReviewId",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextHouseId",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextReceiptId",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "payRent",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "term",
        type: "uint8",
        internalType: "enum Bits.RentTerm",
      },
    ],
    outputs: [
      {
        name: "receiptId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "platformOwner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address payable",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "receiptCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "register",
    inputs: [
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
      {
        name: "role",
        type: "uint8",
        internalType: "enum Bits.Role",
      },
      {
        name: "matricNumber",
        type: "string",
        internalType: "string",
      },
      {
        name: "schoolName",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "storeInvestmentReview",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "status",
        type: "string",
        internalType: "string",
      },
      {
        name: "confidenceBps",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "summary",
        type: "string",
        internalType: "string",
      },
      {
        name: "evidenceHash",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "evidenceURI",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "reviewId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "storePropertyVerificationReview",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "status",
        type: "string",
        internalType: "string",
      },
      {
        name: "confidenceBps",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "summary",
        type: "string",
        internalType: "string",
      },
      {
        name: "evidenceHash",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "evidenceURI",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "reviewId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "uploadHouse",
    inputs: [
      {
        name: "input",
        type: "tuple",
        internalType: "struct Bits.HouseInput",
        components: [
          {
            name: "hostelName",
            type: "string",
            internalType: "string",
          },
          {
            name: "hostelLocation",
            type: "string",
            internalType: "string",
          },
          {
            name: "schoolName",
            type: "string",
            internalType: "string",
          },
          {
            name: "proofOfOwnership",
            type: "string",
            internalType: "string",
          },
          {
            name: "photos",
            type: "string[]",
            internalType: "string[]",
          },
          {
            name: "roomCount",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "yearlyRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "halfYearRent",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "propertyValue",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    outputs: [
      {
        name: "houseId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "users",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
      {
        name: "role",
        type: "uint8",
        internalType: "enum Bits.Role",
      },
      {
        name: "matricNumber",
        type: "string",
        internalType: "string",
      },
      {
        name: "schoolName",
        type: "string",
        internalType: "string",
      },
      {
        name: "registered",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AIReviewStored",
    inputs: [
      {
        name: "reviewId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "houseId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "reviewType",
        type: "uint8",
        indexed: true,
        internalType: "enum Bits.AIReviewType",
      },
      {
        name: "reviewer",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "reviewerRole",
        type: "uint8",
        indexed: false,
        internalType: "enum Bits.Role",
      },
      {
        name: "status",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "confidenceBps",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "evidenceHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "evidenceURI",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "HouseFundingClosed",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "totalInvested",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "HouseInvestment",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "investor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "HouseUploaded",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "landlord",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "propertyValue",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PayoutRecorded",
    inputs: [
      {
        name: "receiptId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "houseId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "recipient",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "recipientRole",
        type: "uint8",
        indexed: false,
        internalType: "enum Bits.Role",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RentDistributed",
    inputs: [
      {
        name: "houseId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "platformAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "landlordAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "investorAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RentPaid",
    inputs: [
      {
        name: "receiptId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "houseId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "student",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "startDate",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "dueDate",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "endDate",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "UserRegistered",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "name",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "role",
        type: "uint8",
        indexed: false,
        internalType: "enum Bits.Role",
      },
      {
        name: "matricNumber",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "schoolName",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
] as const;
