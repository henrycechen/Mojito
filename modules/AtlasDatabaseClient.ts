
import { MongoClient, ServerApiVersion } from 'mongodb';

// const client = new MongoClient(
//     `mongodb+srv://${process.env.MONGODB_ATLAS_ACCOUNT ?? ''}:${process.env.MONGODB_ATLAS_KEY}@${process.env.MONGODB_ATLAS_DATABASE ?? ''}.cukb0vs.mongodb.net/?retryWrites=true&w=majority`,
//     //  { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }
// );

export default function (): MongoClient {
    return new MongoClient(
        `mongodb+srv://${process.env.MONGODB_ATLAS_ACCOUNT ?? ''}:${process.env.MONGODB_ATLAS_KEY}@${process.env.MONGODB_ATLAS_DATABASE ?? ''}.cukb0vs.mongodb.net/?retryWrites=true&w=majority`,
        //  { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }
    );
};

// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });
