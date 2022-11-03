const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");


describe("Sign and Broadcast Raw Transactions", function () {

    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployERC20Mock() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const ERC20 = await ethers.getContractFactory("ERC20Mock");
        const name = symbol = "WETH";
        const erc20 = await ERC20.deploy(name, symbol, owner.address, ethers.utils.parseEther("100.0"));

        return { erc20, owner, otherAccount };
    }

    describe("ETH transfer transactions", function () {

        it("Should create a signer and send eth from it to a recipient address", async function () {
            const { erc20, owner, otherAccount } = await loadFixture(deployERC20Mock);

            expect(owner.address).to.not.equal(ethers.constants.addressZero);
            let ownerBalance = await owner.getBalance();

            // Create a wallet instance from a mnemonic...
            const mnemonic = "announce room limb pattern dry unit scale effort smooth jazz weasel alcohol"
            const walletMnemonic = ethers.Wallet.fromMnemonic(mnemonic)

            // ...or from a private key
            const walletPrivateKey = new ethers.Wallet(walletMnemonic.privateKey)

            expect(walletMnemonic.address === walletPrivateKey.address).to.equal(true);
            // true

            // The address as a Promise per the Signer API
            let walletAddress = await walletMnemonic.getAddress();
            // '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1'

            // A Wallet address is also available synchronously
            walletAddress = walletMnemonic.address;
            // '0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1'

            // The internal cryptographic components
            const privateKey = walletMnemonic.privateKey
            // '0x1da6847600b0ee25e9ad9a52abbd786dd2502fa4005dd5af9310b7cc7a3b25db'
            const publicKey = walletMnemonic.publicKey
            // '0x04b9e72dfd423bcf95b3801ac93f4392be5ff22143f9980e

            // send ETH to the created wallet address
            // Ether amount to send
            // Convert currency unit from ether to wei
            let amountInEther = ethers.utils.parseEther('2.0');
            // Create a transaction object
            let receiverAddress = walletAddress;
            let tx = {
                to: receiverAddress,
                value: amountInEther
            }

            expect(await ethers.provider.getBalance(receiverAddress)).to.be.equal(0);

            // Send a transaction
            let txObj = await otherAccount.sendTransaction(tx);

            expect(await ethers.provider.getBalance(receiverAddress)).to.be.equal(amountInEther);

            tx = {
                to: owner.address,
                value: ethers.utils.parseEther('0.5'),
            };
            // console.log(tx);

            // The connect method returns a new instance of the
            // Wallet connected to a provider
            const wallet = walletMnemonic.connect(ethers.provider)
            // This should return a copy of transactionRequest, follow the same procedure as checkTransaction and fill in any properties required for sending a transaction. The result should have all promises resolved; if needed the resolveProperties utility function can be used for this.
            // The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
            tx = await wallet.populateTransaction(tx);
            // console.log(tx);

            // Signing a transaction
            let signedTx = await walletMnemonic.signTransaction(tx);
            
            let txData = await ethers.provider.sendTransaction(signedTx);
            // console.log(txData);

            expect(await owner.getBalance()).to.be.equal(ownerBalance.add(ethers.utils.parseEther('0.5')));
            expect(parseFloat(ethers.utils.formatEther(await wallet.getBalance()))).to.be.lessThanOrEqual(1.5);
        });

    });

    describe("Smart contract transactions", function () {

    });

});