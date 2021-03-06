"use strict";

const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const {
  buildCAClient,
  registerAndEnrollUser,
  enrollAdmin,
} = require("../../test-application/javascript/CAUtil.js");
const {
  buildCCPOrg1,
  buildWallet,
} = require("../../test-application/javascript/AppUtil.js");
const crypto = require("crypto");
const fs = require("fs");
const util = require("util");
const { use } = require("express/lib/router");

const channelName = "mychannel";
const chaincodeName = "drive";
const mspOrg1 = "Org1MSP";
const walletPath = path.join(__dirname, "wallet");
const org1UserId = "appUser";

function prettyJSONString(inputString) {
  return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
  try {
    const ccp = buildCCPOrg1();
    const caClient = buildCAClient(
      FabricCAServices,
      ccp,
      "ca.org1.example.com"
    );
    const wallet = await buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, mspOrg1);
    await registerAndEnrollUser(
      caClient,
      wallet,
      mspOrg1,
      org1UserId,
      "org1.department1"
    );
    // a user that has been verified.
    const gateway = new Gateway();

    try {
      await gateway.connect(ccp, {
        wallet,
        identity: org1UserId,
        discovery: { enabled: true, asLocalhost: true }, // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      // Build a network instance based on the channel where the smart contract is deployed
      const network = await gateway.getNetwork(channelName);

      // Get the contract from the network.
      const contract = network.getContract(chaincodeName);
      // create server
      ////////////////////////////////

      const express = require("express");
      const cookieParser = require("cookie-parser");
      const fileUpload = require("express-fileupload");
      var cors = require("cors");
      const path = require("path");
      const crypto = require("crypto");
      const fs = require("fs");
      const util = require("util");
      const app = express();
      app.use(
        cors({
          origin: "http://localhost:3001",
          optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
          credentials: true,
        })
      );

      //   var corsOptions =;
      const port = 3000;
      app.use(cookieParser());
      app.use(
        fileUpload({
          useTempFiles: true,
          tempFileDir: "tmp/",
          createParentPath: true,
          // preserveExtension:true
        })
      );
      app.use(express.urlencoded({ extended: false }));
      app.use(express.json());
      app.use(express.static("public"));

      app.get("/", (req, res) => {
        res.send("Hello World!");
      });
      app.get("/book", (req, res) => {
        res.send("Hello World book response");
      });

      app.post("/register", async function (req, res) {
        const { email, password, name } = req.body;
        console.log(email, password, name);
        const key = `user_${email}`;
        try {
          let result = await contract.evaluateTransaction(
            "CreateUser",
            key,
            email,
            password,
            name
          );
          await contract.submitTransaction(
            "CreateUser",
            key,
            email,
            password,
            name
          );
          res.send(result.toString());
        } catch (error) {
          res.status(400).send(error.toString());
        }
      });
      app.post("/login", async function (req, res) {
        const { email, password } = req.body;
        try {
          let result = await contract.evaluateTransaction(
            "FindUser",
            email,
            password
          );
          res.cookie("user", result.toString(), {
            maxAge: 3600_000,
            httpOnly: true,
          });
          let user = JSON.parse(result.toString());
          user.isLoggedIn = true;
          res.send(user);
        } catch (error) {
          res.status(400).json({ error: error.toString() });
        }
      });
      app.get("/logout", async function (req, res) {
        try {
          res.cookie("user", "", { maxAge: -1, httpOnly: true });
          res.send("Successfully logout");
        } catch (error) {
          res.status(400).send(error.toString());
        }
      });

      //helper function
      async function sha256(filePath) {
        const readFile = util.promisify(fs.readFile);
        const data = await readFile(filePath);
        const hash = crypto.createHash("sha256");
        hash.update(data);
        return hash.digest("base64");
      }

      app.post("/file", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        //facilated file upload
        const uploadedFile = req.files?.uploadedFile;
        if (uploadedFile === undefined) {
          return res.status(400).send("You must upload a file...");
        }
        const fileName = uploadedFile.name;
        const fileDestination = path.join(
          __dirname,
          "public",
          "uploadedFiles",
          fileName
        );
        console.log(path.join("public", "uploadedFiles", fileName));
        uploadedFile.mv(fileDestination, async (error) => {
          if (error !== undefined) {
            return res
              .status(500)
              .send(`Server error. Failed to move file ${error}...`);
          }
          try {
            const downloadLink = path.join("uploadedFiles", fileName);
            const user = JSON.parse(req.cookies.user.toString());
            let uploaderEmail = user.Email;
            const key = `file_${uploaderEmail}_${fileName}`;
            const fileHash = await sha256(fileDestination);
            let result = await contract.evaluateTransaction(
              "CreateFile",
              key,
              fileName,
              downloadLink,
              fileHash,
              uploaderEmail
            );
            await contract.submitTransaction(
              "CreateFile",
              key,
              fileName,
              downloadLink,
              fileHash,
              uploaderEmail
            );
            return res.send(`${result.toString()} and\n ${user.Email}`);
          } catch (error) {
            return res.status(400).send(error.toString());
          }
        });
      });
      app.get("/file", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction(
            "FindFileByUser",
            user.Email
          );
          return res.send(result.toString());
        } catch (error) {
          return res.status(400).send(error.toString());
        }
      });
      app.get("/file/:fileKey", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const fileKey = req.params.fileKey;
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction("FindFile", fileKey);
          const uploadedFile = JSON.parse(result);

          result = await contract.evaluateTransaction(
            "FindFileSharedWithUser",
            user.Email
          );
          let filesSharedWithMe = JSON.parse(result);
          filesSharedWithMe = filesSharedWithMe.map((data) => data.Record);
          const thisFileShareWithMe = filesSharedWithMe.some(
            (fileShare) => fileShare.FileKey === uploadedFile.Key
          );
          if (
            uploadedFile.UploaderEmail !== user.Email &&
            !thisFileShareWithMe
          ) {
            return res
              .status(403)
              .send("You are not authorized to view this file");
          } else {
            return res.send(result.toString());
          }
        } catch (error) {
          return res.status(400).send(JSON.stringify(uploadedFile));
        }
      });
      app.put("/file/:fileKey", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const fileKey = req.params.fileKey;
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction("FindFile", fileKey);

          const uploadedFile = JSON.parse(result);
          const newFileName = req.body.newFileName;

          if (uploadedFile.UploaderEmail !== user.Email) {
            return res
              .status(403)
              .send("You are not authorized to update this file");
          } else {
            //move file and update download link
            const renameFile = util.promisify(fs.rename);
            const srcPath = path.join("public", uploadedFile.DownloadLink);
            const destinationPath = path.join(
              "public",
              "uploadedFiles",
              newFileName
            );
            const err = await renameFile(srcPath, destinationPath);

            const newDownloadLink = path.join("uploadedFiles", newFileName);
            if (err !== undefined) {
              return res.status(500).send(`Server error ${err}`);
            }

            let result = await contract.evaluateTransaction(
              "ChangeFileName",
              fileKey,
              newFileName,
              newDownloadLink
            );
            await contract.submitTransaction(
              "ChangeFileName",
              fileKey,
              newFileName,
              newDownloadLink
            );
            return res.send(result.toString());
          }
        } catch (error) {
          return res.status(400).send(error.toString());
        }
      });
      app.delete("/delete/:fileKey", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const fileKey = req.params.fileKey;
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction("FindFile", fileKey);

          const uploadedFile = JSON.parse(result);

          if (uploadedFile.UploaderEmail !== user.Email) {
            return res
              .status(403)
              .send("You are not authorized to delete this file");
          } else {
            //delete file and update download link
            const deleteFile = util.promisify(fs.unlink);

            const srcPath = path.join("public", uploadedFile.DownloadLink);
            const err = await deleteFile(srcPath);
            if (err !== undefined) {
              return res.status(500).send(`Server error ${err}`);
            }
            let result = await contract.evaluateTransaction(
              "DeleteFile",
              fileKey
            );
            await contract.submitTransaction("DeleteFile", fileKey);
            return res.send("Delete file successfully.");
          }
        } catch (error) {
          return res.status(400).send(error.toString());
        }
      });

      app.post("/fileShare", async function (req, res) {
        const { fileKey, sharedWithEmail } = req.body;
        const key = `fileShare_${fileKey}_${sharedWithEmail}`;

        try {
          let result = await contract.evaluateTransaction(
            "ShareFile",
            key,
            fileKey,
            sharedWithEmail
          );
          await contract.submitTransaction(
            "ShareFile",
            key,
            fileKey,
            sharedWithEmail
          );
          res.send(result.toString());
        } catch (error) {
          res.status(400).send(error.toString());
        }
      });
      app.get("/fileShare/byfile/:fileKey", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const fileKey = req.params.fileKey;
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction("FindFile", fileKey);
          const uploadedFile = JSON.parse(result);
          if (uploadedFile.UploaderEmail !== user.Email) {
            return res
              .status(403)
              .send("You are not authorized to view this file");
          } else {
            let result = await contract.evaluateTransaction(
              "FindFileSharedByFile",
              fileKey
            );
            return res.send(result.toString());
          }
        } catch (error) {
          return res.status(400).send(error.toString());
        }
      });
      app.get("/fileShare/withMe", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction(
            "FindFileSharedWithUser",
            user.Email
          );
          res.send(result.toString());
        } catch (error) {
          return res.status(400).send(error.toString());
        }
      });
      app.delete("/fileShare/:fileShareKey", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const fileShareKey = req.params.fileShareKey;
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction(
            "FindFileShare",
            fileShareKey
          );

          const fileShare = JSON.parse(result);

          const fileKey = fileShare.FileKey;
          console.log("File key", fileShare, fileKey);
          result = await contract.evaluateTransaction("FindFile", fileKey);

          const uploadedFile = JSON.parse(result);
          console.log(
            uploadedFile.UploaderEmail !== user.Email,
            fileShare.SharedWithEmail !== user.Email
          );
          if (
            uploadedFile.UploaderEmail !== user.Email &&
            fileShare.SharedWithEmail !== user.Email
          ) {
            return res
              .status(403)
              .send("You are not authorized to delete this file");
          } else {
            //delete file and update download link
            let result = await contract.evaluateTransaction(
              "DeleteFileShare",
              fileShareKey
            );
            await contract.submitTransaction("DeleteFileShare", fileShareKey);
            return res.send(
              `Delete file share successfully.\n${result},${user.Email}`
            );
          }
        } catch (error) {
          return res.status(400).send(error.toString());
        }
      });
      app.get("/profile", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.json({ isLoggedIn: false });
        }
        try {
          let user = JSON.parse(req.cookies.user.toString());
          const key = user.Key;
          let result = await contract.evaluateTransaction("FindUserByKey", key);
          user = JSON.parse(result.toString());
          user.isLoggedIn = true;
          return res.json(user);
        } catch (error) {
          return res.status(400).json({ error: error, isLoggedIn: false });
        }
      });
      app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
      });

      //////////////////////////////////
    } finally {
      // gateway.disconnect();
    }
  } catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
  }
}

main();
