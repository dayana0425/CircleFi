import { Web3Storage, File, getFilesFromPath } from "web3.storage";
const { resolve } = require("path");

export default async function handler(req, res) {
  if (req.method === "POST") {
    return await storeEventData(req, res);
  } else {
    return res
      .status(405)
      .json({ message: "Method not allowed", success: false });
  }
}

async function storeEventData(req, res) {
  const body = req.body;
  try {
    console.log('storeEventData');
    const files = await makeFileObjects(body);
    const cid = await storeFiles(files);
    console.log('set 200')
    return res.status(200).json({ success: true, cid: cid });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Error creating event", success: false });
  }
}

async function storeFiles(files) {
  try {
    const client = makeStorageClient();
    const cid = await client.put(files);
    console.log(cid);
    return cid;
  } catch (error) {
    console.log(error);
  }
}

async function makeFileObjects(body) {
  const buffer = Buffer.from(JSON.stringify(body));

  const imageDirectory = resolve(process.cwd(), `public/images/${body.image}`);
  const files = await getFilesFromPath(imageDirectory);

  files.push(new File([buffer], "data.json"));
  console.log(files);
  return files;
}

/*
  you can create token from here: https://web3.storage/tokens/
  then you can access the stored data
*/

function makeStorageClient() {
  return new Web3Storage({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGU3MDBFNjM5N0VENDVjMGVBNDg1ZUQ4ODZmQTYwMDQ0NjFFMDg2ZmEiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjE3MjcxODk1NjUsIm5hbWUiOiJjaXJjbGUifQ.5yYen2VVoKN6g-EVdYR7y5R7kBRBgBlstnQr_Fi1WV4"});
}
