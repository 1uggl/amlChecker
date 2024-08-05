import { adresses } from "./sanctionLists/ofac.js";

const mempoolApiUrl = "https://mempool.space/api/tx/";
let adressResultSet = new Set();
let rounds = 0;
let recursive;

const checkTransaction = async (transID) => {
  try {
    if (rounds < recursive) {
      rounds++;
      const response = await getVins(transID);
      if (response) {
        for (let vin of response) {
          adressResultSet.add(vin.prevout["scriptpubkey_address"]);
          await checkTransaction(vin.txid);
        }
      }
    } else {
      updateUI();
    }
  } catch (error) {
    document.getElementById("error").innerText = error;
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
    if (adresses.includes(item)) {
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
    document.getElementById("error").innerText = error;
    return null;
  }
}

const startCheck = () => {
  document.getElementById("adressList").innerHTML = "";
  document.getElementById("sanctionList").innerHTML = "";
  document.getElementById("error").innerText = "";
  adressResultSet = new Set();
  rounds = 0;
  let transactionID = document.getElementById("transactionID").value;
  recursive = parseInt(document.getElementById("recursion").value, 10);
  checkTransaction(transactionID);
}

document.getElementById("submit").addEventListener("click", startCheck);

