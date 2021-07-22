import EVMRevert from './helpers/EVMRevert';
import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
const testUtil = require('solidity-test-util');
const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const UMCCContract = artifacts.require('UMCC');

var timeLockTokenABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_address",
                "type": "address"
            }
        ],
        "name": "release",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_address",
                "type": "address"
            }
        ],
        "name": "beneficiaryBalance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "releaseTime",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_address",
                "type": "address"
            },
            {
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "setAirDropMember",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "token",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "token",
                "type": "address"
            },
            {
                "name": "releaseTime",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    }
];
var tokenLockContract = web3.eth.contract(timeLockTokenABI);

contract('UMCC', (accounts) => {

    var user = 0x0b984c9d89782e800334Ae8faF79710E379fb1e3;
    var UMCC;
    var unix = Math.round(+new Date()/1000);

    before(async function () {
        await advanceBlock();

        UMCC = await UMCCContract.deployed();
    });

    it('able transfer and freeze tokens', async () => {
        await UMCC.transferFreezeTokens(user, ether(20), unix+(60*1440*10));

        var getContracts = await UMCC.getAllContractsByAddress(user);

        var balance = await UMCC.balanceOf("" + getContracts.toString());
        balance.should.be.bignumber.equal(ether(20));
    });

    it('able get all contracts address of beneficiary', async () => {
        await UMCC.getAllContractsByAddress(user);
    });

    it('able beneficiary balance', async () => {
        var getContracts = await UMCC.getAllContractsByAddress(user);

        var tokenTimeLock = tokenLockContract.at("" + getContracts.toString());

        let balance = await tokenTimeLock.beneficiaryBalance(user);
        balance.should.be.bignumber.equal(ether(20));
    });

    it('able set Bounty budget', async () => {
        await UMCC.setBountyBudget(0x7F4D75977B3fA5b3A58445dc38858f2f33cc0858, ether(100));

        var balance = await UMCC.balanceOf(0x7F4D75977B3fA5b3A58445dc38858f2f33cc0858);
        balance.should.be.bignumber.equal(ether(100));
    });

     it('able create air drop', async () => {
        await UMCC.createAirDrop(unix+(60*1440*10));
     });

     it('able set air drop member', async () => {
         var getContracts = await UMCC.getAllContractsByAddress(UMCC.address);

         await UMCC.setAirDropMember(getContracts, user, ether(10));

         var tokenTimeLock = tokenLockContract.at("" + getContracts.toString());

         var balance = await tokenTimeLock.beneficiaryBalance(user);
         balance.should.be.bignumber.equal(ether(10));
     });


    it('able unlock tokens for airdrop', async () => {
        await testUtil.evmIncreaseTime(60*1440*10);
        await advanceBlock();

        web3.eth.defaultAccount = web3.eth.accounts[0];

        var getContracts = await UMCC.getAllContractsByAddress(UMCC.address);

        var tokenTimeLock = tokenLockContract.at("" + getContracts.toString());

        var releaseTime = await tokenTimeLock.releaseTime();
        releaseTime.should.be.bignumber.equal(unix+(60*1440*10));

        var balance = await tokenTimeLock.beneficiaryBalance(user);
        balance.should.be.bignumber.equal(ether(10));

        balance = await UMCC.balanceOf(getContracts.toString());
        balance.should.be.bignumber.equal(ether(10));

        await tokenTimeLock.release(user);

        balance = await UMCC.balanceOf(getContracts.toString());
        balance.should.be.bignumber.equal(ether(0));

        balance = await UMCC.balanceOf(user);
        balance.should.be.bignumber.equal(ether(10));
    });

    it('able to unlock tokens to transfer tokens to the user', async () => {

        web3.eth.defaultAccount = web3.eth.accounts[0];

        var getContracts = await UMCC.getAllContractsByAddress(user);

        var tokenTimeLock = tokenLockContract.at("" + getContracts[0].toString());

        var releaseTime = await tokenTimeLock.releaseTime();
        releaseTime.should.be.bignumber.equal(unix+(60*1440*10));

        var balance = await tokenTimeLock.beneficiaryBalance(user);
        balance.should.be.bignumber.equal(ether(20));

        await tokenTimeLock.release(user);

        balance = await tokenTimeLock.beneficiaryBalance(user);
        balance.should.be.bignumber.equal(ether(0));

        balance = await UMCC.balanceOf(user);
        balance.should.be.bignumber.equal(ether(30));
    });

    it('able transfer tokens to the user', async () => {
        await UMCC.transfer(user, ether(10));

        var balance = await UMCC.balanceOf(user);
        balance.should.be.bignumber.equal(ether(40));
    });
});