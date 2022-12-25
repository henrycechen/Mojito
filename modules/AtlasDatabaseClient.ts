
import { MongoClient, ServerApiVersion } from 'mongodb';

export default function (): MongoClient {
    return new MongoClient(
        `mongodb+srv://${process.env.MONGODB_ATLAS_ACCOUNT ?? ''}:${process.env.MONGODB_ATLAS_KEY}@${process.env.MONGODB_ATLAS_DATABASE ?? ''}.cukb0vs.mongodb.net/?retryWrites=true&w=majority`,
        //  { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }
    );
};