import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract, Signer } from "ethers";

describe("CustomTokenUpgradeable Contract", function () {
  let customToken: Contract;
  let owner: Signer, minter1: Signer, minter2: Signer, nonMinter: Signer;
  let ownerAddress: string, minter1Address: string, minter2Address: string, nonMinterAddress: string;

  const NAME = "Custom Token";
  const SYMBOL = "CTK";
  const CAP = ethers.parseEther("1000000"); // 1 million tokens

  before(async () => {
    // Get signers
    [owner, minter1, minter2, nonMinter] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    minter1Address = await minter1.getAddress();
    minter2Address = await minter2.getAddress();
    nonMinterAddress = await nonMinter.getAddress();
  });

  beforeEach(async () => {
    // Deploy the CustomToken contract
    const CustomToken = await ethers.getContractFactory("CustomTokenUpgradeable");
    customToken = await upgrades.deployProxy(
      CustomToken,
      [NAME, SYMBOL, CAP, ownerAddress, [minter1Address, minter2Address]],
      { initializer: "initialize" }
    );
    //await customToken.waitForDeployment();
  });

  it("should deploy with the correct name, symbol, and cap", async () => {
    expect(await customToken.name()).to.equal(NAME);
    expect(await customToken.symbol()).to.equal(SYMBOL);
    expect(await customToken.supplyCap()).to.equal(CAP);
  });

  it("should grant the default admin role to the owner", async () => {
    const DEFAULT_ADMIN_ROLE = await customToken.DEFAULT_ADMIN_ROLE();
    expect(await customToken.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress)).to.be.true;
  });

  it("should grant the MINTER_ROLE to the specified minters", async () => {
    const MINTER_ROLE = await customToken.MINTER_ROLE();
    expect(await customToken.hasRole(MINTER_ROLE, minter1Address)).to.be.true;
    expect(await customToken.hasRole(MINTER_ROLE, minter2Address)).to.be.true;
  });

  it("should allow a minter to mint tokens", async () => {
    const amount = ethers.parseEther("500");

    // Mint tokens as minter1
    await customToken.connect(minter1).mint(nonMinterAddress, amount);

    // Check balance of nonMinter
    expect(await customToken.balanceOf(nonMinterAddress)).to.equal(amount);

    // Check total supply
    expect(await customToken.totalSupply()).to.equal(amount);
  });

  it("should prevent non-minters from minting tokens", async () => {
    const amount = ethers.parseEther("500");

    // Attempt to mint tokens as a non-minter
    await expect(
        customToken.connect(nonMinter).mint(nonMinterAddress, amount)
    ).to.be.reverted;
  });

  it("should prevent minting tokens beyond the cap", async () => {
    const maxAmount = CAP;
    const excessAmount = ethers.parseEther("1");

    // Mint up to the cap
    await customToken.connect(minter1).mint(nonMinterAddress, maxAmount);

    // Attempt to mint more tokens beyond the cap
    await expect(customToken.connect(minter1).mint(nonMinterAddress, excessAmount)).to.be.revertedWith(
      "ERC20: cap exceeded"
    );
  });

  it("should allow token holders to burn their tokens", async () => {
    const mintAmount = ethers.parseEther("500");
    const burnAmount = ethers.parseEther("300");

    // Mint tokens to nonMinter
    await customToken.connect(minter1).mint(nonMinterAddress, mintAmount);

    // Burn tokens as nonMinter
    await customToken.connect(nonMinter).burn(burnAmount);

    // Check remaining balance
    expect(await customToken.balanceOf(nonMinterAddress)).to.equal(mintAmount - burnAmount);

    // Check total supply
    expect(await customToken.totalSupply()).to.equal(mintAmount - burnAmount);
  });

  it("should prevent non-admins from granting roles", async () => {
    const MINTER_ROLE = await customToken.MINTER_ROLE();

    // Attempt to grant MINTER_ROLE as a non-admin
    await expect(
      customToken.connect(nonMinter).grantRole(MINTER_ROLE, nonMinterAddress)
    ).to.be.reverted;
  });

  it("should allow the admin to revoke roles", async () => {
    const MINTER_ROLE = await customToken.MINTER_ROLE();

    // Revoke MINTER_ROLE from minter1
    await customToken.connect(owner).revokeRole(MINTER_ROLE, minter1Address);

    // Check that minter1 no longer has the role
    expect(await customToken.hasRole(MINTER_ROLE, minter1Address)).to.be.false;
  });
});

