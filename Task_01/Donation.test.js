const { expect } = require('chai');
const { ethers } = require('hardhat');

describe ("Donation", function () {
  let owner, acc1, acc2, acc3, donate
  before(async function() {
    [owner, acc1, acc2, acc3] = await ethers.getSigners()
    const Donate = await ethers.getContractFactory("Donation", owner)
    donate = await Donate.deploy()
    await donate.deployed()
  })
  describe('Should be deployed/should have 0 ether by default', () => {
    it("Should be deployed", async function() {
      expect(donate.address).to.be.properAddress
      console.log('Contract address :', donate.address)
    })
    it("Should have 0 ether by default", async function() {
      const balance = await ethers.provider.getBalance(donate.address)
        expect(balance).to.equal(0)
      console.log('Contract balance : ',balance)
    })
  })
  async function receive(user, amount){
    const user_balance = ethers.BigNumber.from(await donate.payments(user.address))
    const tx = await donate.connect(user).acceptDonation({ value: amount})
    expect(() => tx)
      .to.changeEtherBalance([user, donate], [-amount, amount])
    expect(await donate.payments(user.address))
      .to.equal(user_balance.add(amount))
    await expect(tx)
      .to.emit(donate, 'Donation')
      .withArgs(user.address, amount)
  }
  describe ('Test reception of funds', () => {
    const summ = ethers.utils.parseEther("11.0")
    it("It should not be possible to get 0 funds", async function() {
      await expect(donate.connect(acc1).acceptDonation({ value: ethers.utils.parseEther("0") }))
        .to.be.revertedWith("zero value");
    })
    it("Reception of funds from the user1", async function() {
      await receive(acc1, summ)
    })
    it("Reception of funds from the user2", async function() {
      await receive(acc2, summ)
    })
    it("Reception of funds from the user1 again", async function() {
      await receive(acc1, summ)
    })
    it("Reception of funds from the user2 again", async function() {
      await receive(acc2, summ)
    })
  })
  async function withdraw(user, amount){
    let _user = user, _amount = amount;
    if (amount == ethers.constants.Zero) _amount = await ethers.provider.getBalance(donate.address);
    if (amount.gt(ethers.BigNumber.from((await ethers.provider.getBalance(donate.address)))))
      _amount = ethers.BigNumber.from((await ethers.provider.getBalance(donate.address)))
    if (user == ethers.constants.AddressZero) _user = owner.address;
    const tx = await donate.connect(owner).withdraw(user, amount);
    expect(() => tx)
      .to.changeEtherBalance([_user, donate], [_amount, -_amount])
    await expect (tx)
      .to.emit(donate, 'Withdrawall')
      .withArgs(_user, _amount)
    }
    describe ('Test withdraw owner', () => {
    const summ = ethers.utils.parseEther("2.0")
    it("Withdraw not owner", async function(){
      await expect(donate.connect(acc1).withdraw(acc3.address, summ))
        .to.be.revertedWith("you are not an owner!")
    })
    it("Withdraw funds to user1", async function() {
      await withdraw(acc1.address, summ)
    })
    it("Withdraw funds to user2", async function() {
      await withdraw(acc2.address, summ)
    })
    it("Withdraw funds to AddressZero address", async function() {
      await withdraw(ethers.constants.AddressZero, summ)
    })
    it("Withdraw 0 funds to user1", async function() {
      await receive(acc3, summ)
      await withdraw(acc1.address, ethers.constants.Zero)
    })
    it("Withdraw 0 funds to AddressZero address", async function() {
      await donate.connect(owner).acceptDonation({value: summ})
      await withdraw(ethers.constants.AddressZero, ethers.constants.Zero)
    })
    it("Withdraw funds > balance contract", async function() {
      await donate.connect(owner).acceptDonation({ value: summ })
      await withdraw(acc1.address, summ.add(summ))
    })
  })
  async function members(user, amount){
    let _amount = ethers.BigNumber.from(amount);
    let user_balance = ethers.BigNumber.from(await donate.payments(user.address));
    let balance_contract = ethers.BigNumber.from((await ethers.provider.getBalance(donate.address)));
    if( _amount.gt(user_balance) ) _amount = user_balance;
    if(_amount.gt(balance_contract)) _amount = balance_contract;
    const tx = await donate.connect(user).withdrawMembers(amount);
    expect(() => tx)
      .to.changeEtherBalance([user, donate],[_amount, -_amount]);
    expect(await donate.payments(user.address))
      .to.equal(user_balance.sub(_amount));
    await expect (tx)
      .to.emit(donate, 'WithdrawMembers')
      .withArgs(user.address, _amount);
  }
  describe ('Withdraw user', () => {
    const amount = ethers.BigNumber.from("15000000000000000000");
    it("Withdraw from user1 from 0 balance contract", async function(){
      await expect(donate.connect(acc1).withdrawMembers(amount))
        .to.be.revertedWith("contact zero balance");
    })
    it("Withdraw from user1", async function(){
      await donate.connect(owner).acceptDonation({value: ethers.BigNumber.from("20000000000000000000")})
      await members(acc1, amount)
    })
    it('Withdraw from user1 again', async function() {
      await members(acc1, amount)
    })
    it("Withdraw from user2", async function(){
      await donate.connect(owner).acceptDonation({value: ethers.BigNumber.from("24000000000000000000")})
      await members(acc2, amount);
    })
    it("Withdraw from user2 again", async function(){
      await members(acc2, amount);
    })
  })
})
