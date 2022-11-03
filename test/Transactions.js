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

        it("Should create a new wallet (public+private key pair) and send eth from it to a recipient address", async function () {
            const { erc20, owner, otherAccount } = await loadFixture(deployERC20Mock);

            expect(owner.address).to.not.equal(ethers.constants.addressZero);
            let ownerBalance = await owner.getBalance();

            // https://docs.ethers.io/v5/api/signer/#Signer
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
            // https://docs.ethers.io/v5/api/signer/#Signer-populateTransaction
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
        it("Should create a new wallet (public+private key pair) and send erc20 tokens from it using ERC20 token smart contract to a recipient address", async function () {
            const { erc20, owner, otherAccount } = await loadFixture(deployERC20Mock);

            // https://docs.ethers.io/v5/api/signer/#Signer
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
            let amountInEther = ethers.utils.parseEther('4.0');
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

            // send ERC20 tokens to created wallet address
            await erc20.connect(owner).transfer(walletAddress, amountInEther);

            expect(await erc20.balanceOf(otherAccount.address)).to.be.equal(0);

            // https://docs.ethers.io/v5/api/contract/example/#example-erc-20-contract--connecting-to-a-contract

            // A Human-Readable ABI; for interacting with the contract, we
            // must include any fragment we wish to use
            const abi = [
                // Read-Only Functions
                "function balanceOf(address owner) view returns (uint256)",
                "function decimals() view returns (uint8)",
                "function symbol() view returns (string)",

                // Non Read-Only Functions
                "function transfer(address to, uint amount) returns (bool)",

                // Events
                "event Transfer(address indexed from, address indexed to, uint amount)"
            ];

            // This can be an address or an ENS name
            const contractAddress = erc20.address; // e.g., "0xff04b6fBd9FEcbcac666cc0FFfEed58488c73c7B";

            // Read-Only; By connecting to a Provider, allows:
            // - Any constant function
            // - Querying Filters
            // - Populating Unsigned Transactions for non-constant methods
            // - Estimating Gas for non-constant (as an anonymous sender)
            // - Static Calling non-constant methods (as anonymous sender)
            const erc20_r = new ethers.Contract(contractAddress, abi, ethers.provider);

            // The connect method returns a new instance of the
            // Wallet connected to a provider
            const wallet = walletMnemonic.connect(ethers.provider);

            // Read-Write; By connecting to a Signer, allows:
            // - Everything from Read-Only (except as Signer, not anonymous)
            // - Sending transactions for non-constant functions
            // const erc20_rw = new ethers.Contract(contractAddress, abi, wallet);

            // This should return a copy of transactionRequest, follow the same procedure as checkTransaction and fill in any properties required for sending a transaction. The result should have all promises resolved; if needed the resolveProperties utility function can be used for this.
            // The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
            // https://docs.ethers.io/v5/api/signer/#Signer-populateTransaction

            // populate contract transaction object
            // https://docs.ethers.io/v5/api/contract/contract/#contract-populateTransaction
            // Returns an UnsignedTransaction which could be signed and submitted to the network to transaction amount tokens to target.
            // https://ethereum.stackexchange.com/questions/84561/building-a-raw-contract-transaction-with-ethers-js
            tx = await erc20_r.populateTransaction.transfer(otherAccount.address, ethers.utils.parseEther("1.23"));
            let gasEstimate = await erc20_r.estimateGas.transfer(otherAccount.address, ethers.utils.parseEther("1.23"));
            // console.log('gas estimate', gasEstimate);
            
            // gasLimit
            // The maximum amount of gas this transaction is permitted to use.
            // If left unspecified, ethers will use estimateGas to determine the value to use. For transactions with unpredicatable gas estimates, this may be required to specify explicitly.
            tx.gasLimit = ethers.utils.hexValue(parseInt(gasEstimate.add((gasEstimate.mul(ethers.BigNumber.from(2))).div(ethers.BigNumber.from(10)))));
            
            // gasPrice
            // The price (in wei) per unit of gas this transaction will pay.
            // This may not be specified for transactions with type set to 1 or 2, or if maxFeePerGas or maxPriorityFeePerGas is given.
            tx.gasPrice = ethers.utils.hexValue(595030813);
            // console.log(tx);

            // Signing a transaction
            let signedTx = await walletMnemonic.signTransaction(tx);

            let txData = await ethers.provider.sendTransaction(signedTx);
            // console.log(txData);

            expect(await erc20.balanceOf(otherAccount.address)).to.be.equal(ethers.utils.parseEther("1.23"));
            expect(parseFloat(ethers.utils.formatEther(await erc20.balanceOf(walletAddress)))).to.be.lessThanOrEqual(2.77);

        });

    });

});