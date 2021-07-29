'use strict';

const {Gateway, Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const {buildCAClient, registerAndEnrollUser, enrollAdmin} = require('../../test-application/javascript/CAUtil.js');
const {buildCCPOrg1, buildWallet} = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'drive12';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}


async function main() {
    try {
        const ccp = buildCCPOrg1();
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, walletPath);
        await enrollAdmin(caClient, wallet, mspOrg1);
        await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
        // a user that has been verified.
        const gateway = new Gateway();

        try {
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: {enabled: true, asLocalhost: true} // using asLocalhost as this gateway is using a fabric network deployed locally
            });

            // Build a network instance based on the channel where the smart contract is deployed
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contract = network.getContract(chaincodeName);
            // create server
            ////////////////////////////////

            const express = require('express')
            const cookieParser = require("cookie-parser")
            const app = express()
            const port = 3000
            app.use(cookieParser())
            app.use(express.urlencoded({extended: false}))
            app.use(express.json())

            app.get('/', (req, res) => {
                res.send('Hello World!')
            })
            app.get('/book', (req, res) => {
                res.send('Hello World book response')
            })

            app.post('/register', async function (req, res) {
                const {email, password, name} = req.body
                console.log(email, password, name)
                const key = `user_${email}`;
                try {
                    let result = await contract.evaluateTransaction(
                        'CreateUser',
                        key,
                        email,
                        password,
                        name
                    );
                    await contract.submitTransaction(
                        'CreateUser',
                        key,
                        email,
                        password,
                        name
                    );
                    res.send(result.toString())
                } catch (error) {
                    res.status(400).send(error.toString())
                }
            })
            app.post('/login', async function (req, res) {
                const {email, password} = req.body
                try {
                    let result = await contract.evaluateTransaction('FindUser', email, password);
                    res.cookie('user', result, {maxAge: 3600_000, httpOnly: true})
                    res.send(result.toString())
                } catch (error) {
                    res.status(400).send(error.toString())
                }
            })
            app.get('/logout', async function (req, res) {

                try {
                    res.cookie('user', null, {maxAge: 3600_000, httpOnly: true})
                    res.send("Successfully logout")
                } catch (error) {
                    res.status(400).send(error.toString())
                }
            })

            app.listen(port, () => {
                console.log(`Server listening at http://localhost:${port}`)
            })

            //////////////////////////////////

        } finally {
            // gateway.disconnect();
        }
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);
    }
}

main();
