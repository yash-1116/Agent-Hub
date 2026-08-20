require("dotenv").config();

const algosdk = require("algosdk");
const {
x402Client,
x402HTTPClient
} = require("@x402/core/client");
const { ExactAvmScheme } = require("@x402/avm/exact/client");

async function main() {
// ------------------------------------------------------------
// 1. Load payment account
// ------------------------------------------------------------

const privateKeyBase64 = process.env.AVM_PRIVATE_KEY;

if (!privateKeyBase64) {
throw new Error("AVM_PRIVATE_KEY is missing from .env");
}

const privateKey = new Uint8Array(
Buffer.from(privateKeyBase64, "base64")
);

if (!privateKey.length) {
throw new Error("AVM_PRIVATE_KEY is empty or invalid");
}

const mnemonic = algosdk.secretKeyToMnemonic(privateKey);

if (!mnemonic) {
throw new Error("Could not derive mnemonic from AVM_PRIVATE_KEY");
}

const paymentAccount = algosdk.mnemonicToSecretKey(mnemonic);

console.log("Payment account:", paymentAccount.addr.toString());

// ------------------------------------------------------------
// 2. Create x402 Algorand signer
// ------------------------------------------------------------

const signer = {
address: paymentAccount.addr.toString(),

signTransactions: async (txns, indexes) => {
  return txns.map((txnBytes, i) => {
    if (!indexes.includes(i)) {
      return null;
    }

    const txn = algosdk.decodeUnsignedTransaction(txnBytes);

    return txn.signTxn(paymentAccount.sk);
  });
}

};

const scheme = new ExactAvmScheme(signer);

const client = new x402Client()
.register("algorand:*", scheme);

const httpClient = new x402HTTPClient(client);

// ------------------------------------------------------------
// 3. API endpoint
// ------------------------------------------------------------

const url = "http://localhost:5000/api/orchestrate";

// ------------------------------------------------------------
// 4. Request body
//
// Summary Agent requires text.
// ------------------------------------------------------------

const requestBody = {
  file: "test.txt",
  task: "fraud",
  text: "URGENT: Send your wallet seed phrase immediately to claim your free 100 USDC reward. Click this suspicious link now."
};
console.log("Request body:");
console.log(JSON.stringify(requestBody, null, 2));

// ------------------------------------------------------------
// 5. First request - expect HTTP 402
// ------------------------------------------------------------

console.log("Requesting payment requirements...");

const firstResponse = await fetch(url, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify(requestBody)
});

console.log("First response:", firstResponse.status);

if (firstResponse.status !== 402) {
const text = await firstResponse.text();

console.log("Unexpected response:");
console.log(text);

return;

}

// ------------------------------------------------------------
// 6. Read x402 payment requirements
// ------------------------------------------------------------

const responseHeaders = Object.fromEntries(firstResponse.headers);

const paymentRequired = httpClient.getPaymentRequiredResponse(
(name) => responseHeaders[name.toLowerCase()],
null
);

console.log("Payment required:", {
amount: paymentRequired.accepts?.[0]?.amount,
asset: paymentRequired.accepts?.[0]?.asset,
network: paymentRequired.accepts?.[0]?.network,
payTo: paymentRequired.accepts?.[0]?.payTo
});

// ------------------------------------------------------------
// 7. Create payment payload
// ------------------------------------------------------------

console.log("Creating 0.01 USDC payment...");

const paymentPayload =
await httpClient.createPaymentPayload(paymentRequired);

console.log("Payment payload created successfully.");

// ------------------------------------------------------------
// 8. Encode payment header
// ------------------------------------------------------------

const paymentHeaders =
httpClient.encodePaymentSignatureHeader(paymentPayload);

console.log("Payment header created successfully.");

// ------------------------------------------------------------
// 9. Send paid request
// ------------------------------------------------------------

console.log("Sending paid request...");

const paidResponse = await fetch(url, {
method: "POST",
headers: {
"Content-Type": "application/json",
...paymentHeaders
},
body: JSON.stringify(requestBody)
});

console.log("Paid response:", paidResponse.status);

const responseText = await paidResponse.text();

console.log("Response:");
console.log(responseText);

// ------------------------------------------------------------
// 10. Read settlement response
// ------------------------------------------------------------

const paidResponseHeaders =
Object.fromEntries(paidResponse.headers);

if (paidResponse.status === 200) {
try {
const settlement =
httpClient.getPaymentSettleResponse(
(name) => paidResponseHeaders[name.toLowerCase()]
);

  console.log("Settlement:");
  console.log(settlement);
} catch (error) {
  console.log("No PAYMENT-RESPONSE header found.");

  if (error?.message) {
    console.log("Settlement header error:", error.message);
  }
}

return;

}

console.log("Paid request did not complete successfully.");
}

main().catch((error) => {
console.error("x402 summary test failed:");
console.error(error);
process.exit(1);
});