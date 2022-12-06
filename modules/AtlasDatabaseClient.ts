
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




// try {
//     await atlasDbClient.connect();
//     const memberStatisticsCollectionClient = atlasDbClient.db('mojito-statistics--dev').collection('memberStatistics');
//     // const result = await atlasDbClient.db('mojito-statistics-dev').collection('memberStatistics').findOne({memberId: '6TTK1WH0OD'})
//     // console.log(result);
//     // atlasDbClient.close();
//     const result = await memberStatisticsCollectionClient.findOne({ memberId: '6TTK1WH0OD' })
//     // const result = await memberStatisticsCollectionClient.insertOne({memberId: 'test_member_id', memberIdIndex: 2})
//     // const result = await memberStatisticsCollectionClient.replaceOne({ memberId: 'test_member_id' }, { memberId: 'test_member_id', memberIdIndex: 3 })
//     res.send(result)

// } catch (error) {
//     console.log(error);

// } finally {
//     atlasDbClient.close();
// }