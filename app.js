import { addresses } from "./sanctionLists/sanctionedAddresses.js";


let mempoolApiUrl = "https://mempool.space/api/tx/";
let adressResultSet = new Map();
let maxHops;
let startedRequests = 0;
let finishedRequests = 0;
let stopRequested = false;

const addErrorToList = error => {
  const errorList = document.getElementById("error")
  const newListItem = document.createElement("li") 
  newListItem.textContent = error
  errorList.appendChild(newListItem)
}

const copyBitcoinAddress = () => {  
  const bitcoinAddress = 'bc1qlxylv26hhrqzngqpax6cnyd3ds6dlrnyr49uw3';
  const tempInput = document.createElement('input');
  document.body.appendChild(tempInput);
  tempInput.value = bitcoinAddress;
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);

  const copyAddressElement = document.getElementById("copyAdress");
  copyAddressElement.classList.add("show-tooltip");

  setTimeout(() => {
    copyAddressElement.classList.remove("show-tooltip");
  }, 2000); // Tooltip verschwindet nach 5 Sekunden
};

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
          processVin(vin, hopsLeft);
          await checkTransaction(vin.txid, hopsLeft - 1);
        }
        updateUI();
      }
    } else {
      updateUI();
    }
  } catch (error) {
    addErrorToList(error)
  }
};

const processVin = (vin, hopsLeft) => {
  let valueToAdd;
  if (!vin.prevout["scriptpubkey_address"]) {
    const pubKey = vin.prevout.scriptpubkey;
    valueToAdd = pubKey.slice(2, -2);
  } else {
    valueToAdd = vin.prevout["scriptpubkey_address"];
  }
  const currentHops = maxHops - hopsLeft;

  if (!adressResultSet.has(valueToAdd)) {
    adressResultSet.set(valueToAdd, { hops: currentHops + 1, txIds: [vin.txid]});
  } else {
    let existingData = adressResultSet.get(valueToAdd)
    if (existingData.hops > currentHops) {
      existingData.hops = currentHops +1;
      existingData.txIds = [vin.txid];
    } else if (existingData.hops === currentHops + 1) {
      existingData.txIds.push(vin.txid)
    }
  }
};

const updateUI = () => {
  let sumAdresses = 0;
  let sumSanctionAdresses = 0;
  document.getElementById("adressList").innerHTML = ""; 
  document.getElementById("sanctionList").innerHTML = ""; 
  document.getElementById("totalSanctionAdresses").style.color = "";

  adressResultSet.forEach((data, item) => {
    let newListItem = document.createElement("li");
    let newLink = document.createElement("a");
    newLink.href = "https://mempool.space/de/address/" + item;
    newLink.target = "_blank";

    if (addresses.includes(item)) {
      let newBlock = document.createElement("li");
      newLink.textContent = `${item} (Hops: ${data.hops})`;

      newBlock.appendChild(newLink);
      newBlock.appendChild(document.createElement("br"));

      data.txIds.forEach(txid => {
        let linkForTransaction = document.createElement("a");
        linkForTransaction.href = "https://mempool.space/de/tx/" + txid;
        linkForTransaction.target = "_blank";
        linkForTransaction.textContent = `TxID: ${txid}`;
        newBlock.appendChild(linkForTransaction);
        newBlock.appendChild(document.createElement("br"));
      });

      sumSanctionAdresses++;
      document.getElementById("sanctionList").appendChild(newBlock);
    } else {
      newLink.textContent = `${item} (Hops: ${data.hops})`;
      newListItem.appendChild(newLink);
      sumAdresses++;
      document.getElementById("adressList").appendChild(newListItem);
    }
  });

  document.getElementById("totalAdresses").textContent = sumAdresses;
  document.getElementById("totalSanctionAdresses").textContent = sumSanctionAdresses;

  if (sumSanctionAdresses !== 0) {
    document.getElementById("totalSanctionAdresses").style.color = "red";
  }
};

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
    addErrorToList(error)
    return null;
  }
};

const startCheck = () => {
  stopRequested = false;
  startedRequests = 0;
  finishedRequests = 0;
  document.getElementById("startedRequests").textContent = "0";
  document.getElementById("finishedRequests").textContent = "0";
  document.getElementById("openRequests").textContent = "0";
  document.getElementById("adressList").innerHTML = "";
  document.getElementById("sanctionList").innerHTML = "";
  document.getElementById("error").innerHTML = "";
  adressResultSet = new Map();
  let transactionID = document.getElementById("transactionID").value;
  maxHops = parseInt(document.getElementById("recursion").value, 10);
  checkTransaction(transactionID, maxHops);
};

const updateEndpoint = () => {
  mempoolApiUrl = document.getElementById("endpoint").value;
  document.getElementById("endpointInfo").textContent = mempoolApiUrl;
};

const resetEndpoint = () => {
  mempoolApiUrl = "https://mempool.space/api/tx/";
  document.getElementById("endpointInfo").textContent = mempoolApiUrl;
  document.getElementById("endpoint").value = "";
};

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
};

const stopCheck = () => {
  stopRequested = true;
};

const adjustMarginBottom = () => {
  const footerHeight = document.querySelector('footer').offsetHeight + 16;
  const resultBox = document.querySelector('.resultBox');
  resultBox.style.marginBottom = `${footerHeight}px`;
};

window.addEventListener('load', adjustMarginBottom);
window.addEventListener('resize', adjustMarginBottom);
document.getElementById("inputBox").addEventListener("submit", (event) => {
  event.preventDefault();
  startCheck();
});
document.getElementById("stopRequest").addEventListener("click", stopCheck);
document.getElementById("resetList").addEventListener("click", resetChecker);
document.getElementById("setEndpoint").addEventListener("click", updateEndpoint);
document.getElementById("resetEndpoint").addEventListener("click", resetEndpoint);
document.getElementById("copyAdress").addEventListener("click", copyBitcoinAddress);
document.getElementById("endpointInfo").textContent = mempoolApiUrl;
