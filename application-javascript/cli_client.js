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

            ////////////////////////////
            try {
                let result = await contract.evaluateTransaction(
                    'CreateUser',
                    'user_nas1@gmail.com',
                    'nas1@gmail.com',
                    'nas12345',
                    'N A Sifat'
                );
                await contract.submitTransaction('CreateUser', 'user_nas1@gmail.com', 'nas1@gmail.com', 'nas12345', 'Nas');
                console.log(`Create user successfully\n, ${result}`);
            } catch (error) {
                console.log(`*** Successfully caught the error: \n    ${error}`);
            }
            /////////////
            // try {
            //     let result = await contract.evaluateTransaction('CreateUser', 'user_jam@gmail.com', 'jam@gmail.com', 'jam12345', 'jam');
            //     await contract.submitTransaction('CreateUser', 'user_jam@gmail.com', 'jam@gmail.com', 'jam12345', 'jam');
            //     console.log(`Create user successfully\n, ${result}`);
            // } catch (error) {
            //     console.log(`*** Successfully caught the error: \n    ${error}`);
            // }

            try {
                let result = await contract.evaluateTransaction(
                    'FindUser',
                    'nas1@gmail.com',
                    'nas12345',
                );
                console.log(`User found\n,     ${result}\n`);
            } catch (error) {
                console.log(`*** Successfully caught the error: \n\n    ${error}`);
            }


            // try {
            //     let result = await contract.evaluateTransaction('CreateFile', 'file_letter.txt_hash567', 'letter.txt', '/files/letter.txt', 'hash567', "nas@gmail.com");
            //     await contract.submitTransaction('CreateFile', 'file_letter.txt_hash567', 'letter.txt', '/files/letter.txt', 'hash567', "nas@gmail.com");
            //     console.log(`Create File successfully---\n\n, ${result}`);
            // } catch (error) {
            //     console.log(`*** Successfully caught the error: \n    ${error}`);
            // }
            //
            // try {
            //     let result = await contract.evaluateTransaction('CreateFile', 'file_letter.txt_hash8910', 'letter8910.txt', '/files/letter8910.txt', 'hash8910', "nas@gmail.com");
            //     await contract.submitTransaction('CreateFile', 'file_letter.txt_hash8910', 'letter8910.txt', '/files/letter8910.txt', 'hash8910', "nas@gmail.com");
            //     console.log(`Create File successfully---\n\n, ${result}`);
            // } catch (error) {
            //     console.log(`*** Successfully caught the error: \n    ${error}`);
            // }
            //
            // try {
            //     let result = await contract.evaluateTransaction('FindFile', 'file_letter.txt_hash8910');
            //     console.log(`Found file\n\n, ${result}`);
            // } catch (error) {
            //     console.log(`*** Successfully caught the error: \n    ${error}`);
            // }
            //
            // try {
            //     let result = await contract.submitTransaction('ChangeFileName', 'file_cert.txt_hash123', 'cert_new.txt');
            //     console.log(`Change File successfully\n\n, ${result}`);
            // } catch (error) {
            //     console.log(`*** Successfully caught the error: \n    ${error}`);
            // }

            //  try {
            //     await contract.submitTransaction('DeleteFile', 'file_cert.txt_hash123');
            //     console.log(`Delete File successfully\n\n, ${result}`);
            // } catch (error) {
            //     console.log(`*** Successfully caught the error: \n    ${error}`);
            // }
            // {
//    "selector": {
//       "UploaderEmail": "nas@gmail.com",
//       "DocType": "file"
//    }
// }
//             try {
//                 const email = "nas@gmail.com"
//                 let result = await contract.evaluateTransaction('FindFileByUser', email);
//                 console.log(`Found file for EMAIL: ${email}\n\n, ${result}`);
//             } catch (error) {
//                 console.log(`*** Successfully caught the error: \n    ${error}`);
//             }
//
//
//             try {
//                 const email = 'jam@gmail.com'
//                 let result = await contract.evaluateTransaction('ShareFile', 'fileShare_letter.txt_hash567', 'file_letter.txt_hash567', email);
//                 await contract.submitTransaction('ShareFile', 'fileShare_letter.txt_hash567', 'file_letter.txt_hash567', email);
//                 console.log(`File share with Email: ${email} successfully\n\n, ${result}`);
//             } catch (error) {
//                 console.log(`*** Successfully caught the error: \n    ${error}`);
//             }
//
//             try {
//                 const email = 'jam@gmail.com'
//                 let result = await contract.evaluateTransaction('ShareFile', 'fileShare_file_letter.txt_hash8910', 'file_letter.txt_hash8910', email);
//                 await contract.submitTransaction('ShareFile', 'fileShare_file_letter.txt_hash8910', 'file_letter.txt_hash8910', email);
//                 console.log(`File share with Email: ${email} successfully\n\n, ${result}`);
//             } catch (error) {
//                 console.log(`*** Successfully caught the error: \n    ${error}`);
//             }
//
//             try {
//                 let result = await contract.evaluateTransaction('DeleteFileShare', 'fileShare_file_letter.txt_hash8910');
//                 await contract.submitTransaction('DeleteFileShare', 'fileShare_file_letter.txt_hash8910');
//                 console.log(`Delete share successfully\n\n, ${result}`);
//             } catch (error) {
//                 console.log(`*** Successfully caught the error: \n    ${error}`);
//             }
//
//             try {
//                 const email = 'jam@gmail.com'
//                 let result = await contract.evaluateTransaction('FindFileShareByUser', email);
//                 console.log(`Found file Share by User email: ${email} \n\n, ${result}`);
//             } catch (error) {
//                 console.log(`*** Successfully caught the error: \n    ${error}`);
//             }


        } finally {
            gateway.disconnect();
        }
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);
    }
}

main();
