import { addresses } from "./sanctionLists/sanctionedAddresses.js"
//const sanctionList = "https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/main/lists/sanctioned_addresses_XBT.json";
//let addresses = [];
let mempoolApiUrl = "https://mempool.space/api/tx/";
let adressResultSet = new Set();
let maxHops;
let startedRequests = 0;
let finishedRequests = 0;
let stopRequested = false;

const checkTransaction = async (transID, hopsLeft) => {
  try {
    if (stopRequested) {
      updateUI();
      return;
    }
    if (hopsLeft > 0) {
      startedRequests++;
      document.getElementById("startedRequests").textContent = startedRequests;
      document.getElementById("openRequests").textContent = startedRequests - finishedRequests;
      const response = await getVins(transID);
      if (response) {
        finishedRequests++;
        document.getElementById("finishedRequests").textContent = finishedRequests;
      document.getElementById("openRequests").textContent = startedRequests - finishedRequests;
        for (let vin of response) {
          adressResultSet.add(vin.prevout["scriptpubkey_address"]);
          await checkTransaction(vin.txid, hopsLeft -1);
        }
      }
    } else {
      updateUI();
    }
  } catch (error) {
    document.getElementById("error").textContent = error;
  }
}

const updateUI = () => {
  let sumAdresses = 0;
  let sumSanctionAdresses = 0;
  document.getElementById("adressList").innerHTML = ""; 
  document.getElementById("sanctionList").innerHTML = ""; 
  document.getElementById("totalSanctionAdresses").style.color = "";

  adressResultSet.forEach(item => {
    let newListItem = document.createElement("li");
    let newLink = document.createElement("a");
    newLink.href = "https://mempool.space/de/address/" + item;
    newLink.target = "_blank";
    newLink.textContent = item;
    newListItem.appendChild(newLink)
    if (addresses.includes(item)) {
      sumSanctionAdresses++;
      document.getElementById("sanctionList").appendChild(newListItem);
    } else {
      sumAdresses++;
      document.getElementById("adressList").appendChild(newListItem);
    }
  });

  document.getElementById("totalAdresses").textContent = sumAdresses;
  document.getElementById("totalSanctionAdresses").textContent = sumSanctionAdresses;

  if (sumSanctionAdresses !== 0) {
    document.getElementById("totalSanctionAdresses").style.color = "red";
  }
}

const getVins = async (transID) => {
  try {
    let url = mempoolApiUrl + transID;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Response Status: " + response.status);
    }
    const json = await response.json();
    return json.vin;
  } catch (error) {
    document.getElementById("error").textContent = error;
    return null;
  }
}

const startCheck = () => {
  stopRequested = false;
  startedRequests = 0;
  finishedRequests = 0;
  document.getElementById("startedRequests").textContent = "";
  document.getElementById("finishedRequests").textContent = "";
  document.getElementById("openRequests").textContent = "";
  document.getElementById("adressList").innerHTML = "";
  document.getElementById("sanctionList").innerHTML = "";
  document.getElementById("error").textContent = "None";
  adressResultSet = new Set();
  let transactionID = document.getElementById("transactionID").value;
  maxHops = parseInt(document.getElementById("recursion").value, 10);
  checkTransaction(transactionID, maxHops);
}

const updateEndpoint = () => {
  mempoolApiUrl = document.getElementById("endpoint").value
  document.getElementById("endpointInfo").textContent = mempoolApiUrl;
}

const resetEndpoint = () => {
  mempoolApiUrl = "https://mempool.space/api/tx/";
  document.getElementById("endpointInfo").textContent = mempoolApiUrl;
  document.getElementById("endpoint").value = "";
}

const resetChecker = () => {
  document.getElementById("startedRequests").textContent = "0";
  document.getElementById("finishedRequests").textContent = "0";
  document.getElementById("openRequests").textContent = "0";
  document.getElementById("totalAdresses").textContent = "";
  document.getElementById("totalSanctionAdresses").textContent = "";
  document.getElementById("adressList").innerHTML = "";
  document.getElementById("sanctionList").innerHTML = "";
  document.getElementById("transactionID").value = "";
  document.getElementById("recursion").value = "5";
}

const stopCheck = () => {
  stopRequested = true;
}

document.getElementById("submit").addEventListener("click", startCheck);
document.getElementById("stopRequest").addEventListener("click", stopCheck);
document.getElementById("resetList").addEventListener("click", resetChecker);
document.getElementById("setEndpoint").addEventListener("click", updateEndpoint);
document.getElementById("resetEndpoint").addEventListener("click", resetEndpoint);
document.getElementById("endpointInfo").textContent = mempoolApiUrl;
