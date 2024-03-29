const { expect } = require('chai');
const { ethers } = require('hardhat');

describe ('MultiSigWallet', function () {
  let owner, addr1, addr2, addr3, addr4, multisigwallet;
  const vote = 2;
  before(async function() {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet", owner);
    multisigwallet = await MultiSigWallet.deploy([addr1.address,addr2.address,addr3.address],vote);
    await multisigwallet.deployed();
  })

  describe('Get network, should be deployed/should have 0 ether by default', () => {
    it("Get network", async function() {
      console.log(await ethers.provider.getNetwork());
    })
    it("Should be deployed", async function() {
      expect(multisigwallet.address).to.be.properAddress;
      console.log('Contract address :', multisigwallet.address);
    })
    it("Should have 0 ether by default", async function() {
      const balance = await ethers.provider.getBalance(multisigwallet.address);
      expect(balance).to.equal(0);
      console.log('Contract balance: ', ethers.utils.formatEther(balance));
    })
  })

  describe ('Checking the correctness of processing require in the constructor', function () {
    it("owners required", async function () {
      const fakeMultiSigWallet = await ethers.getContractFactory("MultiSigWallet", owner);
      await expect(fakeMultiSigWallet.connect(owner).deploy([],vote))
      .to.be.revertedWith('owners required');
    })
    it("invalid number of required confirmations (vote=0)", async function () {
      const fakeMultiSigWallet = await ethers.getContractFactory("MultiSigWallet", owner);
      await expect(fakeMultiSigWallet.connect(owner).deploy([addr1.address,addr2.address,addr3.address],0))
      .to.be.revertedWith('invalid number of required confirmations');
    })
    it("invalid number of required confirmations (vote > number of owners)", async function () {
      const fakeMultiSigWallet = await ethers.getContractFactory("MultiSigWallet", owner);
      await expect(fakeMultiSigWallet.connect(owner).deploy([addr1.address,addr2.address,addr3.address],4))
      .to.be.revertedWith('invalid number of required confirmations');
    })
    it("invalid owner(address(0))", async function () {
      const fakeMultiSigWallet = await ethers.getContractFactory("MultiSigWallet", owner);
      await expect(fakeMultiSigWallet.connect(owner).deploy([addr1.address,ethers.constants.AddressZero,addr3.address],vote))
      .to.be.revertedWith('invalid owner');
    })
    it("owner not unique", async function () {
      const fakeMultiSigWallet = await ethers.getContractFactory("MultiSigWallet", owner);
      await expect(fakeMultiSigWallet.connect(owner).deploy([addr1.address,addr3.address,addr3.address],vote))
      .to.be.revertedWith('owner not unique');
    })
  })

  describe ('Checking the correctness of constructor execution', function () {
    it("Checking whether users are included in the array owners", async function () {
      expect(await multisigwallet.owners(0))
        .to.equal(addr1.address);
      expect(await multisigwallet.owners(1))
        .to.equal(addr2.address);
      expect(await multisigwallet.owners(2))
        .to.equal(addr3.address);
    })
    it("Checking whether users are included in the mapping isOwner", async function() {
      expect(await multisigwallet.isOwner(owner.address))
        .to.equal(false);
      expect(await multisigwallet.isOwner(addr1.address))
        .to.equal(true);
      expect(await multisigwallet.isOwner(addr2.address))
        .to.equal(true);
      expect(await multisigwallet.isOwner(addr3.address))
        .to.equal(true);
      expect(await multisigwallet.isOwner(addr4.address))
        .to.equal(false);
    })
    it("List owners", async function () {
      let list_owners = await multisigwallet.getOwners();
      // console.log('Owners: ', list_owners);
      expect(list_owners[0])
        .to.equal(addr1.address);
      expect(list_owners[1])
        .to.equal(addr2.address);
      expect(list_owners[2])
        .to.equal(addr3.address);
    })
    it("Check the number of votes", async function () {
      const tx  = await multisigwallet.numConfirmationsRequired()
      expect (tx)
        .to.equal(vote);
    })
  })

  async function receive(user, amount){
      /*
        When you want to invoke the receive() function,
        you need to send a transaction to the contract address with empty data field.
        The same way as if you were sending ETH to a non-contract address.
        not defining `data` field will use the default value - empty data

        const transaction = signer.sendTransaction({
          from: accounts[0],
          to: WalletAddress,
          value: amount
        });
      */
    
    const _bal = await ethers.provider.getBalance(multisigwallet.address);

    const tx = await user.sendTransaction({
      from: user.address,
      to: multisigwallet.address,
      value: amount
      });

    const bal = await ethers.provider.getBalance(multisigwallet.address);
    expect (bal)
      .to.equal(_bal.add(amount));

    await expect(() => tx)
      .to.changeEtherBalance(multisigwallet, amount);
    await expect(tx)
      .to.emit(multisigwallet, 'Deposit')
      .withArgs(user.address, amount, ethers.BigNumber.from(await ethers.provider.getBalance(multisigwallet.address)));
  }

  describe('Replenish the balance of the contract from user', () => {
    const amount = ethers.utils.parseEther("0.25");
    it("Replenish the balance of the contract from deployer without the right to vote", async function(){
      await receive(owner, amount);
    })
    it("Replenish the balance of the contract from user1 with the right to vote", async function(){
      await receive(addr1, amount);
    })
    it("Replenish the balance of the contract from user2 with the right to vote", async function(){
      await receive(addr2, amount);
    })
    it("Replenish the balance of the contract from user3 with the right to vote", async function(){
      await receive(addr3, amount);
    })
    it("Replenish the balance of the contract from user4 without the right to vote", async function(){
      await receive(addr4, amount);
    })
  })

  async function transaction(to, value, data) {
    let _dataBytes = ethers.utils.formatBytes32String(data);
    let _txIndex = await multisigwallet.getTransactionCount();

    const tx = await multisigwallet.connect(addr1).submitTransaction(to, value, _dataBytes);

    await expect(tx)
      .to.emit(multisigwallet, 'SubmitTransaction')
      .withArgs(addr1.address, _txIndex, to, value, _dataBytes);
      /*
        Check the correctness of writing data to the stucture Transaction
      */
    const v = await multisigwallet.transactions(_txIndex);
    expect(v.to)
      .to.equal(to);
    expect(v.value)
      .to.equal(value);
    expect(v.data)
      .to.equal(_dataBytes);
    expect(v.executed)
      .to.equal(false);
    expect(v.numConfirmations)
        .to.equal(0);
  }

  describe('Creating voting transactions', () => {
    let _value = ethers.utils.parseEther("0.5");
    it("Creation of the transaction not owner", async function(){
      let _data = 'не совсем понятно на что';
      let _dataBytes = ethers.utils.toUtf8Bytes(_data);
      await expect(multisigwallet.connect(owner).submitTransaction(owner.address, _value, _dataBytes))
        .to.be.revertedWith("not owner");
    })
    it("Creation of the first transaction for voting by the owner", async function () {
      await transaction(owner.address, _value, 'on available girls');
    })
    it("Creation of the second transaction for voting by the owner", async function () {
      await transaction(owner.address, _value, 'for beer');
    })
    it("Creation of the third transaction for voting by the owner", async function () {
      await transaction(owner.address, _value, 'on unavailable girls');
    })
  })

  async function confirmtransaction(user, _txIndex) {
    const _v = await multisigwallet.transactions(_txIndex);
    const _w = await multisigwallet.isConfirmed(_txIndex,user.address);
    const tx = await multisigwallet.connect(user).confirmTransaction(_txIndex);
    const v = await multisigwallet.transactions(_txIndex);
    expect(v.numConfirmations)
      .to.equal(_v.numConfirmations.add(1));
    expect(await multisigwallet.isConfirmed(_txIndex,user.address))
      .to.equals(true);
    await expect(tx)
      .to.emit(multisigwallet, 'ConfirmTransaction')
      .withArgs(user.address, _txIndex);
  }

  describe('Transaction confirmation', () => {
    describe('Confirmation of the first transaction by the owner', () => {
      let _txIndex = 0;
      it("Confirmation by the first owner", async function () {
        await confirmtransaction(addr1, _txIndex);
      })
      it("Confirmation by the second owner", async function () {
        await confirmtransaction(addr2, _txIndex);
      })
      it("Confirmation by the third owner", async function () {
        await confirmtransaction(addr3, _txIndex);
      })
    })
    describe('Confirmation of the second transaction by the owner', () => {
      let _txIndex = 1;
      it("Confirmation by the first owner", async function () {
        await confirmtransaction(addr1, _txIndex);
      })
      it("Confirmation by the second owner", async function () {
        await confirmtransaction(addr2, _txIndex);
      })
      it("Confirmation by the third owner", async function () {
        await confirmtransaction(addr3, _txIndex);
      })
    })
    describe('Confirmation of the third transaction by the owner', () => {
      let _txIndex = 2;
      it("Confirmation by the first owner", async function () {
        await confirmtransaction(addr1, _txIndex);
      })
      it("Confirmation by the second owner", async function () {
        await confirmtransaction(addr2, _txIndex);
      })
      it("Confirmation by the third owner", async function () {
        await confirmtransaction(addr3, _txIndex);
      })
    })
  })

  async function revokeconfirmation(user, _txIndex) {
    const _v = await multisigwallet.transactions(_txIndex);
    const tx = await multisigwallet.connect(user).revokeConfirmation(_txIndex);
    const v = await multisigwallet.transactions(_txIndex);
    expect(v.numConfirmations)
      .to.equal(_v.numConfirmations.sub(1));
    expect(await multisigwallet.isConfirmed(_txIndex,user.address))
      .to.equals(false);
    await expect(tx)
      .to.emit(multisigwallet, 'RevokeConfirmation')
      .withArgs(user.address, _txIndex);
  }
  
  describe('The abolition of transaction confirmation', () => {
    describe('The abolition of the first transaction by the owner', () => {
      let _txIndex = 0;
      it("The abolition of the first transaction by the first owner", async function () {
        await revokeconfirmation(addr1, _txIndex);
      })
      // it("The abolition of the first transaction by the second owner", async function () {
      //   await revokeconfirmation(addr2, _txIndex);
      // })
      // it("The abolition of the first transaction by the third owner", async function () {
      //   await revokeconfirmation(addr3, _txIndex);
      // })
    })
    describe('The abolition of the second transaction by the owner', () => {
      let _txIndex = 1;
      // it("The abolition of the second transaction by the first owner", async function () {
      //   await revokeconfirmation(addr1, _txIndex);
      // })
      // it("The abolition of the second transaction by the second owner", async function () {
      //   await revokeconfirmation(addr2, _txIndex);
      // })
      it("The abolition of the second transaction by the third owner", async function () {
        await revokeconfirmation(addr3, _txIndex);
      })
    })
    describe('The abolition of the third transaction by the owner', () => {
      let _txIndex = 2;
      it("The abolition of of the third transaction by the first owner", async function () {
        await revokeconfirmation(addr1, _txIndex);
      })
      // it("The abolition of of the third transaction by the second owner", async function () {
      //   await revokeconfirmation(addr2, _txIndex);
      // })
      it("The abolition of of the third transaction by the third owner", async function () {
        await revokeconfirmation(addr3, _txIndex);
      })
      it("The abolition of of the third transaction by the third owner again", async function () {
        await expect(multisigwallet.connect(addr3).revokeConfirmation(_txIndex))
          .to.be.revertedWith('tx not confirmed');
      })
    })
  })

  async function executetransaction(user, _txIndex) {
    const _v = await multisigwallet.transactions(_txIndex);
    const tx = await multisigwallet.connect(user).executeTransaction(_txIndex);
    const v = await multisigwallet.transactions(_txIndex);

    expect(v.executed)
      .to.equal(true);
    await expect (() => tx)
      .to.changeEtherBalance(_v.to, _v.value);
    await expect(tx)
      .to.emit(multisigwallet, 'ExecuteTransaction')
      .withArgs(user.address, _txIndex);
  }

  describe('Perform a confirmed transaction', () => {
    it("Perform the first transaction", async function (){
      let _txIndex = 0;
      await executetransaction(addr1, _txIndex);
    })
    it("Perform the second transaction", async function (){
      let _txIndex = 1;
      await executetransaction(addr1, _txIndex);
    })
    it("transaction with insufficient votes/third transaction", async function (){
      await expect(multisigwallet.connect(addr1).executeTransaction(2))
        .to.be.revertedWith("cannot execute tx");
    })
  })

  describe('Checking the work of modifiers', () => {
    it("modifiers *onlyOwner* not owner", async function(){
      let _value = ethers.utils.parseEther("0.0025");
      let _data = ethers.utils.toUtf8Bytes('не совсем понятно на что');
      const _to = owner.address;
      await expect(multisigwallet.connect(owner).submitTransaction(_to, _value, _data))
        .to.be.revertedWith("not owner");
    })
    it("modifier txExists/tx does not exist", async function(){
      let _txIndex = 5;
      await expect(multisigwallet.connect(addr1).confirmTransaction(_txIndex))
        .to.be.revertedWith("tx does not exist");
    })
    it("modifier notExecuted/tx already executed", async function(){
      let _txIndex = 0;
      await expect(multisigwallet.connect(addr1).executeTransaction(_txIndex))
        .to.be.revertedWith("tx already executed");
    })
    it("modifier notConfirmed/tx already confirmed", async function(){
      let _txIndex = 2;
      await expect(multisigwallet.connect(addr2).confirmTransaction(_txIndex))
        .to.be.revertedWith("tx already confirmed");
    })
  })
  
  describe('Secondary functions', () => {
    it("Function getOwners", async function(){
      const z = await multisigwallet.connect(owner).getOwners();
      expect(z[0])
        .to.equal(addr1.address);
      expect(z[1])
        .to.equal(addr2.address);
      expect(z[2])
        .to.equal(addr3.address);
    })
    it("Function getTransactionCount", async function(){
      const c = await multisigwallet.connect(owner).getTransactionCount();
      expect(c)
        .to.equal(3);
    })
    it("Function getTransaction", async function(){
      let txIndex = 2;
      const t = await multisigwallet.connect(owner).getTransaction(txIndex);
      expect(t.to)
        .to.equal(owner.address);
      expect(t.value)
        .to.equal(ethers.utils.parseEther("0.5"));
      expect(t.data)
        .to.equal(ethers.utils.formatBytes32String('on unavailable girls'));
      expect(t.executed)
        .to.equal(false);
      expect(t.numConfirmations)
        .to.equal(1);
    })
  })

})