const Web3 = require('web3');
const fs = require("fs");
const solc = require('solc');

const args = process.argv;
var host = "http://localhost:8545",validation = false;
var directory = undefined;
var file = undefined;
contracts = [];
var source = {};
//get all the arguments

for (var i=2; i<args.length ; i++) {
	var temp = args[i].split("=");
	switch (temp[0]) {
		case "host":
			host = temp[1];
			break;
		case "dir":
			if(fs.lstatSync(temp[1]).isDirectory()){
				directory = temp[1];
				break;
			}
			throw "Path provided is not a directory";
		case "file":
			if(fs.lstatSync(temp[1]).isFile()){
				file = temp[1];
				break;
			}
			throw "File doesn't exist";
		case "contracts":
			var con = temp[1].split(",");
			contracts = con;
			if (con[0].toUpperCase() == "ALL"){
				contracts="*";
			}
			break;
		default:
			throw "command should be of form :\n node deploy.js host=<host> file=<file> contracts=<c1>,<c2> dir=<dir>";
			break;
	}
}

if(directory){
	var items = fs.readdirSync(directory);
	for (var i=0;i<items.length;i++) {
		var tmp = items[i].split(".");
		if(tmp[tmp.length -1] == "sol"){
			source[items[i]] = fs.readFileSync(directory+"/"+items[i]).toString('utf-8');
		}
	}
}

if(file){
	var f = file.split("/");
	f = f[f.length - 1];
	source[f] = fs.readFileSync(file);
}
//console.log(source);
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const Accountaddress = web3.eth.accounts[0];
web3.eth.defaultAccount = Accountaddress;

const compiled = solc.compile({ sources : source }, 1);
console.log(Accountaddress);
if(contracts == "*"){
	contracts = Object.keys(compiled.contracts);
}

if(compiled.errors){
	console.log("COMPILE ERRORS:\n\n");
	throw JSON.stringify(compiled.errors);
}

for(var i=0;i<contracts.length;i++){
  try {
    abi = JSON.parse(compiled.contracts[contracts[i]+".sol:"+contracts[i]].interface);    
    bytecode = '0x'+compiled.contracts[contracts[i]+".sol:"+contracts[i]].bytecode;
    var newContract = web3.eth.contract(abi);
    newContract.new({
      from:Accountaddress,
      gas:4476786,
      data:bytecode
    },function(err, contract){
      if(err){
        console.log(err);
        console.log("error");
      }else{
        web3.eth.getTransactionReceipt(contract.transactionHash.toString("hex"),function(err, receipt){
          if(err){  
            console.log("--------transaction receipt error----------");        
            console.log(err);
          }else{
            if(receipt){
              console.log("--------transaction receipt for "+contracts[i]+"----------");
              console.log(receipt);
              console.log("----------------------------------------------------------");
            }else{
              console.log("Error: Null receipt received");
            }
          }
        });
      }
    });         
   } catch(e) {
   		console.log("DEPLOY ERROR");
   		throw JSON.stringify(e);
   } 
}