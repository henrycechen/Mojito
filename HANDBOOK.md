# Mojito New Zealand 莫希托新西兰

8 September 2022 | Established

27 October 2022 | Domain name announced

[toc]

# Branding

26/10/2022 | Domain name officially announced

- mojito.co.nz 莫希托新西兰
- themojitoapp.com 🆕









# Management

## Admin email

webmaster.mojito@gmail.com









# Architecture

## Host

Azure Web App / [Vercel](https://vercel.com/pricing)





## DB

### 💡[Design] 

| Category        | Desc                                                 | Candidate           |
| --------------- | ---------------------------------------------------- | ------------------- |
| Content data    | Member info, post info, comment info, etc.           | Azure Table Storage |
| Statistics data | Member statistics, post statistics, topic statistics | MongoDB  Atlas      |

### Cost Management

#### Content data

| Mode       | Access Tier      | Storage (Storage in GB / month) | 10K Write | 10K Read | 10K Scan | 10K List |
| ---------- | ---------------- | ------------------------------- | --------- | -------- | -------- | -------- |
| Dev&Test   | **LRS**          | $0.0847 per GB                  | $0.0599   | $0.0120  | $0.2155  | $0.2155  |
| Production | **GRS** (RA-GRS) | $0.1059 per GB ($0.1377 per GB) | $0.1197   | $0.0120  | $0.2155  | $0.2155  |

#### Statistics data

| Mode       | Cluster           | Hourly rate |
| ---------- | ----------------- | ----------- |
| Dev&Test   | Free **Shared**   | N/A         |
| Production | **Dedicated** M10 | $0.12       |





## File Storage

### 💡[Design] 

| File Type | Desc                 | Candidate          |
| --------- | -------------------- | ------------------ |
| Images    | Avatars, post images | Azure Blob Storage |

### Cost Management

| Mode       | Access Tier | Storage (50 TB / month) | 10K Write | 10K Read |
| ---------- | ----------- | ----------------------- | --------- | -------- |
| Dev&Test   | **Hot**     | $0.0342 per GB          | $0.1223   | $0.0098  |
| Production | **Hot**     | $0.0342 per GB          | $0.1223   | $0.0098  |









# Interfaces & Types

Specifiy a type as a rule when communicating between components, APIs and DBs.



## MemberBehaviour

### VerifyAccountRequestInfo

```typescript
type VerifyAccountRequestInfo = {
    memberId: string;
}
```

### ResetPasswordRequestInfo

```typescript
type ResetPasswordRequestInfo = {
    memberId: string;
    resetPasswordToken: string;
    expireDate: number;
}
```









# Tables (Azure Storage)

\* Terms:

- T: Table
- RL: Relation record table
- PRL: Passive Relation record table (affected by operations on the corresponding RL table)

## 💾Member

| Property | Type   | Desc                                              |
| -------- | ------ | ------------------------------------------------- |
| MemberId | string | MongoDB ObejctId String, 24 characters, lowercase |

### [T] LoginCredentials

| PartitionKey | RowKey           | PasswordHashStr |
| ------------ | ---------------- | --------------- |
| MemberIdStr  | `"PasswordHash"` | string          |

| PartitionKey | RowKey                 | ResetPasswordTokenStr |
| ------------ | ---------------------- | --------------------- |
| MemberIdStr  | `"ResetPasswordToken"` | string                |

### [RL] FollowingMemberMapping

\* This table records the following member ids of the partition key (member id)

| PartitionKey | RowKey               | IsActive                |
| ------------ | -------------------- | ----------------------- |
| MemberIdStr  | FollowingMemberIdStr | boolean, default `true` |

### [PRL] FollowedByMemberMapping

\* This table records the member ids of who have been following the partition key (member id)

| PartitionKey | RowKey                | IsActive                |
| ------------ | --------------------- | ----------------------- |
| MemberIdStr  | FollowedByMemberIdStr | boolean, default `true` |

### [RL] BlockedMemberMapping

\* This table records the member ids blocked by the partition key (member id)

| PartitionKey | RowKey             | IsActive                |
| ------------ | ------------------ | ----------------------- |
| MemberIdStr  | BlockedMemberIdStr | boolean, default `true` |





## 💾Comment

| Property  | Type   | Desc                                              |
| --------- | ------ | ------------------------------------------------- |
| CommentId | string | MongoDB ObejctId String, 24 characters, lowercase |

### [PRL] AttitudeCommentMapping

\* This table records the attitude expressed to certain comment ids by the partition key (member id)

| PartitionKey | RowKey       | Attitude                        |
| ------------ | ------------ | ------------------------------- |
| MemberIdStr  | CommentIdStr | number, `-1 |0 |1`, default `0` |





## 💾Subcomment

| Property     | Type   | Desc                                              |
| ------------ | ------ | ------------------------------------------------- |
| SubcommentId | string | MongoDB ObejctId String, 24 characters, lowercase |

### [PRL] AttitudeSubcommentMapping

\* This table records the attitude expressed to certain commentIds by the partition key (member id)

| PartitionKey | RowKey        | Attitude                        |
| ------------ | ------------- | ------------------------------- |
| MemberIdStr  | SubcommentStr | number, `-1 |0 |1`, default `0` |

| Key          | Type   | Desc                      |
| ------------ | ------ | ------------------------- |
| PartitionKey | string | MemberIdStr               |
| RowKey       | string | SubcommentStr             |
| Attitude     | number | `-1 | 0 | 1`, default `0` |





## 💾Notification

### [PRL] NotifyCued

| PartitionKey        | RowKey       | Initiate    | Nickname | PostId | PostBrief |
| ------------------- | ------------ | ----------- | -------- | ------ | --------- |
| NotifiedMemberIdStr | NotifiyIdStr | MemberIdStr | string   | string | string    |

```
- WebMaster在帖子“WebMaster在Mojito发的第一篇帖子”中提到了您
```

### [PRL] NotifyReplied

| PartitionKey        | RowKey       | Initiate    | Nickname | PostId | PostBrief | CommentId? | CommentBrief? |
| ------------------- | ------------ | ----------- | -------- | ------ | --------- | ---------- | ------------- |
| NotifiedMemberIdStr | NotifiyIdStr | MemberIdStr | string   | string | string    | string     | string        |

```
- WebMaster回复了您的帖子“WebMaster在Mojito发的第一篇帖子”
- WebMaster在帖子“WebMaster在Mojito发的第一篇帖子”中回复了您的评论“可喜可贺可惜可...”
```

### [PRL] NotifyLiked

| PartitionKey        | RowKey       | Initiate    | Nickname | PostId | PostBrief | CommentId? | CommentBrief? |
| ------------------- | ------------ | ----------- | -------- | ------ | --------- | ---------- | ------------- |
| NotifiedMemberIdStr | NotifiyIdStr | MemberIdStr | string   | string | string    | string     | string        |

```
- WebMaster喜欢了您的帖子“WebMaster在Mojito发的第一篇帖子”
- WebMaster喜欢了您在“WebMaster在Mojito发的第一篇帖子”中发表的评论“可喜可贺可惜可...”
```

### [PRL] NotifySaved

| PartitionKey        | RowKey       | Initiate    | Nickname | PostId | PostBrief |
| ------------------- | ------------ | ----------- | -------- | ------ | --------- |
| NotifiedMemberIdStr | NotifiyIdStr | MemberIdStr | string   | string | string    |

```
- WebMaster收藏了“WebMaster在Mojito发的第一篇帖子”中提到了您
```

### [PRL] NotifyFollowed

| PartitionKey        | RowKey       | Initiate    | Nickname |
| ------------------- | ------------ | ----------- | -------- |
| NotifiedMemberIdStr | NotifiyIdStr | MemberIdStr | string   |

```
- WebMaster关注了您
```

### [PRL] NotifyPrivateMessaged (🚫Not-in-use)

| PartitionKey        | RowKey       | Initiate    | ...  |      |      |
| ------------------- | ------------ | ----------- | ---- | ---- | ---- |
| NotifiedMemberIdStr | NotifiyIdStr | MemberIdStr | ...  |      |      |





## 💾Channel

| ChannelId                    | ChannelNameStr | 中文   | Svg Icon Reference |
| ---------------------------- | -------------- | ------ | ------------------ |
| recommend<br />(🚫Not-in-use) | Recommended    | 推荐   |                    |
| food                         | Food           | 美食   | RestaurantIcon     |
| shopping                     | Shopping       | 好物   | GradeIcon          |
| hobby                        | Hobby          | 兴趣   | NightlifeIcon      |
| sports                       | Sports         | 运动   | SportsTennisIcon   |
| travel                       | Travel         | 旅行   | AirplaneTicketIcon |
| photography                  | Photography    | 摄影   | PhotoCameraIcon    |
| life                         | Life           | 生活   | FamilyRestroomIcon |
| pets                         | Pets           | 萌宠   | PetsIcon           |
| automobile                   | Automobile     | 汽车   | TimeToLeaveIcon    |
| realestate                   | Realestate     | 不动产 | HouseIcon          |
| furnishing                   | Furnishing     | 家装   | YardIcon           |
| invest                       | Invest         | 投资   | MonetizationOnIcon |
| event                        | Event          | 时事   | NewspaperIcon      |
| all                          | All            | 全部   |                    |

### [T] ChannelInfo

| Key          | Type   | Desc                                     |
| ------------ | ------ | ---------------------------------------- |
| PartitionKey | string | Category name, e.g., `"Info"`, `"Index"` |
| *            |        |                                          |

| PartitionKey | RowKey       | CH     | EN     | SvgIconPath |
| ------------ | ------------ | ------ | ------ | ----------- |
| `"Info"`     | ChannelIdStr | string | string | string      |

| PartitionKey | RowKey      | InedxValue                |
| ------------ | ----------- | ------------------------- |
| `"Index"`    | `"default"` | string, stringified array |





## 💾Post

### [RL] HistoryMapping

\* This table records the postIds viewed by the partition key owner (memberId)

| Key          | Type    | Desc           |
| ------------ | ------- | -------------- |
| PartitionKey | string  | MemberIdStr    |
| RowKey       | string  | PostIdStr      |
| IsActive     | boolean | Default `true` |

### [RL] CreationsMapping 🆕

\* This table records the postIds published by the partition key owner (member id)

| Key          | Type    | Desc           |
| ------------ | ------- | -------------- |
| PartitionKey | string  | MemberIdStr    |
| RowKey       | string  | PostIdStr      |
| IsActive     | boolean | Default `true` |

### [RL] SavedMapping

\* This table records the postIds saved by the partition key owner (member id)

| Key          | Type    | Desc           |
| ------------ | ------- | -------------- |
| PartitionKey | string  | MemberIdStr    |
| RowKey       | string  | PostIdStr      |
| IsActive     | boolean | Default `true` |

### [PRL] AttitudePostMapping

\* This table records the attitude towards to certain postIds taken by the partition key owner (member id)

| Key          | Type   | Desc                      |
| ------------ | ------ | ------------------------- |
| PartitionKey | string | MemberIdStr               |
| RowKey       | string | PostIdStr                 |
| Attitude     | number | `-1 | 0 | 1`, default `0` |





## 💾Stastics

### [PRL] Statistics

| PartitionKey      | RowKey      | MemberIdIndexValue |
| ----------------- | ----------- | ------------------ |
| `"MemberIdIndex"` | MemberIdStr | number             |





## Reference

- Microsoft - Design for Querying [Link](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-for-query)









# Collections (Atlas)

```shell
mongosh "mongodb+srv://mojito-statistics-dev.cukb0vs.mongodb.net/mojito-statistics-dev" --apiVersion 1 --username dbmaster
```

## 📋Notification

```typescript
{
    _id: ObjectId;
    memberId: string;
    
    cuedCount: number; // cued times accumulated from last count reset
    repliedCount: number;
    likedCount: number;
    savedCount: number;
    followedCount: number;
}
```





## 📋Member

### [C] memberComprehensive

```typescript
{
    _id: string;  // mongodb obejct id | memberId (auto-generated)
    
    //// info ////
    memberId: string; // 10 characters, UPPERCASE
    registeredTime: number;
    verifiedTime: number;
    emailAddress: string;
    emailAddressHash: string; // prevent duplicated login credential when registering
    nickname: string;
    nicknameHash: string; // prevent duplicated nickname when re-naming
    briefIntro: string;
    gender: -1 | 0 | 1;
    birthday: string;
    
    //// management ////
    status: number;
    allowPosting: boolean;
    allowCommenting: boolean;
}
```

### 💡MemberStatus Codes

| Code     | Explanation                                             |
| -------- | ------------------------------------------------------- |
| **-3**   | **Deactivated by WebMaster**                            |
| -2       | Deactivated (Cancelled)                                 |
| -1       | Suspended                                               |
| 0        | Established, email address not verified                 |
| **200**  | **Email address verified or third party login, normal** |
| **≥400** | **Restricted to certain content or behaviour**          |

### [C] memberLoginHistory

```typescript
{
    _id: string; // mongodb obejct id
    memberId: string; // member id
   	category: 'error' | 'success';
    providerId: 'MojitoMemberSystem' | string; // LoginProviderId
    timestamp: string; // new Date().toISOString()
    message: string; // short message, e.g., 'Attempted login while email address not verified.'
}
```

### [C] memberStatistics

```typescript
{
    _id: string; // mongodb obejct id
    memberId: string;
    
    //// total statistics ////
    // creation
    totalCreationCount: number; // info page required
    totalCreationEditCount: number;
    totalCreationDeleteCount: number;
    // comment
    totalCommentCount: number;
    totalCommentEditCount: number;
    totalCommentDeleteCount: number;
    // attitude
    totalLikeCount: number;
    totalDislikeCount: number;
    // on other members
    totalFollowingCount: number;
    totalBlockedCount: number;
    // by other members
    totalCreationLikedCount: number; // info page required
    totalCreationDislikedCount: number;
    totalCommentLikedCount: number;
    totalCommentDislikedCount: number;
    totalSavedCount: number; // info page required
    followedByCount: number; // info page required
}
```

### [C] memberStatisticsHistory

\* Maintained by automation script

```typescript
{
    _id: string; // mongodb obejct id
    
    memberId: string;    
 	createdTime: number; // created time of this document (member statistics snapshot)
    memberStatisticsObj: { [key: timeStr]: MemberStatistics }
}
```

### Type MemberStatistics

```typescript
{
    // creation
    totalCreationCount: number; // info page required
    totalCreationEditCount: number;
    totalCreationDeleteCount: number;
    // by other members
	totalCreationLikedCount: number; // info page required
    totalCreationDislikedCount: number;
    totalCommentLikedCount: number;
    totalCommentDislikedCount: number;
    totalSavedCount: number; // info page required
    followedByCount: number; // info page required
}
```

### [C] attitudeMapping

```typescript
{
    _id: string; // mongodb obejct id
    
    memberId: string;
    postId: string; // divided by post id
    attitude: number; // -1 | 0 | 1
    attitudeCommentMapping: {
        [key: commentIdStr]: number // -1 | 0 | 1
    };
    attitudeSubcommentMapping: {
        [key: subcommentIdStr]: number // -1 | 0 | 1
    }
}
```





## 📋Comment

### [C] commentComprehensive

```typescript
{
     _id: string; // mongodb obejct id
    
    //// info ////
    postId: string;
    commentId: string; // 16 characters, UPPERCASE
    createdTime: number; // created time of this document (comment est.)
    content: string;
    
	//// management ////
    status: number;
    
    //// statistics ////
    likedCount: number;
    dislikedCount: number;
    subcommentCount: number;
}
```

### [C] subcommentComprehensive

```json
{
    _id: string; // mongodb obejct id
    
    //// info ////
    commentId: string;
    subcommentId: string; // 16 characters, UPPERCASE
    createdTime: number; // created time of this document (subcomment est.)
    content: string;
    
	//// management ////
    commentStatus: number;
    
    //// statistics ////
    likedCount: number;
    dislikedCount: number;
}
```

### 💡Comment & SubcommentStatus Code

| Code    | Explanation                            |
| ------- | -------------------------------------- |
| **-3**  | **Deactivated (removed) by WebMaster** |
| -1      | Deactivated (removed)                  |
| **200** | **Normal**                             |
| 201     | Normal, edited                         |





## 📋Channel

### [C] channelStatistics

```json
{
    _id: ObjectId; // mongodb obejct id
    
    //// info ////
    channelId: string; // pre-defined channel id
    createTime: number;
    
    //// total statistics ////
    totalHitCount: number;
    totalTopicCount: number;
    totalPostCount: number;
    totalCommentCount: number; // subcomment included
}
```

### [C] channelStatisticsHistory

\* Maintained by automation script

```json
{
    _id: ObjectId; // mongodb obejct id
    
    //// info ////
    channelId: string;
    createdTime: number; // created time of this document (channel statistics snapshot)
    channelStatisticsObj: { [key: timeStr]: ChannelStatistics }
}
```

### Type ChannelStatistics

```json
{
    totalHitCount: number;
    totalTopicCount: number;
    totalPostCount: number;
    totalCommentCount: number;
}
```

### [C] channelPostMapping

```typescript
{
    _id: ObjectId; // mongodb obejct id
    
    //// info ////
    channelId: string;
    postId: string;
    createdTime: number; // created time of this document (post est.)
    
    //// management ////
    status: number;
}
```

### [C] channelTopicMapping

```typescript
{
    _id: ObjectId; // mongodb obejct id
    
    //// info ////
    channelId: string;
    topicId: string;
    createdTime: number; // created time of this document (topic est.)
    
    //// management ////
    status: number;
}
```





## 📋Topic

### [C] topicComprehensive

```json
{
    _id: ObjectIdStr; // mongodb obejct id
    
    //// info ////
    topicId: string; // 16 characters, UPPERCASE
    createdTime: number; // create time of this document (topic est.)
    content: string; // topic content
    
    //// management ////
    status: number;
    
    //// total statistics ////
    totalPostCount: number;
    totalHitCount: number; // total hit count of total posts of this topic
    totalCommentCount: number;
    totalSearchCount: number;
}
```

### 💡TopicStatus Codes

| Code    | Explanation                            |
| ------- | -------------------------------------- |
| **-3**  | **Deactivated (removed) by WebMaster** |
| -1      | Deactivated (removed)                  |
| **200** | **Normal**                             |

### [C] topicStatisticsHistory

\* Maintained by automation script

```typescript
{
 	_id: string; // mongodb obejct id
    
    topicId: string;    
 	createdTime: number; // created time of this document (topic statistics snapshot)
    topicStatisticsObj: { [key: timeStr]: TopicStatistics }
}
```

### Type TopicStatistics

```typescript
{
    totalPostCount: number;
    totalHitCount: number;
    totalCommentCount: number;
    totalSearchCount: number;
}
```

### [C] topicPostMapping

```typescript
{
     _id: string; // mongodb obejct id
    
    //// info ////
    topicId: string;
    postId: string;
    createdTime: number; // created time of this document (post est. time)
    
    //// management ////
    status: number;
}
```





## 📋TopicRanking

### [C] topicRankingStatistics

\* Maintained by automation script

```typescript
{
    _id: string; // mongodb obejct id
    
    //// info ////
    rankingId: string; // topic ranking id
    channelId: string; // channel id
    topicRankingObj: TopicRankingStatistics
}
```

### [C] topicRankingStatisticsHistory

\* Maintained by automation script

```typescript
{
    _id: string; // mongodb obejct id
    
    //// ranking info ////
    rankingId: string; // topic ranking id
    channelId: string; // channel id
    createTime: number; // reated time of this document (topic ranking statistics snapshot)
    topicRankingStatisticsObj: { [key: timeStr]: TopicRankingStatistics }
}
```

### Type TopicRankingStatistics

```typescript
{
   [key: topicIdStr]: {
       topicId: string;
       content: string;
   }
}
```







## 📋Post

### [C] postComprehensive

```json
{
    _id: ObjectId; // mongodb obejct id
    
    //// info ////
    memberId: string;
    postId: string; // 10 characters, UPPERCASE
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];
	paragraphsArr: string[];

	channelId: string;
	topicIdsArr: string[];

    //// management ////
    status: number;

    //// total statistics ////
	totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;
}
```

### 💡PostStatus Codes

| Code     | Explanation                            |
| -------- | -------------------------------------- |
| **-3**   | **Deactivated (deleted) by WebMaster** |
| -1       | Deactivated (deleted)                  |
| **200**  | **Normal**                             |
| 201      | Normal, edited                         |
| **≥400** | **Restricted to certain behaviour**    |
| 401      | Edited, disallow commenting            |

### [C] postStatisticsHistory

\* Maintained by automation script

```typescript
{
     _id: string; // mongodb obejct id
    
    postId: string;    
 	createdTime: number; // created time of this document (post statistics snapshot)
    postStatisticsObj: { [key: timeStr]: PostStatistics }
}
```

### Type PostStatistics

```typescript
{
    totalHitCount: number;
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;
}
```





## 📋PostRanking

### [C] postRankingStatistics 

\* Maintained by automation script

```json
{
    _id: ObjectId; // mongodb obejct id
    
    rankingId: string; // post ranking id
    channelId: string; // all/food/shopping/etc.
    postRankingObj: PostRankingStatistics;
}
```

| RankingId | Desc |
| --------- | ---- |
| 24H_NEW   |      |
| 24H_HOT   |      |
| 7D_HOT    |      |
| 30D_HOT   |      |

### [C] postRankingStatisticsHistory

\* Maintained by automation script

```typescript
{
    _id: string; // mongodb obejct id
    
    //// ranking info ////
    rankingId: string; // post ranking id
    channelId: string; // all/food/shopping/etc.
    createTime: number; // reated time of this document (post ranking statistics snapshot)
    postRankingStatisticsObj: { [key: timeStr]: PostRankingStatistics }
}
```

### Type PostRankingStatistics

```typescript
{
    [key: postIdStr]: {
       postId: string;
       title: string;
       imageUrl: string; // url string of the first image or empty ("")
   }
}
```





## Reference

- MongoDB - Find a document [Link](https://www.mongodb.com/docs/drivers/node/current/usage-examples/find/)







# Systems Design

\* Terms:

- est: Establish / Initialize
- acc: Accumulate
- inc: Increase
- dec: Decrease

## ▶️MemberLogin

| Behaviour              | Affected tables / collections                                |
| ---------------------- | ------------------------------------------------------------ |
| Register a member 🆕    | **[RL]** LoginCredentialsMapping,<br />**[T]** MemberLogin ***(MojitoMemberSystem registeration only)***,<br />**[T]** MemberComprehensive***.Info (est.)***,<br />**[T]** MemberComprehensice***.Management (est.)***,<br />**[C]** memberLoginRecords ***(est.)*** |
| Verify email address 🆕 | **[T]** MemberComprehensive.Info,<br />**[T]** MemberComprehensive.Management,<br />**[PRL]** Statistics ***(est.)***,<br />**[C]** memberStatistics ***(est.)***<br />**[C]** notification ***(est.)*** |
|                        |                                                              |

### 🔁Login with Mojito Member System

1. Look up email address (hash) in **[C] MemberComprehensive**
2. Retrieve member id or return error if no record
3. Look up login credential (password hash) in **[T] LoginCredentials**
4. Retrieve password hash or return error if no record
5. Match password hashes

### 🔁Login with Third-party login provider

1. Look up email address (hash) in **[C] MemberComprehensive**
2. Create new member info if no record

## ▶️MemberInfo

| Behaviour            | Affected tables / collections                               |
| -------------------- | ----------------------------------------------------------- |
| UpdateAvatarImageUrl | **[T]** MemberComprehensive.Info                            |
| Update Nickname      | **[T]** MemberComprehensive.Info, **[PRL]** NicknameMapping |
| Update Password      | **[T]** MemberLogin                                         |
| Reset Password       | **[T]** MemberLogin                                         |
| Update BriefIntro    | **[T]** MemberComprehensive.Info                            |
| Update Gender        | **[T]** MemberComprehensive.Info                            |
| Update Birthday      | **[T]** MemberComprehensive.Info                            |

### 💡Forbid Members frequently updating their avatar image 

Only allow updating avatar image after 7 days since last update.

```typescript
const {Timestamp: lastModifiedTime} = MemberInfoQueryResult.value;
const diff:number = new Date().getTime() - new Date(lastModifiedTime).getTime();
if (diff < 604800000) {
    // allow updating avatar image
}
```

### 💡Forbid Members frequently updating their nicknames

Only allow updating nickname after 7 days since last update

```typescript
// Same as above
```

### 💡Forbid Members frequently updating other info

Only allow updating other info after 30 seconds since last update

```
您更新太频繁了，请稍候片刻再重试
```

## ▶️Members

| Behaviour                  | Affected tables / collections                                |
| -------------------------- | ------------------------------------------------------------ |
| Follow / Unfollow a member | **[RL]** FollowingMemberMapping,<br />**[PRL]** FollowedByMemberMapping,<br />**[PRL]** NotifyFollowed,<br />**[C]** Notification ***(accumulate)***,<br />**[C]** MemberStatistics ***(accumulate)*** |
| Block a member 🆕           | **[RL]** BlockedMemberMapping,<br />**[PRL]** BLockedByMemberMapping,<br />**[C]** MemberStatistics ***(accumulate)*** |

## ▶️Comment

| Behaviour                                                    | Affected tables / collections                                |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Create<br /> / Reply to a post<br />(Cue a member)           | **[T]** PostCommentMappingComprehensive ***(est.)***,<br />**[PRL]** NotifyReplied ***(est.)***,<br />**[C]** Notification***.repliedCount (acc.)***,<br />( Cond. **[PRL]** NotifyCued ***(est.)*** ),<br />( Cond. **[C]** Notification***.cuedCount (acc.)*** ),<br />**[C]** CommentStatistics*** (est.)***,<br />**[C]** memberStatistics***.commentCount (acc.)***,<br />**[C]** PostStatistics***.totalCommentCount (acc.)***,<br />**[C]** TopicStatistics***.totalCommentCount (acc.)***,<br />**[C]** ChannelStatistics***.totalCommentCount (acc.)*** |
| Edit a comment<br />(Only allowed once,<br /> Editing results in losing<br />like / dislike data)🆕 | **[T]** PostCommentMappingComprehensive ***(put)***,<br />**[C]** commentStatistics***.liked&dislikeCount (put)***,🆕<br />**[C]** memberStatistics***.editCommentCount (acc.)***,<br />( Cond. **[PRL]** NotifyCued ***(est.)*** ),<br />( Cond. **[C]** Notification*.cuedCount* ***(acc.)*** ) |
| Delete a comment                                             | **[T]** PostCommentMappingComprehensive ***(put)***,<br />**[C]** MemberStatistics***.deleteCommentCount (acc.)*** |
| Like / Dislike a comment                                     | **[PRL]** AttitudeCommentMapping,<br />**[PRL]** NotifyLiked,<br /> (Cond. **[C]** Notification***.likedCount (acc.)*** ),<br />**[C]** CommentStatistics***.liked/dislikedCount (inc./dec.)*** |

## ▶️Subcomment

| Behaviour                                                | Affected tables / collections                                |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Create<br /> / Reply to a subcomment<br />(Cue a member) | **[T]** CommentSubcommentMappingComprehensive ***(est.)***,<br />**[PRL]** NotifyReplied ***(est.)***,<br />**[C]** notification***.repliedCount (acc.)***,<br />( Cond. **[PRL]** NotifyCued ***(est.)*** ),<br />( Cond. **[C]** Notification***.cuedCount (acc.)*** ),<br />**[C]** subcommentStatistics ***(est.)***,<br />**[C]** commentStatistics***.subcommentCount (acc.)*** |
| Edit a subcomment                                        | **[T]** CommentSubcommentMappingComprehensive ***(put)***,<br />**[C]** subcommentStatistics***.liked&dislikeCount (put)***,🆕<br />**[C]** memberStatistics***.editSubcommentCount (acc.)***,<br />( Cond. **[PRL]** NotifyCued ***(est.)*** ),<br />( Cond. **[C]** Notification*.cuedCount* ***(acc.)*** ) |
| Delete a subcomment                                      | **[T]** CommentSubcommentMappingComprehensive ***(put)***,<br />**[C]** MemberStatistics***.deleteSubcommentCount (acc.)*** |
| Like / Dislike a subcomment                              | **[PRL]** AttitudeSubcommentMapping,<br />**[PRL]** NotifyLiked,<br /> (Cond. **[C]** Notification***.likedCount (acc.)*** ),<br />**[C]** SubcommentStatistics***.liked/dislikedCount (inc./dec.)*** |

## ▶️Topic

| Behaviour      | Affected tables / collections                         |
| -------------- | ----------------------------------------------------- |
| Create a topic | **[T]** TopicComprehensive, **[C]** ChannelStatistics |

## ▶️Post

| Behaviour                       | Affected tables / collections                                |
| ------------------------------- | ------------------------------------------------------------ |
| View a post                     | **[RL]** HistoryMapping,<br />**[C]** PostStatistics ***(accumulate)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)***, |
| Create a post                   | **[T]** PostComprehensive,<br />**[RL]** CreationsMapping,<br />**[C]** PostStatistics ***(establish)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)***,<br />(**[PRL]** NotifyCued),<br />(**[C]** Notification) |
| Edit a post                     | **[T]** PostComprehensive,<br />(**[PRL]** NotifyCued),<br />(**[C]*** Notification) |
| Delete a post                   | **[T]** PostComprehensive,<br />**[RL]** CreationsMapping ***(cleanup)*** |
| Save a post                     | **[RL]** SavedMapping,<br />**[PRL]** NotifySaved,<br />**[C]** Notification ***(accumulate)***,<br />**[C]** PostStatistics ***(accumulate)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)***, |
| Like / Dislike a post           | **[PRL]** PostAttitudeMapping,<br />**[PRL]** NotifyLiked,<br />**[C]** Notification ***(accumulate)***,<br />**[C]** PostStatistics ***(accumulate)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)*** |
| Share a post<br />(🚫Not-in-use) |                                                              |



# APIs

## Member SignUp

### POST|`/api/member/behaviour/signup/index`

| Behaviour | Affected table                                               |
| --------- | ------------------------------------------------------------ |
| Signup    | [T] LoginCredentialsMapping,<br />[T] MemberLogin,<br />[T] MemberComprehensive |



## Member Login

### POST|`/api/auth/[...nextauth]`





## Member Info & Statistics

### GET|`/api/member/info/[id]`

### POST|`/api/member/info/[id]`

| Behaviour                              | Affected table          |
| -------------------------------------- | ----------------------- |
| Update member info, e.g., EmailAddress | [T] MemberComprehensive |

\* Identity verification required.

### POST|`/api/member/behaviour/follow/[id]`

| Behaviour                  | Affected table                                               |
| -------------------------- | ------------------------------------------------------------ |
| Follow / Unfollow a member | **[RL]** FollowingMemberMapping,<br />**[PRL]** FollowedByMemberMapping,<br />**[PRL]** NotifyFollowed,<br />**[C]** Notification ***(accumulate)***,<br />**[C]** MemberStatistics ***(accumulate)*** |

\* Identity verification required.

### POST|`/api/member/behaviour/block/[id]`

| Behaviour      | Affected table                                               |
| -------------- | ------------------------------------------------------------ |
| Block a member | **[RL]** BlockedMemberMapping,<br />**[PRL]** BLockedByMemberMapping,<br />**[C]** MemberStatistics ***(accumulate)*** |

\* Identity verification required.

### GET|`/api/member/behaviour/resetpassword/request?emaillAddress=`





## Comment Info & Statistics

### GET|`/api/comment/s/of/[postId]`

get comments by post id

### POST|`/api/comment/of/[postId]/info/index`

| Behaviour                                          | Affected table                                               |
| -------------------------------------------------- | ------------------------------------------------------------ |
| Create<br /> / Reply to a post<br />(Cue a member) | **[T]** PostCommentMappingComprehensive ***(est.)***,<br />**[PRL]** NotifyReplied ***(est.)***,<br />**[C]** notification***.repliedCount (acc.)***,<br />( Cond. **[PRL]** NotifyCued ***(est.)*** ),<br />( Cond. **[C]** Notification***.cuedCount (acc.)*** ),<br />**[C]** commentStatistics*** (est.)***,<br />**[C]** memberStatistics***.commentCount (acc.)***,<br />**[C]** postStatistics***.totalCommentCount (acc.)***,<br />**[C]** topicStatistics***.totalCommentCount (acc.)***,<br />**[C]** channelStatistics***.totalCommentCount (acc.)*** |

\* Identity verification required.

#### Steps:

1. createEntity (commentInfo:ICommentInfo) to [T] PostCommentMappingComprehensive

2. createEntity (noticeInfo:INoticeInfo) [PRL] NotifyReplied

   1. If cued, createEntity (noticeInfo:INoticeInfo) [PRL] NotifyCued

3. accumulate Notification.repliedCount

   1. If cued, accumulate Notification.cuedCount

4. createDocument (commentStatistics) to [C] commentStatistics

5. accumulate memberStatistics.commentCount

   ...

### GET|`/api/comment/of/[postId]/info/[commentId]`

get comment info by post id & comment id

### POST|`/api/comment/of/[postId]/info/[commentId]`

| Behaviour                | Affected table                                               |
| ------------------------ | ------------------------------------------------------------ |
| Like / Dislike a comment | **[PRL]** AttitudeCommentMapping,<br />**[PRL]** NotifyLiked,<br /> (Cond. **[C]** Notification***.likedCount (acc.)*** ),<br />**[C]** CommentStatistics***.liked/dislikedCount (inc. / dec.)*** |

\* Identity verification required.

### PUT|`/api/comment/of/[postId]/info/[commentId]`

| Behaviour      | Affected table                                               |
| -------------- | ------------------------------------------------------------ |
| Edit a comment | **[T]** PostCommentMappingComprehensive ***(put)***,<br />**[C]** CommentStatistics***.liked&dislikeCount (put)***,🆕<br />**[C]** MemberStatistics***.editCommentCount (acc.)***,<br />( Cond. **[PRL]** NotifyCued ***(est.)*** ),<br />( Cond. **[C]** Notification*.cuedCount* ***(acc.)*** ) |

\* Identity verification required.

### DELETE|`/api/comment/of/[postId]/info/[commentId]`

| Behaviour        | Affected table                                               |
| ---------------- | ------------------------------------------------------------ |
| Delete a comment | **[T]** PostCommentMappingComprehensive ***(put)***,<br />**[C]** MemberStatistics***.deleteCommentCount (acc.)*** |

\* Identity verification required.







## Subcomment Info & Statistics

Update 13/12/2022: Subcomment statistics no longer counted in post/topic/channel statistics. Only a few items are counted in member statistics

### GET|`/api/subcomment/s/of/[commentId]`

get subcomments by comment id

### POST|`/api/subcomment/of/[commentId]/info/index`

| Behaviour                                                | Affected table                                               |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Create<br /> / Reply to a subcomment<br />(Cue a member) | **[T]** CommentSubcommentMappingComprehensive,<br />**[PRL]** NotifyReplied,<br />**[C]** Notification ***(accumulate)***,<br />**[C]** SubcommentStatistics ***(establish)***,<br />**[C]** CommentStatistics ***(accumulate)***,<br />**[C]** PostStatistics ***(accumulate)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)*** |

\* Identity verification required.

### GET|`/api/subcomment/of/[commentId]/info/[subcommentId]`

get subcomment info by commentid & subcomment id

### POST|`/api/subcomment/of/[commentId]/info/[subcommentId]`

| Behaviour                   | Affected table                                               |
| --------------------------- | ------------------------------------------------------------ |
| Like / Dislike a subcomment | **[PRL]** AttitudeSubommentMapping,<br />**[PRL]** NotifyLiked,<br />( Cond. **[C]** Notification***.likedCount (acc.)*** ),<br />**[C]** SubcommentStatistics***.liked/dislikedCount (inc. / dec.)*** |

\* Identity verification required.

### PUT|`/api/subcomment/of/[commentId]/info/[subcommentId]`

| Behaviour      | Affected table                                |
| -------------- | --------------------------------------------- |
| Edit a comment | **[T]** CommentSubcommentMappingComprehensive |

\* Identity verification required.

### DELETE|`/api/subcomment/of/[commentId]/info/[subcommentId]`

| Behaviour        | Affected table                                |
| ---------------- | --------------------------------------------- |
| Delete a comment | **[T]** CommentSubcommentMappingComprehensive |

\* Identity verification required.







## Topic Info & Statistics

### GET| `/api/topic/[id]`

### GET| `/api/topic/of/channel/[id]`

### POST| `/api/topic/index`

| Behaviour      | Affected table                                        |
| -------------- | ----------------------------------------------------- |
| Create a topic | **[T]** TopicComprehensive, **[C]** ChannelStatistics |





## Post Info & Statistics

### GET|`/api/post/info/[id]`

| Behaviour   | Affected table                                               |
| ----------- | ------------------------------------------------------------ |
| View a post | **[RL]** HistoryMapping,<br />**[C]** PostStatistics ***(accumulate)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)*** |

### POST|`/api/post/info/index`

| Behaviour     | Affected table                                               |
| ------------- | ------------------------------------------------------------ |
| Create a post | **[T]** PostComprehensive,<br />**[RL]** CreationsMapping,<br />**[C]** PostStatistics ***(establish)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)*** |

\* Identity verification required.

### PUT|`/api/post/info/[id]`

| Behaviour   | Affected table            |
| ----------- | ------------------------- |
| Edit a post | **[T]** PostComprehensive |

\* Identity verification required.

### DELETE|`/api/post/info/[id]`

| Behaviour     | Affected table                                               |
| ------------- | ------------------------------------------------------------ |
| Delete a post | **[T]** PostComprehensive,<br />**[RL]** CreationsMapping ***(cleanup)*** |

\* Identity verification required.

### POST|`/api/post/behaviour/save/[id]`

| Behaviour   | Affected table                                               |
| ----------- | ------------------------------------------------------------ |
| Save a post | **[RL]** SavedMapping,<br />**[PRL]** NotifySaved,<br />**[C]** Notification ***(accumulate)***,<br />**[C]** PostStatistics ***(accumulate)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)*** |

\* Identity verification required.

### POST|`/api/post/behaviour/attitude/[id]`

| Behaviour             | Affected table                                               |
| --------------------- | ------------------------------------------------------------ |
| Like / Dislike a post | **[PRL]** PostAttitudeMapping,<br />**[PRL]** NotifyLiked,<br />**[C]** Notification ***(accumulate)***,<br />**[C]** PostStatistics ***(accumulate)***,<br />**[C]** TopicStatistics ***(accumulate)***,<br />**[C]** ChannelStatistics ***(accumulate)*** |

\* Identity verification required.



 







# Mail

## Use Azure Communication Service to send emails

## Send an email

```shell
npm i @azure/communication-email
```



[Reference](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email?pivots=programming-language-javascript)





# Ui Design

## Swiper on home page

Options

- [Swiper](https://swiperjs.com/get-started)



## Post FormData(image) to API

During dev, three ways of posting form data has been tested but finally the way using `Axios` has been accepted.

### Fetch API (JSON)

```typescript
/// using fetch
const resp = await fetch('/api/image/putImage', {
    method: 'POST',
    body: JSON.stringify({
        file: formdata
    })
})
console.log(await resp.text())
```

### XMLHttpRequest (FormData)

```typescript
// using XMLHttpRequest
const request = new XMLHttpRequest();
request.open('POST', '/api/image/putImage');
request.setRequestHeader('content-type', 'multipart/form-data; boundary=null'); // boundary must be set? During tests it is
request.send(formData);
```

### Axios (FormData with progress indicator) 

```typescript
let formData = new FormData();
const config = {
    headers: { 'Content-Type': 'multipart/form-data' }, // headers must be in correct 
    onUploadProgress: (event) => {
        console.log(`Current progress:`, Math.round((event.loaded * 100) / event.total));
    },
};
formData.append('uploadpic', uploadFileList, (uploadFileList as any).name);

const response = await axios.post('/api/image/putImage', formData, config);
console.log('response', response.data);
```



## MUI Theme

- With `themeProvider` can easily modify the default mui theme

  ```tsx
  const theme = createTheme({
      palette: {
          primary: 'black'
      }
  })
  
  return(
      <ThemeProvider theme={theme}>
      </ThemeProvider>
  )
  ```

  

- With `<CssBaseline />` can disable all the default css styles

  ```
  <h3></h3> => <div></div>
  ```




## Error Page

| Error                        | Origin | Desc |
| ---------------------------- | ------ | ---- |
| AccessDenied                 | signin |      |
| EmailAddressUnverified       | signin |      |
| InappropriateEmailAddress    |        |      |
| PermissionDenied             |        |      |
| MemberSuspendedOrDeactivated | signin |      |
| MemberDeactivated            | signin |      |





# Db & Storage

## Using Azure Data Tables Api

```
npm install @azure/data-tables
```

## Docs Reference

[Reference](https://www.npmjs.com/package/@azure/data-tables/v/13.0.0)

## `&` Used in no-standard CSS

```scss
a {
   color:#ff0000;
   &:hover {
      color:#0000ff;
   }
}
```

```css
a {
   color:#ff0000;
}

a:hover {
   color:#0000ff;
}
```



## Authorize access to data in Azure Storage

> Each time you access data in your storage account, your client  application makes a request over HTTP/HTTPS to Azure Storage. By  default, every resource in Azure Storage is secured, and every request  to a secure resource must be authorized. Authorization ensures that the  client application has the appropriate permissions to access a  particular resource in your storage account.

[Reference](https://learn.microsoft.com/en-us/azure/storage/common/authorize-data-access)



# Authenticate & Authorize

## NextAuth.js

[Reference](https://next-auth.js.org/)

[Example](https://github.com/nextauthjs/next-auth-example)

## Use JWT

Use dependencies

-  [JWT](https://www.npmjs.com/package/jsonwebtoken)
- [Cookie](https://www.npmjs.com/package/cookie)

Demo

 * Reference NextJS cookie [demo](https://github.com/vercel/next.js/blob/deprecated-main/examples/api-routes-middleware/utils/cookies.js) 

 * Mojito demo

    ```typescript
    const privateKey = 'hello_mojito';
    const options = {
        httpOnly: true,
        maxAge: 15 * 60 // 15 minutes
    };
    const token = jwt.sign({ // payload
        memberId: '0',
        memberNickname: 'henrycechen',
    }, privateKey);
    // name, token, options
    res.setHeader('Set-Cookie', cookie.serialize('grant-token', token, options)); 
    res.status(200).send('Valid token');
    ```

    



```typescript
export default async function Verify(req: NextApiRequest, res: NextApiResponse) {
    const { method, url, query } = req;
    if ('GET' !== method) {
        res.status(403).send(`${url}: ${method} is not allowed`);
    } else if ('string' !== typeof query.token) {
        res.status(403).send('Invalid token');
    } else {
        const info = btoa(query.token);
        // verify memberif against token
        const match = true;
        if (match) {
            res.status(200).send('Valid token');
        } else {
            res.status(403).send('Invalid token');
        }
    }
}
```



## A study on `[...nextauth].ts`

### `signin({ user, account, profile, email, credentials })` callback

**A credential signIn will get the result**

- user

  ```json
  {
    id: '6TTK1WH0OD',
    email: 'henrycechen@gmail.com',
    image: 'imageUrl',
    emailAddress: 'henrycechen@gmail.com',
    nickname: '',
    avatarImageUrl: ''
  }
  ```

- account

  ```json
  {
    providerAccountId: '6TTK1WH0OD',
    type: 'credentials',
    provider: 'credentials'
  }
  ```

- profile

  ```json
  undefined
  ```

- email

  ```json
  undefined
  ```

- credentials

  ```json
  {
    recaptchaResponse: '03AEkXODAaGpnQMK...MkUWaWNsqrg',
    emailAddress: 'henrycechen@gmail.com',
    password: '123@abcD',
    csrfToken: 'c998d89b2402c3fd18f3cd0e06ba17917461248e08f098f8e72837aab3dbe335',
    callbackUrl: 'http://localhost/signin?callbackUrl=http%3A%2F%2Flocalhost%2F',
    json: 'true'
  }
  ```

  

**A GitHub user signIn will get the result**

- user

  ```json
  {
    id: '74887388',
    name: 'HenryCeChen',
    email: 'henrycechen@gmail.com',
    image: 'https://avatars.githubusercontent.com/u/74887388?v=4'
  }
  ```
  
- account

  ```json
  {
    provider: 'github',
    type: 'oauth',
    providerAccountId: '74887388',
    access_token: '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',
    token_type: 'bearer',
    scope: 'read:user,user:email'
  }
  ```

- profile

  ```json
  {
    login: 'henrycechen',
    id: 74887388,
    node_id: 'MDQ6VXNlcjc0ODg3Mzg4',
    avatar_url: 'https://avatars.githubusercontent.com/u/74887388?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/henrycechen',
    html_url: 'https://github.com/henrycechen',
    followers_url: 'https://api.github.com/users/henrycechen/followers',
    following_url: 'https://api.github.com/users/henrycechen/following{/other_user}',
    gists_url: 'https://api.github.com/users/henrycechen/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/henrycechen/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/henrycechen/subscriptions',
    organizations_url: 'https://api.github.com/users/henrycechen/orgs',
    repos_url: 'https://api.github.com/users/henrycechen/repos',
    events_url: 'https://api.github.com/users/henrycechen/events{/privacy}',
    received_events_url: 'https://api.github.com/users/henrycechen/received_events',
    type: 'User',
    site_admin: false,
    name: 'HenryCeChen',
    company: null,
    blog: '',
    location: null,
    email: 'henrycechen@gmail.com',
    hireable: null,
    bio: null,
    twitter_username: null,
    public_repos: 8,
    public_gists: 0,
    followers: 0,
    following: 0,
    created_at: '2020-11-23T02:50:11Z',
    updated_at: '2022-11-02T08:19:09Z',
    private_gists: 0,
    total_private_repos: 2,
    owned_private_repos: 2,
    disk_usage: 12274,
    collaborators: 0,
    two_factor_authentication: false,
    plan: {
      name: 'free',
      space: 976562499,
      collaborators: 0,
      private_repos: 10000
    }
  }
  ```

- email

  ```json
  undefined
  ```

- credentials

  ```json
  undefined
  ```
  



### `jwt({ token, user, account, profile })` callback

**A GitHub user signIn will get the result (first call of jwt())**

- token

  ```json
  {
    name: 'HenryCeChen',
    email: 'henrycechen@gmail.com',
    picture: 'https://avatars.githubusercontent.com/u/74887388?v=4',
    sub: '74887388'
  }
  ```
  
- user

  ```json
  {
    id: '74887388',
    name: 'HenryCeChen',
    email: 'henrycechen@gmail.com',
    image: 'https://avatars.githubusercontent.com/u/74887388?v=4'
  }
  ```
  
- account

  ```json
  {
    provider: 'github',
    type: 'oauth',
    providerAccountId: '74887388',
    access_token: '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',
    token_type: 'bearer',
    scope: 'read:user,user:email'
  }
  ```
  
- profile

  ```json
  {
    login: 'henrycechen',
    id: 74887388,
    node_id: 'MDQ6VXNlcjc0ODg3Mzg4',
    avatar_url: 'https://avatars.githubusercontent.com/u/74887388?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/henrycechen',
    html_url: 'https://github.com/henrycechen',
    followers_url: 'https://api.github.com/users/henrycechen/followers',
    following_url: 'https://api.github.com/users/henrycechen/following{/other_user}',
    gists_url: 'https://api.github.com/users/henrycechen/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/henrycechen/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/henrycechen/subscriptions',
    organizations_url: 'https://api.github.com/users/henrycechen/orgs',
    repos_url: 'https://api.github.com/users/henrycechen/repos',
    events_url: 'https://api.github.com/users/henrycechen/events{/privacy}',
    received_events_url: 'https://api.github.com/users/henrycechen/received_events',
    type: 'User',
    site_admin: false,
    name: 'HenryCeChen',
    company: null,
    blog: '',
    location: null,
    email: 'henrycechen@gmail.com',
    hireable: null,
    bio: null,
    twitter_username: null,
    public_repos: 8,
    public_gists: 0,
    followers: 0,
    following: 0,
    created_at: '2020-11-23T02:50:11Z',
    updated_at: '2022-11-02T08:19:09Z',
    private_gists: 0,
    total_private_repos: 2,
    owned_private_repos: 2,
    disk_usage: 12274,
    collaborators: 0,
    two_factor_authentication: false,
    plan: {
      name: 'free',
      space: 976562499,
      collaborators: 0,
      private_repos: 10000
    }
  }
  ```







# Anti-Robot

## ReCAPTCHA

[recaptcha console](https://www.google.com/u/4/recaptcha/admin/site/584181821)

### 使用ReCAPTCHA保护所有不被NextAuth保护的API Endpoint

本节使用Change password service作为例子。

本服务器使用第三方依赖`react-google-recaptcha`提供ReCAPTCHA component。

在每次与API交互时，Request中都必须包含`recaptchaResponse`，否则服务器会拒绝服务并返回403状态码。

```typescript
// step #1 verify if it is bot
if ('string' !== typeof recaptchaResponse || '' === recaptchaResponse) {
    res.status(403).send('Invalid ReCAPTCHA response');
    return;
}
if ('' === recaptchaServerSecret) {
    response500(res, 'ReCAPTCHA shared key not found');
    return;
}
const recaptchaVerifyResp = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaServerSecret}&response=${recaptchaResponse}`, { method: 'POST' })
// [!] invoke of json() make the probability of causing TypeError
const { success } = await recaptchaVerifyResp.json();
if (!success) {
    res.status(403).send('ReCAPTCHA failed');
    return;
}
```



### Solve react-google-recaptcha null ref issue

This demo is used to reset ReCAPTCHA challenge

```typescript
let Recaptcha: any;
// ...
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
	event.preventDefault();
    // ...
    Recaptcha?.reset();
}
return (
	{/* React Components */}
    <ReCAPTCHA
        // ...
        ref={(ref: any) => ref && (Recaptcha = ref)}
    />
)
```

[Reference](https://stackoverflow.com/questions/46514194/how-to-reset-google-recaptcha-with-react-google-recaptcha)



## AES

### Change password service

本服务器使用AES产生修改密码的令牌。

使用伪随机数产生`resetPasswordToken`，添加到`requestInfo`中，后作为凭据唤出修改密码界面

```typescript
const info: ResetPasswordRequestInfo = {
    memberId,
    resetPasswordToken: token,
    expireDate: new Date().getTime() + 15 * 60 * 1000 // set valid time for 15 minutes
}
```

由于AES加密会使用`+`、`/` 等字符，所以再加密后再做了一次Base64

```typescript
Buffer.from(CryptoJS.AES.encrypt(JSON.stringify(info), appSecret).toString()).toString('base64')
```

以下为实际测试用例中的`requestInfo`的载荷

```
VTJGc2RHVmtYMS9HQWQydEQ1aFJMUXlmUDhoYXJlZzJjNW0vMEJ3SCttcFhhUXdTZFF3RGtyNjN4OXcxWWFPOGt1cTJvTmpQTGU0SEo2OE9hamdUOUJVZWQyVXNteDhFTFhHZnZrcFBvVi93YSs0b3NmQ1Fsanl2eGpZOEFiUnQ= 
```

解密后的JSON Object如下

```json
{
    "memberId":"1",
    "resetPasswordToken":"12E3EF56BBE8AC",
    "expireDate":1667912944866
}
```

解密后的Info无需访问数据库即可得知`memberId`并判断Token是否过期



# Error Definitions

|Number|M



# Dev



## Use Azure Storage

[Reference](https://learn.microsoft.com/en-us/azure/storage/queues/storage-nodejs-how-to-use-queues?tabs=javascript)



## Use Gmail Api to send emails

[Youtube](https://www.youtube.com/watch?v=-rcRf7yswfM)



## [TS] Option '--resolveJsonModule' cannot be specified without 'node' module resolution strategy.

In `tsconfig.json` file,

the defult settings is configured to 

```json
"resolveJsonModule": true,
```

The compiler was yelling

```
Option '--resolveJsonModule' cannot be specified without 'node' module resolution strategy.
```

Also in the other TS file

```
Cannot find module 'next'. Did you mean to set the 'moduleResolution' option to 'node', or to add aliases to the 'paths' option?
```

### Solution

Simply add to `tsconfig.json`

```json
"moduleResolution": "node",
```



# TypeScript

## Type VS Interface

> When to use `type`:
>
> - Use `type` when defining an alias for primitive types (string, boolean, number, bigint, symbol, etc)
> - Use `type` when defining tuple types
> - Use `type` when defining function types
> - Use `type` when defining a union
> - Use `type` when trying to overload functions in object types via composition
> - Use `type` when needing to take advantage of mapped types
>
> When to use `interface`:
>
> - Use `interface` for all object types where using `type` is not required (see above)
> - Use `interface` when you want to take advantage of declaration merging.
>
> [Reference](https://stackoverflow.com/questions/37233735/interfaces-vs-types-in-typescript)

## Extending types with interfaces/extends vs Intersecction types

>  Extending types with interfaces/extends is suggested over creating intersection types.
>
> [Reference](https://stackoverflow.com/questions/37233735/interfaces-vs-types-in-typescript)



## Union Type

```typescript
let a = number | null;
```

## Literal Type

```typescript
let a = 50 | 100
```



## Optional property access operator

```typescript
type Customer = {
    birthday?: Date
}

function getCustomer(id: number): Customer | null | undefined {
    return id === 0 ? null: {birthday: new Date()};
}

let customer = getCustomer(0);
// Optional property access operator ?.
console.log(customer?.birthday?.getFullYear())
```

## Optional * operator

```typescript
customer?.[0] // optional element access operator

let log: any =  null;
log?.('a'); // optional call
```





# Reference

## UI - Img Slides - Carousel

[API](https://github.com/Learus/react-material-ui-carousel/blob/master/README.md)



## Create Random name

### Random Hex

```javascript
Math.floor(Math.random()*1677721500).toString(16).toUpperCase();
```

### Random 16

```
Math.floor(Math.random() * Math.pow(10, 16)).toString(16).toUpperCase();
```

### Random 35

```
Math.floor(Math.random() * Math.pow(10, 16)).toString(35).toUpperCase();
```

