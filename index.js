const express = require('express');
const app = express()
const { MongoClient } = require('mongodb');

let client;

const getChildren = (parent, next, depth) => {
    if (!next || !next.length) return undefined;
    const children = next.reduce((prev, curr) => {
        if (curr.depth === depth && parent._id.toString() === curr.prev.toString()) {
            const possibleChildren = next.filter(x => x.depth > depth);
            prev.push({ ...curr, children: getChildren(curr, possibleChildren, depth + 1) });
        }
        return prev;
    }, []);
    return children;
}

app.get('/', async function (req, res) {
    const dbName = 'docfyn_poc';
    const db = client.db(dbName);
    const collection = db.collection('df_nodes');
    const data = await collection.aggregate([
        {
            $match: {
                type: "ROOT",
            },
        },
        {
            $graphLookup:
            {
                from: "df_nodes",
                startWith: "$_id",
                connectFromField: "_id",
                connectToField: "prev",
                as: "next",
                maxDepth: 10,
                depthField: "depth",
            },
        },
    ]).toArray();
    const children = getChildren(data[0], data[0].next, 0);
    const result = { ...data[0], next: undefined, children };
    res.send(result)
});

const start = async () => {
    const url = 'mongodb+srv://sharefreeroot:Sh%40reFree!0403@cluster0.liprs.gcp.mongodb.net/docfyn_poc';
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to server');

    app.listen(3001, () => {
        console.log(`Listening on port ${3001}`);
    })
};

start();