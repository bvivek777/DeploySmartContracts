var Web3 = require('web3');
const fs = require("fs");
const solc = require('solc');

var web3,
    Accountaddress,
    host = "",
    address = "",
    file = "../contracts/contract.sol",
    contractName = "",
    all = false;

var args = process.argv;

/*
    Get options from the command line
    default options are
    1) fileName with path
    2) host to which web3 connects
    3) contract Name
*/
if(args.length > 2){
  for(var i=2;i<args.length;i++){
    var temp = args[i].split("=");
    if(temp.length != 2){
      console.log("incorrect format");
    }else{
      switch (temp[0]) {
        case 'host':
          console.log("custom host provided ... ");
          web3 = new Web3(new Web3.providers.HttpProvider(temp[1]));
          Accountaddress = web3.eth.accounts[0];
          web3.eth,defaultAccount = Accountaddress;
          break;
        case 'file':
            console.log('read from contract file');
            file = temp[1];
          break;
        case 'contract':
          console.log('contract Name specified .. ');
          contractName = temp[1];
          break;
        case 'all':
          all = true;
          console.log("deploy all contracts in file");
          break;
        default:
          console.log("usage: node <jsfile> host=? contract=? file=?");
          break;
      }
    }
  }
}else{
  throw "node <jsfile> host=<host> contract=<contractName> file=<filePath>";
}
if(!web3){
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  Accountaddress = web3.eth.accounts[0];
  web3.eth.defaultAccount = Accountaddress;
}

var deployCallback = function(err, contract){
  if(err){
    console.log(err);
    console.log("error");
  }else{
    console.log('TX HASH: Received');
    web3.eth.getTransactionReceipt(contract.transactionHash,function(err, receipt){
      if(err){  
        console.log("--------transaction receipt error----------");        
        console.log(err);
      }else{
        if(receipt){
          console.log("--------transaction receipt----------");
          console.log(receipt);
          console.log("-------------------------------------");
        }else{
          console.log("Error: Null receipt received");
        }
      }
    });
  }
}

/*
    check if the file exists before reading it
*/
if(fs.existsSync(file)){
  //console.log("hi");
  fs.readFile(file,function (err,result) {
    if(err){
      throw err;
    }else{
      //compile the souce code for the contract
      console.log("Compiling...");
      var source = result.toString();
      var output = solc.compile(source,1);
      var abi,byteCode,contracts = [];
      if(all){
        // deploy all the contracts in the file
        contracts = Object.keys(output.contracts);
      }else {
        // deploy a particular contract specified in the argument
        contracts.push(contractName);
      }
      // deploy the contracts
      for(var i=0;i<contracts.length;i++){
        try {
          abi = JSON.parse(output.contracts[":"+contracts[i]].interface);    
          bytecode = '0x'+output.contracts[":"+contracts[i]].bytecode;
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
           console.log(e);
           //throw JSON.stringify(output);
         } 
      }
    }
  });
}else{
  console.log("file doesn't exist");
  throw "File doesn't exist";
}