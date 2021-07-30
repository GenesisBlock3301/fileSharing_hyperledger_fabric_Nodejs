/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {Contract} = require('fabric-contract-api');

class Drive extends Contract {

    async CreateUser(ctx, key, email, password, name) {
        const user = {
            Key: key,
            Email: email,
            Password: password,
            Name: name,
            DocType: 'user',
        };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(user)));
        return JSON.stringify(user);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async FindUser(ctx, email, password) {
        console.log('Email name is', email);
        let Key = `user_${email}`;
        const userJSON = await ctx.stub.getState(Key); // get the asset from chaincode state
        if (!userJSON || userJSON.length === 0) {
            throw new Error(`The asset ${email} does not exist`);
        }
        const user = JSON.parse(userJSON.toString());
        if (user.Password !== password) {
            throw new Error('Email and password do not match any user in our system');
        }
        return userJSON.toString();
    }

    async CreateFile(ctx, key, name, downloadLink, fileHash, uploaderEmail) {
        const file = {
            Key: key,
            Name: name,
            DownloadLink: downloadLink,
            FileHash: fileHash,
            UploaderEmail: uploaderEmail,
            DocType: 'file',
            Deleted: false
        };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(file)));
        return JSON.stringify(file);
    }

    async FindFile(ctx, Key) {
        const fileJSON = await ctx.stub.getState(Key); // get the asset from chaincode state
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`The file with ${Key} does not exist`);
        }
        return fileJSON.toString();
    }

    async ChangeFileName(ctx, Key, newName) {
        const fileJSON = await this.AssetExists(ctx, Key);
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`The asset ${Key} does not exist`);
        }
        // overwriting original asset with new asset
        let file = JSON.parse(fileJSON.toString());
        file.Name = newName;
        await ctx.stub.putState(Key, Buffer.from(JSON.stringify(file)));
        return JSON.stringify(file);
    }

    async DeleteFile(ctx, Key) {
        const fileJSON = await this.AssetExists(ctx, Key);
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`The asset ${Key} does not exist`);
        }
        await ctx.stub.deleteState(Key);
        return JSON.stringify({
            status: 'File Deleted'
        });
    }

    async FindFileByUser(ctx, email) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.DocType = 'file';
        queryString.selector.UploaderEmail = email;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    async ShareFile(ctx, key, fileKey, sharedWithEmail) {
        const fileShare = {
            Key: key,
            FileKey: fileKey,
            SharedWithEmail: sharedWithEmail,
            DocType: 'fileShare',
        };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(fileShare)));
        return JSON.stringify(fileShare);
    }

    async FindFileSharedByFile(ctx, fileKey) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.DocType = 'fileShare';
        queryString.selector.FileKey = fileKey;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    async DeleteFileShare(ctx, Key) {
        const fileShareJSON = await this.AssetExists(ctx, Key);
        if (!fileShareJSON || fileShareJSON.length === 0) {
            throw new Error(`file share ${Key} does not exist`);
        }
        await ctx.stub.deleteState(Key);
        return JSON.stringify({
            status: 'FileShare Deleted'
        });
    }

    async FindFileShareByUser(ctx, userEmail) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.DocType = 'fileShare';
        queryString.selector.SharedWithEmail = userEmail;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    async GetQueryResultForQueryString(ctx, queryString) {
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        let results = await this._GetAllResults(resultsIterator, false);
        return JSON.stringify(results);
    }

    async _GetAllResults(iterator, isHistory) {
        let allResults = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));
                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.txId;
                    jsonRes.Timestamp = res.value.timestamp;
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            res = await iterator.next();
        }
        iterator.close();
        return allResults;
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        asset.Owner = newOwner;
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({Key: result.value.key, Record: record});
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = Drive;
