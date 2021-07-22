var Migrations = artifacts.require("./Migrations.sol");
var UMCC = artifacts.require("./UMCC.sol");
module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(UMCC);
};
