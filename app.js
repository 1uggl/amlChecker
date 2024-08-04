const mempoolApiUrl = "https://mempool.space/api/tx/";
let adressResultSet = new Set();
let rounds = 0;
let recursive;

const checkTransaction = async (transID) => {
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
		document.getElementById("list").innerHTML = ""; // Clear the list before adding new addresses
		adressResultSet.forEach(item => {
			let newAdress = document.createElement("li");
			newAdress.textContent = item;
			document.getElementById("list").appendChild(newAdress);
		});
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
	}
	catch (error) {
		document.getElementById("error").innerText = error;
		return null;
	}
}

const startCheck = () => {
	document.getElementById("list").innerHTML = "";
	document.getElementById("error").innerText = "";
	adressResultSet = new Set();
	rounds = 0;
	let transactionID = document.getElementById("transactionID").value;
	recursive = parseInt(document.getElementById("recursion").value, 10);
	checkTransaction(transactionID);
}

document.getElementById("submit").addEventListener("click", startCheck);
