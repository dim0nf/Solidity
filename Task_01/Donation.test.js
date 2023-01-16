const { expect } = require("chai")
const { ethers } = require("hardhat")

describe ("Donation", function () {
  let acc1
  let acc2
  let acc3    
  let acc4
  let acc5
  let donation

  beforeEach(async function() {
    [acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners()
    const Donation = await ethers.getContractFactory("Donation", acc1)
    donation = await Donation.deploy()
    await donation.deployed()
  })

  it("should be deployed", async function() {
    expect(donation.address).to.be.properAddress
    console.log(donation.address.toString())
  })

  it("should have 0 ether by default", async function() {
    const balance = await donation.getBalance()
    expect(balance).to.eq(0)
    // console.log(balance.toString())
  })

  it("should have 0 by address array default", async function() {
    const length = await donation.getLength()
    expect(length).to.eq(0)
    // console.log(length.toString())
  })
 
  it("should be possible to send funds", async function() {
    const sum = 100
    const tx1 = await donation.connect(acc3).acceptanceDonation({ value: sum })

    await expect(() => tx1)
      .to.changeEtherBalances([acc3, donation], [-sum, sum]);
    
    const length1 = await donation.getLength()
    expect(length1).to.eq(1)

    // await tx1.wait()
    // console.log(length1.toString())

    const tx2 = await donation.connect(acc4).acceptanceDonation({ value: sum })

    await expect(() => tx2)
      .to.changeEtherBalances([acc4, donation], [-sum, sum]);

    const length2 = await donation.getLength()
    expect(length2).to.eq(2)

    // await tx2.wait()
    // console.log(length2.toString())
  
    const tx3 = await donation.connect(acc5).acceptanceDonation({ value: sum })

    await expect(() => tx3)
      .to.changeEtherBalances([acc5, donation], [-sum, sum]);
  
    const length3 = await donation.getLength()
    expect(length3).to.eq(3)

    // await tx3.wait()
    // console.log(length3.toString())

    const tx4 = await donation.connect(acc3).acceptanceDonation({ value: sum })

    await expect(() => tx4)
      .to.changeEtherBalances([acc3, donation], [-sum, sum]);
    
    const length4 = await donation.getLength()
    expect(length4).to.eq(3)

    // await tx4.wait()
    // console.log(length4.toString())

    const tx5 = await donation.connect(acc4).acceptanceDonation({ value: sum })

    await expect(() => tx5)
      .to.changeEtherBalances([acc4, donation], [-sum, sum]);
    
    const length5 = await donation.getLength()
    expect(length5).to.eq(3)

    // await tx5.wait()
    // console.log(length5.toString())

    const tx6 = await donation.connect(acc5).acceptanceDonation({ value: sum })

    await expect(() => tx6)
      .to.changeEtherBalances([acc5, donation], [-sum, sum]);
    
    const length6 = await donation.getLength()
    expect(length6).to.eq(3)

    // await tx6.wait()
    // console.log(length6.toString())

  })

  it("withdrawal of funds by the owner", async function() {
    const sum = 500
    await donation.connect(acc3).acceptanceDonation({ value: sum })
    const tx = await donation.connect(acc1).withdraw({ })

    await expect(() => tx)
      .to.changeEtherBalances([acc2, donation], [sum, -sum]);

    await tx.wait()

  })

  it("shound not allow other accounts to withdraw funds", async function() {
    await expect(
      donation.connect(acc3).withdraw({ })
    ).to.be.revertedWith("you are not an owner!")

  })

})
