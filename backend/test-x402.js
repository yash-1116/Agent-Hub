require("dotenv").config();

const algosdk = require("algosdk");
const {
  x402Client,
  x402HTTPClient
} = require("@x402/core/client");
const { ExactAvmScheme } = require("@x402/avm/exact/client");

async function main() {
  const privateKey = new Uint8Array(
    Buffer.from(process.env.AVM_PRIVATE_KEY, "base64")
  );

  if (!privateKey.length) {
    throw new Error("AVM_PRIVATE_KEY is missing or invalid");
  }

  const account = algosdk.mnemonicFromSeed
    ? null
    : null;

  // Derive the address from the secret key.
  // This works with the algosdk version installed in this project.
  const accountData = algosdk.secretKeyToMnemonic
    ? algosdk.secretKeyToMnemonic(privateKey)
    : null;

  if (!accountData) {
    throw new Error("Could not derive Algorand account from private key");
  }

  const paymentAccount = algosdk.mnemonicToSecretKey(accountData);

  console.log("Payment account:", paymentAccount.addr.toString());

  /*
   * x402 AVM signer.
   *
   * x402 gives us encoded unsigned transactions.
   * We decode each transaction and use the transaction's
   * built-in signTxn() method.
   */
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

  const url = "http://localhost:5000/api/orchestrate";

  console.log("Requesting payment requirements...");

  const firstResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file: "test.txt",
      task: "test"
    })
  });

  console.log("First response:", firstResponse.status);

  if (firstResponse.status !== 402) {
    const text = await firstResponse.text();

    console.log("Unexpected response:");
    console.log(text);

    return;
  }

  const responseHeaders = Object.fromEntries(firstResponse.headers);

  const paymentRequired =
    httpClient.getPaymentRequiredResponse(
      (name) => responseHeaders[name.toLowerCase()],
      null
    );

  console.log("Payment required:", {
    amount: paymentRequired.accepts?.[0]?.amount,
    asset: paymentRequired.accepts?.[0]?.asset,
    network: paymentRequired.accepts?.[0]?.network,
    payTo: paymentRequired.accepts?.[0]?.payTo
  });

  console.log("Creating 0.01 USDC payment...");

  const paymentPayload =
    await httpClient.createPaymentPayload(paymentRequired);

  console.log("Payment payload created successfully.");

  const paymentHeaders =
    httpClient.encodePaymentSignatureHeader(paymentPayload);

  console.log("Sending paid request...");

  const paidResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...paymentHeaders
    },
    body: JSON.stringify({
      file: "test.txt",
      task: "test"
    })
  });

  console.log("Paid response:", paidResponse.status);

  const responseText = await paidResponse.text();

  console.log("Response:");
  console.log(responseText);

  const paidResponseHeaders =
    Object.fromEntries(paidResponse.headers);

  if (paidResponse.status === 200) {
    try {
      const settlement =
        httpClient.getPaymentSettleResponse(
          (name) => paidResponseHeaders[name.toLowerCase()]
        );

      console.log("Settlement:", settlement);
    } catch {
      console.log("No PAYMENT-RESPONSE header found.");
    }
  }
}

main().catch((error) => {
  console.error("x402 test failed:");
  console.error(error);
  process.exit(1);
});