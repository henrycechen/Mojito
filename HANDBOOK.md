# The Mojito App 莫希托

8 September 2022 | Established

27 October 2022 | Domain name announced

4 January 2023 | Logo registeration applied

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

- [RL]: Relation record table
- [PRL]: Passive Relation record table (side-affected by operations on the corresponding RL table)

## 📘Member

| Property | Type   | Desc                     |
| -------- | ------ | ------------------------ |
| MemberId | string | 10 characters, UPPERCASE |

### [RL] Credentials

\* This table records the password credentials for login procedure

| PartitionKey        | RowKey                 | MemberId | PasswordHash          |
| ------------------- | ---------------------- | -------- | --------------------- |
| EmailAddressSHA1Str | `"MojitoMemberSystem"` | string   | string, SHA256 String |

| PartitionKey        | RowKey                                 | MemberId |
| ------------------- | -------------------------------------- | -------- |
| EmailAddressSHA1Str | `"GitHubOAuth"`, `"GoogleOAuth"`, etc. | string   |

| PartitionKey        | RowKey                 | VerifyEmailAddressToken |
| ------------------- | ---------------------- | ----------------------- |
| EmailAddressSHA1Str | `"VerifyEmailAddress"` | string                  |

| PartitionKey        | RowKey            | ResetPasswordToken |
| ------------------- | ----------------- | ------------------ |
| EmailAddressSHA1Str | `"ResetPassword"` | string             |

### [RL] FollowingMemberMapping

\* This table records the following member ids of the partition key (member id)

| PartitionKey | RowKey               |
| ------------ | -------------------- |
| MemberIdStr  | FollowingMemberIdStr |

### [PRL] FollowedByMemberMapping

\* This table records the member ids of who have been following the partition key (member id)

| PartitionKey | RowKey                |
| ------------ | --------------------- |
| MemberIdStr  | FollowedByMemberIdStr |

### [RL] BlockingMemberMapping

\* This table records the member ids blocked by the partition key (member id)

| PartitionKey | RowKey              |
| ------------ | ------------------- |
| MemberIdStr  | BlockingMemberIdStr |

### [PRL] BlockedByMemberMapping

\* This table records the member ids of who have been blocking the partition key (member id)

| PartitionKey | RowKey               |
| ------------ | -------------------- |
| MemberIdStr  | BlockedByMemberIdStr |





## 📘Notification

| Property     | Type   | Desc                     |
| ------------ | ------ | ------------------------ |
| NoticeId     | string | 16 characters, UPPERCASE |
| PostTitle    | string |                          |
| CommentBrief | string | maximum 21 characters    |

### [PRL] Notice

#### Cued (@)

| PartitionKey        | RowKey   | Category | InitiateId  | PostId | PostTitle | CommentId | CommentBrief |
| ------------------- | -------- | -------- | ----------- | ------ | --------- | --------- | ------------ |
| NotifiedMemberIdStr | EntityId | `"Cued"` | MemberIdStr | string | string    | string    | string       |

```
- WebMaster在帖子“WebMaster在Mojito发的第一篇帖子”中提到了您
- WebMaster在帖子“WebMaster在Mojito发的第一篇帖子”的评论“可喜可贺可惜可...”中提到了您
```

#### Replied (↩️)

| PartitionKey        | RowKey   | Category    | InitiateId  | PostId | PostTitle | CommentId | CommentBrief |
| ------------------- | -------- | ----------- | ----------- | ------ | --------- | --------- | ------------ |
| NotifiedMemberIdStr | EntityId | `"Replied"` | MemberIdStr | string | string    | string    | string       |

```
- WebMaster回复了您的帖子“WebMaster在Mojito发的第一篇帖子”
- WebMaster在帖子“WebMaster在Mojito发的第一篇帖子”中回复了您的评论“可喜可贺可惜可...”
```

#### Liked (❤️)

| PartitionKey        | RowKey   | Category  | InitiateId  | PostId | PostTitle | CommentId? | CommentBrief? |
| ------------------- | -------- | --------- | ----------- | ------ | --------- | ---------- | ------------- |
| NotifiedMemberIdStr | EntityId | `"Liked"` | MemberIdStr | string | string    | string     | string        |

```
- WebMaster喜欢了您的帖子“WebMaster在Mojito发的第一篇帖子”
- WebMaster喜欢了您在“WebMaster在Mojito发的第一篇帖子”中发表的评论“可喜可贺可惜可...”
```

#### Pinned (⬆️)

| PartitionKey        | RowKey   | Category   | InitiateId  | PostId | PostTitle |
| ------------------- | -------- | ---------- | ----------- | ------ | --------- |
| NotifiedMemberIdStr | EntityId | `"Pinned"` | MemberIdStr | string | string    |

```
- WebMaster置顶了您在“WebMaster在Mojito发的第一篇帖子”中发表的评论“可喜可贺可惜可...”
```

#### Saved (💾)

| PartitionKey        | RowKey   | Category  | InitiateId  | PostId | PostTitle |
| ------------------- | -------- | --------- | ----------- | ------ | --------- |
| NotifiedMemberIdStr | EntityId | `"Saved"` | MemberIdStr | string | string    |

```
- WebMaster收藏了“WebMaster在Mojito发的第一篇帖子”中提到了您
```

#### Followed (🔔)

| PartitionKey        | RowKey   | Category     | InitiateId  |
| ------------------- | -------- | ------------ | ----------- |
| NotifiedMemberIdStr | EntityId | `"Followed"` | MemberIdStr |

```
- WebMaster关注了您
```





## 📘Channel

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

| PartitionKey | RowKey       | CH     | EN     | SvgIconPath |
| ------------ | ------------ | ------ | ------ | ----------- |
| `"Info"`     | ChannelIdStr | string | string | string      |

| PartitionKey | RowKey      | InedxValue                |
| ------------ | ----------- | ------------------------- |
| `"Index"`    | `"default"` | string, stringified array |





## 📘Post

### [RL] HistoryMapping

\* This table records the post ids viewed by the partition key (member id)

| Key          | Type    | Desc           |
| ------------ | ------- | -------------- |
| PartitionKey | string  | MemberIdStr    |
| RowKey       | string  | PostIdStr      |
| IsActive     | boolean | Default `true` |

### [RL] CreationsMapping

\* This table records the post ids published by the partition key (member id)

| Key          | Type    | Desc           |
| ------------ | ------- | -------------- |
| PartitionKey | string  | MemberIdStr    |
| RowKey       | string  | PostIdStr      |
| IsActive     | boolean | Default `true` |

### [RL] SavedMapping

\* This table records the post ids saved by the partition key (member id)

| Key          | Type    | Desc           |
| ------------ | ------- | -------------- |
| PartitionKey | string  | MemberIdStr    |
| RowKey       | string  | PostIdStr      |
| IsActive     | boolean | Default `true` |





## Reference

- Microsoft - Design for Querying [Link](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-for-query)









# Collections (Atlas)

\* Terms:

- [C]: Collection

```shell
mongosh "mongodb+srv://mojito-statistics-dev.cukb0vs.mongodb.net/mojito-statistics-dev" --apiVersion 1 --username dbmaster
```

## 📗Notification

### [C] notificationStatistics

```typescript
{
    _id: ObjectId;
    
    memberId: string;
    cuedCount: number; // accumulated from last reset
    repliedCount: number;
    likedCount: number;
    savedCount: number;
    followedCount: number;
}
```





## 📗Member

### [C] memberComprehensive

`mojito-statistics-dev.comprehensive.member`

```typescript
{
    _id: string;  // mongodb obejct id
    
    //// info ////
    memberId: string; //  7 ~ 8 characters, UPPERCASE, begin with 'M'
    providerId?: string; // "MojitoMemberSystem" | "GitHubOAuth" | ...
    registeredTime?: number;// new Date().getTime()
    verifiedTime?: number;
    emailAddress?: string;
    nickname?: string;
  	avatarImageUrl?: string;
    briefIntro?: string;
    gender?: -1 | 0 | 1;
    birthday?: string;
    
    //// management ////
    status?: number;
    allowPosting?: boolean;
    allowCommenting?: boolean;
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

### [C] loginJournal

`mojito-statistics-dev.journal.login`

```typescript
{
    _id: string; // mongodb obejct id
    memberId: string;
   	category: 'error' | 'success';
    providerId: 'MojitoMemberSystem' | string; // LoginProviderId
    timestamp: string; // new Date().toISOString()
    message: string; // short message, e.g., 'Attempted login while email address not verified.'
}
```

### [C] memberStatistics

`mojito-statistics-dev.statistics.member`

```typescript
{
    _id: string; // mongodb obejct id
    memberId: string;
    
    // creation
    totalCreationCount: number; // info page required
    totalCreationHitCount: number;
    totalCreationEditCount: number;
    totalCreationDeleteCount: number;
    totalCreationLikedCount: number; // info page required
    totalCreationUndoLikedCount: number;
    totalCreationDislikedCount: number;
    totalCreationUndoDislikedCount: number;
    totalCreationSavedCount: number; // info page required
    totalCreationUndoSavedCount: number;
    
    // attitude
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    
    // comment
    totalCommentCount: number;
    totalCommentEditCount: number;
    totalCommentDeleteCount: number;
    totalCommentLikedCount: number;
    totalCommentUndoLikedCount: number;
    totalCommentDislikedCount: number;
    totalCommentUndoDislikedCount: number;
    
    // post
    totalSavedCount: number;
    totalUndoSavedCount: number;
    
    // on other members
    totalFollowingCount: number;
    totalUndoFollowingCount: number;
    totalBlockingCount: number;
    totalUndoBlockingCount: number;
    
    // by other members
    totalFollowedByCount: number; // info page required
    totalUndoFollowedByCount: number;
    totalBlockedByCount: number;
    totalUndoBlockedByCount: number;
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

### 💡Type MemberStatistics

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





## 📗Attitude

### [C] attitudeComprehensive

```typescript
{
    _id: string; // mongodb obejct id
    
    memberId: string;
    postId: string; // divided by post id
    attitude: number; // -1 | 0 | 1
    commentAttitudeMapping: {
        [key: commentIdStr]: number // -1 | 0 | 1
    };
}
```



## 📗Comment

### [C] commentComprehensive

```typescript
{
     _id: string; // mongodb obejct id
    
    //// info ////
    commentId: string; // 12 ~ 13 characters, UPPERCASE, begin with 'C'
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document (comment est.)
    content: string;
    
	//// management ////
    status: number;
    
    //// statistics ////
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalSubcommentCount: number;
    totalSubcommentDeleteCount: number;
    totalEditCount: number;
    
    //// edit info ////
    edited: {
        editedTime: number; // 201: edited | -1/-3: removed
        content: string;
        totalLikedCountBeforeEdit: number;
        totalDislikedCountBeforeEdit: number;
        totalSubcommentCountBeforeEdit: number;
    } | null
}
```

### [C] subcommentComprehensive

```typescript
{
    _id: string; // mongodb obejct id
    
    //// info ////
    commentId: string; // 12 ~ 13 characters, UPPERCASE, begin with 'D'
    parentId: string;
    postId: string;
    memberId: string;
    createdTime: number; // created time of this document (subcomment est.)
    content: string;
    edited: {
        editedTime: number; // 201: edited | -1/-3: removed
        content: string;
        totalLikedCountBeforeEdit: number;
        totalDislikedCountBeforeEdit: number;
    } | null
    
	//// management ////
    commentStatus: number;
    
    //// statistics ////
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalDislikedCount: number;
    totalUndoDislikedCount: number;
    totalEditCount: number;
}
```

### 💡Comment & SubcommentStatus Code

| Code    | Explanation00                          |
| ------- | -------------------------------------- |
| **-3**  | **Deactivated (removed) by WebMaster** |
| -1      | Deactivated (removed)                  |
| **200** | **Normal**                             |
| 201     | Normal, edited                         |





## 📗Channel

### [C] channelStatistics

```json
{
    _id: ObjectId; // mongodb obejct id
    
    //// info ////
    channelId: string; // pre-defined channel id
    createdTime: number;
    
    //// total statistics ////
    totalHitCount: number;
    totalTopicCount: number;
    totalPostCount: number;
    totalPostDeleteCount: number;
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalCommentCount: number; // subcomment included
    totalCommentDeleteCount: number;
    totalSavedCount: number;
    totalUnavedCount: number;
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

### 💡Type ChannelStatistics

```json
{
    totalHitCount: number;
    totalTopicCount: number;
    totalPostCount: number;
    totalCommentCount: number;
}
```





## 📗Topic

### [C] topicComprehensive

```typescript
{
    _id: ObjectIdStr; // mongodb obejct id
    
    //// info ////
    topicId: string; // base64 string from topic content string
    channelId: string;
    createdTime: number; // create time of this document (topic est.)
    
    //// management ////
    status: number;
    
    //// total statistics ////
    totalHitCount: number; // total hit count of total posts of this topic
    totalSearchCount: number;
    totalPostCount: number;
    totalPostDeleteCount: number;
    totalLikedCount: number;
    totalUndoLikedCount: number;
    totalCommentCount: number;
    totalCommentDeleteCount: number;
    totalSavedCount: number;
    totalUndoSavedCount: number;
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

### 💡Type TopicStatistics

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
    channelId: string;
    createdTime: number; // created time of this document (post est. time)
    
    //// management ////
    status: number;
}
```





## 📗TopicRanking

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

### 💡Type TopicRankingStatistics

```typescript
{
   [key: topicIdStr]: {
       topicId: string;
       content: string;
   }
}
```







## 📗Post

### [C] postComprehensive

```typescript
{
    _id: ObjectId; // mongodb obejct id
    
    //// info ////
    postId: string; // 9 ~ 10 characters, UPPERCASE, begin with 'P'
    memberId: string;
    createdTime: number; // created time of this document (post est.)
    title: string;
    imageUrlsArr: string[];
	paragraphsArr: string[];
	channelId: string;
	topicIdsArr: string[];
	pinnedCommentId: string;

    //// management ////
    status: number;

    //// total statistics ////
	totalHitCount: number; // viewed times accumulator
    totalLikedCount: number;
	totalUndolikedCount: number;
    totalDislikedCount: number;
	totalUndoDislikedCount: number;
    totalCommentCount: number;
    totalCommentDeleteCount: number;
    totalSavedCount: number;
	totalUndoSavedCount: number;
	totalEditCount: number;
    
    //// edit info ////
    edited: [
        {
            editedTime: number;
            titleBeforeEdited: string;
            imageUrlsArrBeforeEdited: string[];
            paragraphsArrBeforeEdited: string[];
            channelIdBeforeEdited: string;
            topicIdsArrBeforeEdited: string[];
            totalLikedCountBeforeEdit: number;
            totalDislikedCountBeforeEdit: number;
    	}
	] | null
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

### 💡Type PostStatistics

```typescript
{
    totalHitCount: number;
    totalLikedCount: number;
    totalDislikedCount: number;
    totalCommentCount: number;
    totalSavedCount: number;
}
```





## 📗PostRanking

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

### 💡Type PostRankingStatistics

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

- est: Establish / Initialize / Create
- acc: Accumulate
- inc: Increase
- dec: Decrease

## 📦Signup & Login

### ▶️Register with Mojito Member System

| Behaviour         | Involved tables / collections                                |
| ----------------- | ------------------------------------------------------------ |
| Register a member | [RL] Credentials ***(est.)***,<br />[C] memberComprehensive ***(est.)***<br />[C] memberLoginJournal ***(est.)*** |

1. Look up login credential (email address hash) in **[RL] Credentials**

2. Create a new record of ***LoginCredentials*** in **[RL] Credentials** or return ***"Email registered" error***

   ```json
   {
       partitionKey: "_", // email address hash
       rowKey: "MojitoMemberSystem",
       MemberId: "_", // 10 characters, UPPERCASE
       passwordHash: "_"
   }
   ```

3. **Upsert** a new record of ***VerifyEmailAddressCredentials*** in **[RL] Credentials**

   ```json
   {
       partitionKey: "_", // email address hash
       rowKey: "VerifyEmailAddress",
       VerifyEmailAddressToken: "_", // 8 characters Hex, UPPERCASE
   }
   ```

4. Create a new document of ***MemberComprehensive*** with limited info and management in **[C] memberComprehensive**

   ```json
   {
       //// info ////
       memberId: "_", // 10 characters, UPPERCASE
       providerId: "MojitoMemberSystem",
       registeredTime: 1670987135509,
       emailAddress: "_",
       //// management ////
       status: 0,
       allowPosting: false,
       allowCommenting: false
   }
   ```

5. Create a new document of ***MemberLoginJournal*** in **[C] memberLoginJournal**

   ```json
   {
       memberId: "_",
      	category: 'success',
       providerId: 'MojitoMemberSystem',
       timestamp: "2022-12-14T03:05:35.509Z",
       message: "Registered. Please verify email address to get full access."
   }
   ```

6. Send email

   ```json
   { // base64 string contains info as follows
       memberId: "_",
       providerId: "MojitoMemberSystem",
       emailAddressHash: "",
       token: "" // 8 characters Hex, UPPERCASE
   }
   ```

### ▶️Request for re-send verification email

| Behaviour                  | Involved tables / collections                  |
| -------------------------- | ---------------------------------------------- |
| Request for password reset | [RL] Credentials,<br />[C] memberComprehensive |

1. Look up login credential (email address hash) in **[RL] Credentials**

2. Look up member management (status) in **[C] memberComprehensive** or return ***"Member can not be activated" error (status>0)***

3. Create a new record of ***VerifyEmailAddressCredentials*** in **[RL] Credentials**

   ```json
   {
       partitionKey: "_", // email address hash
       rowKey: "VerifyEmailAddress",
       ResetPasswordToken: "_" // 8 characters Hex, UPPERCASE
   }
   ```

4. Send email

   ```json
   { // base64 string contains info as follows
       memberId: "_",
       providerId: "MojitoMemberSystem",
       emailAddressHash: "_",
       token: "" // 8 characters Hex, UPPERCASE
   }
   ```

*\* This procedure applied for both Mojito Member System signin and Third-party login provider signin.*

*\* This procedure is unable to prohibit users from verifying two members with same the email address. This system allows member shares email addresses between login providers*

### ▶️Verify email address

| Behaviour            | Involved tables / collections                                |
| -------------------- | ------------------------------------------------------------ |
| Verify email address | [RL] Credentials,<br />[C] memberComprehensive,<br />[C] memberStatistics ***(est.)***<br />[C] notificationStatistics ***(est.)*** |

1. Retrieve info from email content

   ```json
   {
       providerId: "MojitoMemberSystem", // "MojitoMemberSystem"| "GitHubOAuth" | undefined (deemed as "MojitoMemberSystem")
       emailAddressHash: "_",
       token: "" // 8 characters Hex, UPPERCASE
   }
   ```

2. Look up login credentials (email address hash) in **[RL] Credentials**

3. Look up verify email address credentials (token) in **[RL] Credentials** or return ***"Member not found" error***

4. Match the verify email address tokens or return ***"Member cannot be activated" error (token not match or not found)***

5. Update member info (status, verified time) in **[C] memberComprehensive** or ***"Member cannot be activated" error***

   ```json
   {
       //// info ////
       verifiedTime: new Date().getTime(),
       gender: 0,
       //// management ////
       status: 200,
       allowPosting: true,
       allowCommenting: true
   }
   ```

6. Create a new document of ***MemberStatistics*** in **[C] memberStatistics**

   ```json
   {
       memberId: "_",
       //// total statistics ////
       totalCreationCount: 0, // info page required
       totalCreationEditCount: 0,
       // ...
   }
   ```

7. Create a new document of ***Notification*** in **[C] notificationStatistics**

   ```json
   {
       memberId: "_",
       newCuedCount: 0, // accumulated from last reset
       newRepliedCount: 0,
       newLikedCount: 0,
       newSavedCount: 0,
       newFollowedCount: 0,
   }
   ```

8. Create a new document of ***MemberLoginJournal*** in **[C] memberLoginJournal**

   ```json
   {
       memberId: "_",
      	category: 'success',
       providerId: 'MojitoMemberSystem',
       timestamp: "2022-12-14T03:05:35.509Z",
       message: "Email address verified."
   }
   ```

### ▶️Request re-send verification email

1. Retrieve request info (email address, provider id) from request body

### ▶️Login with Mojito Member System

| Behaviour                             | Involved tables / collections                                |
| ------------------------------------- | ------------------------------------------------------------ |
| Login with <br />Mojito Member System | [RL] Credentials,<br />[C] memberComprehensive,<br />[C] memberLoginJournal |

1. Look up login credentials (email address hash, password hash) in **[RL] Credentials**

2. Match password hashes or return ***"Member not found" error***

3. Look up member management (status) in **[C] memberComprehensive** or return ***"Email address and password not match" error***

4. Look up member info or return ***"Member not activated" or "Member has been suspended or deactivated" error***

5. Return member info

6. Create a new document of ***MemberLoginJournal*** in **[C] memberLoginJournal**

   ```json
   {
       memberId: "_",
      	category: 'success',
       providerId: 'MojitoMemberSystem',
       timestamp: "2022-12-14T03:05:35.509Z",
       message: "Login."
   }
   ```

### ▶️Login with Third-party login provider

| Behaviour                                   | Involved tables / collections                                |
| ------------------------------------------- | ------------------------------------------------------------ |
| Login with <br />Third-party login provider | [RL] Credentials,<br />[C] memberComprehensive,<br />[C] memberLoginJournal |

1. Look up login credential record (email address hash) in **[RL] Credentials**

2. Look up member management (status) in **[C] memberComprehensive** or

   1. Create a new record of ***LoginCredentials*** in **[RL] Credentials**

      ```json
      {
          partitionKey: "_", // email address hash
          rowKey: "GitHubOAuth", // login (register) with a GitHub account
          MemberId: "_" // 10 characters, UPPERCASE
      }
      ```

   2. **Upsert** a new record of ***VerifyEmailAddressCredentials*** in **[RL] Credentials**

      ```json
      {
          partitionKey: "_", // email address hash
          rowKey: "VerifyEmailAddress",
          VerifyEmailAddressToken: "_", // 8 characters Hex, UPPERCASE
      }
      ```

   3. Create a new document of ***MemberComprehensive*** with limited info and management in **[C] memberComprehensive**

      ```json
      {
          //// info ////
          memberId: "_", // 10 characters, UPPERCASE
          providerId: "GitHubOAuth", // login (register) with a GitHub account
          registeredTime: 1670987135509,
          emailAddress: "_",
          nickname: "_",
         	avatarImageUrl: "_",
          //// management ////
          status: 0,
          allowPosting: false,
          allowCommenting: false
      }
      ```

   4. Create a new document of ***MemberLoginJournal*** in **[C] memberLoginJournal** 

      ```json
      {
          memberId: "_",
         	category: 'success',
          providerId: 'GitHubOAuth',
          timestamp: "2022-12-14T03:05:35.509Z",
          message: "Registered."
      }
      ```

   5. Send email (notice member to go over **▶️Verify email address** procedure before signin)

      ```json
      { // base64 string contains info as follows
          memberId: "_",
          providerId: "GitHubOAuth",
          emailAddressHash: "_",
          token: "" // 8 characters Hex, UPPERCASE
      }
      ```

4. Return member info or return ***"Member not activated" or "Member has been suspended or deactivated" error***

5. Create a new document of ***MemberLoginJournal*** in **[C] memberLoginJournal**

   ```typescript
   {
       memberId: "_",
      	category: 'success',
       providerId: 'GitHubOAuth',
       timestamp: "2022-12-14T03:05:35.509Z",
       message: "Login."
   }
   ```

## 📦Member Info

### ▶️Request for password reset

| Behaviour                  | Involved tables / collections |
| -------------------------- | ----------------------------- |
| Request for password reset | [RL] Credentials              |

1. Look up login credentials (email address hash) in **[RL] Credentials**

2. Create a new record of ***ResetPasswordCredentials*** in **[RL] Credentials** or return ***"Member not found" error***

   ```json
   {
       partitionKey: "_", // email address hash
       rowKey: "ResetPassword",
       ResetPasswordToken: "_" // 8 characters Hex, UPPERCASE
   }
   ```

3. Send email

   ```json
   { // base64 string contains info as follows
       emailAddressHash: "_",
       token: "" // 8 characters Hex, UPPERCASE
   }
   ```

### ▶️Reset password

| Behaviour      | Involved tables / collections |
| -------------- | ----------------------------- |
| Reset Password | [RL] Credentials              |

1. Look up login credentials (email address hash) in **[RL] Credentials** or return ***"Member not found" error***

2. Look up reset password credentials (token) in **[RL] Credentials**

3. Verify modified timestamp and match the reset password tokens or return ***"Password cannot be reset" error (token not match or not found)***

4. Return (success)

5. Create a new document of ***MemberLoginJournal*** in **[C] memberLoginJournal**

   ```json
   {
       memberId: "_",
      	category: 'success',
       providerId: 'MojitoMemberSystem',
       timestamp: "2022-12-14T03:05:35.509Z",
       message: "Reset password."
   }
   ```

   

### ▶️Update member info

| Behaviour             | Involved tables / collections |
| --------------------- | ----------------------------- |
| Update AvatarImageUrl | [C] memberComprehensive       |
| Update Nickname       | [C] memberComprehensive       |
| Update Password       | [RL] Credentials              |
| Update BriefIntro     | [C] memberComprehensive       |
| Update Gender         | [C] memberComprehensive       |
| Update Birthday       | [C] memberComprehensive       |

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

## 📦Behaviour on other Members

### ▶️Follow/Unfollow a member

| Behaviour                  | Affected tables / collections                                |
| -------------------------- | ------------------------------------------------------------ |
| Follow / Unfollow a member | [RL] FollowingMemberMapping,<br />[PRL] FollowedByMemberMapping,<br />[PRL] Notice,<br />[C] Notification ***(acc.)***,<br />[C] MemberStatistics ***(acc.)*** |

1. Create a new record / Delete record of ***FollowingMemberMapping*** in **[RL] FollowingMemberMapping**

   ```json
   {
       partitionKey: "_", // member id (actor)
       rowKey: "_", // member id (affected member)
       IsActive: true
   }
   ```

2. Create a new record / Delete record of ***FollowedByMemberMapping*** in **[PRL] FollowedByMemberMapping**

   ```json
   {
       partitionKey: "_", // member id (affected member)
       rowKey: "_", // member id (actor)
       IsActive: true
   }
   ```

3. Create a new record of ***Notice*** in **[PRL] Notice**

   ```json
   {
       partitionKey: "_", // member id (affected member)
       rowKey: "_", // notice id, 10 characters, UPPERCASE
       InitiateId: "_", // member id of actor
   }
   ```

4. Update notification statistics (followedCount) in **[C] notification** *(Follow act only)*

   ```json
   {
       memberId: string; // (actor)
       followedCount: 0 // ++
   }
   ```

5. Update member statistics (followedByCount) in **[C] memberStatistics**

   ```json
   {
       memberId: string; // (actor)
       totalFollowingCount: 0 // ++
   }
   ```

   ```json
   {
       memberId: string; // (affected member)
       totalFollowedCount: 0 // ++/--
   }
   ```

### ▶️Block/Unblock a member

| Behaviour      | Affected tables / collections                                |
| -------------- | ------------------------------------------------------------ |
| Block a member | [RL] BlockingMemberMapping,<br />[PRL] BlockedByMemberMapping,<br />[C] memberStatistics ***(acc.)*** |

Mostly same as ▶️Follow/Unfollow a member

## 📦Attitude

### ▶️Get attitude on a post/comment/subcomment

| Behaviour    | Affected tables / collections |
| ------------ | ----------------------------- |
| Get attitude | [C] attitudeComprehensive     |

### ▶️Express attitude on a comment/subcomment

| Behaviour    | Affected tables / collections                                |
| ------------ | ------------------------------------------------------------ |
| Like         | [C] attitudeComprehensive,<br />[C] memberStatistics***.totalLikedCount (inc.)***,<br />[C] memberStatistics***.totalCommentLikedCount (inc. of the comment author)***<br />[C] comment/subcommentComprehensive***.totalLikedCount (inc.)***,<br />( Cond. [PRL] Notice***.Liked (est.)*** ),<br />( Cond. [C] notificationStatistics***.likedCount (acc.)*** ) |
| Undo like    | [C] attitudeComprehensive,<br />[C] memberStatistics***.totalUndoLikedCount (inc.)***,<br />[C] memberStatistics***.totalCommentUndoLikedCount (inc. of the comment author)***<br />[C] comment/subcommentComprehensive***.totalUndoLikedCount (inc.)*** |
| Dislike      | [C] attitudeComprehensive,<br />[C] memberStatistics***.totalDislikedCount (inc.)***,<br />[C] memberStatistics***.totalCommentDislikedCount (inc. of the comment author)***<br />[C] comment/subcommentComprehensive***.totalDislikedCount (inc.)*** |
| Undo dislike | [C] attitudeComprehensive,<br />[C] memberStatistics***.totalUndoDislikedCount (inc.)***,<br />[C] memberStatistics***.totalCommentUndoDislikedCount (inc. of the comment author)***<br />[C] comment/subcommentComprehensive***.totalUndoDislikedCount (inc.)*** |

### ▶️Express attitude on a post

| Behaviour    | Affected tables / collections                                |
| ------------ | ------------------------------------------------------------ |
| Like         | [C] attitudeComprehensive,<br />[C] memberStatistics***.totalLikedCount (inc.)***,<br />[C] memberStatistics***.totalCreationLikedCount (inc. of the post author)***,<br />[C] postComprehensive***.totalLikedCount (inc.)***,<br />[C] channelStatistics***.totalLikedCount (inc.)***,<br />( Cond. [C] topicComprehensive***.totalLikedCount (inc.)*** ),<br />( Cond. [PRL] Notice***.Liked (est.)*** ),<br />( Cond. [C] notificationStatistics***.likedCount (acc.)*** ) |
| Undo like    | [C] attitudeComprehensive,<br />[C] memberStatistics***.totalUndoLikedCount (inc.)***,<br />[C] memberStatistics***.totalCreationUndoLikedCount (inc. of the post author)***,<br />[C] postComprehensive***.totalUndoLikedCount (inc.)***,<br />[C] channelStatistics***.totalUndoLikedCount (inc.)***,<br />( Cond. [C] topicComprehensive***.totalUndoLikedCount (inc.)*** ) |
| Dislike      | [C] attitudeComprehensive,<br />[C] memberStatistics***.totalDislikedCount (inc.)***,<br />[C] memberStatistics***.totalCreationDislikedCount (inc. of the post author)***,<br />[C] postComprehensive***.totalDislikedCount (inc.)*** |
| Undo dislike | [C] attitudeComprehensive,<br />[C] memberStatistics***.totalUndoDislikedCount (inc.)***,<br />[C] memberStatistics***.totalCreationUndoDislikedCount (inc. of the post author)***,<br />[C] postComprehensive***.totalUndoDislikedCount (inc.)*** |

## 📦Comment

### ▶️Create a comment

| Behaviour                            | Affected tables / collections                                |
| ------------------------------------ | ------------------------------------------------------------ |
| Create a comment<br />(Cue a member) | [C] commentComprehensive ***(est.)***,<br />[C] memberStatistics***.totalCommentCount (acc.)***,<br />[C] postComprehensive***.totalCommentCount (acc.)***,<br />[C] channelStatistics***.totalCommentCount (acc.)***<br />( Cond. [C] topicComprehensive***.totalCommentCount (acc.)*** )<br />( Cond. [PRL] Notice***.Replied (est.)*** ),<br />( Cond. [C] notificationStatistics***.repliedCount (acc.)*** ),<br />( Cond. [PRL] Notice***.Cued (est.)*** ),<br />( Cond. [C] notificationStatistics***.cuedCount (acc.)*** ) |

1. Look up document of ***IPostComprehensive*** in **[C] postComprehensive**
2. Insert a new document of ***ICommentComprehensive*** in **[C] commentComprehensive** or return  ***"Post not found" error***
3. Update document (**totalCommentCount**) in **[C] postComprehensive** 
4. Update document (**totalCommentCount**) in **[C] memberStatistics**
5. Update document (**totalCommentCount**) in **[C] channelStatistics**
6. Skip (if post not belonged to any topics) or Update documents (**totalCommentCount**) in **[C] topicComprehensive**
7. Skip (if not cued anyone or blocked) or Create a new record of ***RepliedNotice*** in **[PRL] Notice**
8. Skip (if not cued anyone or blocked) or Update document (**repliedCount**) in **[C] notificationStatistics**
9. Skip (if blocked by post author) or Create a new record of ***CuedNotice*** in **[PRL] Notice**
10. Skip (if blocked by post author)  or Update document (**cuedCount**) in **[C] notificationStatistics**

### ▶️Edit a comment

| Behaviour                                                    | Affected tables / collections                                |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Edit a comment<br />(Only allowed once,<br /> Editing results in losing<br />like / dislike data)🆕 | [C] commentComprehensive ***(put.)***,<br />[C] memberStatistics***.totalCommentEditCount (acc.)***,<br />( Cond. [PRL] Notice***.Cued (est.)*** ),<br />( Cond. [C] notificationStatistics***.cuedCount (acc.)*** ) |

1. Look up comment management (status) in **[C] commentComprehensive**

2. Verify comment status

3. Update document (**content, status=201, totalEditCount (acc.)**) in **[C] commentComprehensive** or return ***"Method not allowed" error (status<0)***

   ```
   201 [有更改]/[Edited]
   ```

4. Update document (**totalCommentEditCount++**) in **[C] memberStatistics**

5. Skip (if not cued anyone or blocked) or Create a new record of ***RepliedNotice*** in **[PRL] Notice**

6. Skip (if not cued anyone or blocked) or Update document (**cuedCount**) in **[C] notificationStatistics**

*\* Edit actions are only allowed once. Once performed would result in losing like/dislike data*

### ▶️Delete a comment

| Behaviour        | Affected tables / collections                                |
| ---------------- | ------------------------------------------------------------ |
| Delete a comment | [C] commentComprehensive ***(put.)***,<br />[C] memberStatistics***.totalCommentDeleteCount (acc.)***<br />[C] postComprehensive***.totalCommentDeleteCount (acc.)***<br />[C] topicComprehensive***.totalCommentDeleteCount (acc.)***<br />[C] channelStatistics***.totalCommentDeleteCount(acc.)***<br />( Cond. [C] topicComprehensive***.totalCommentDeleteCount(acc.)*** ) |

1. Update document (**content, status=-1/-3**) in **[C] commentComprehensive**

   ```
   -1 [已删除]/[Removed]
   -3 [已被管理员删除]/[Removed by MojitoMaster]
   ```

2. Update document (**totalCommentEditCount++**) in **[C] memberStatistics**

### ▶️Create a subcomment / Reply to a comment

| Behaviour                               | Affected tables / collections                                |
| --------------------------------------- | ------------------------------------------------------------ |
| Create a subcomment<br />(Cue a member) | [C] subcommentComprehensive ***(est.)***,<br />( Cond. [PRL] Notice***.Replied (est.)*** ),<br />( Cond. [C] notificationStatistics***.repliedCount (acc.)*** ),<br />( Cond. [PRL] Notice***.Cued (est.)*** ),<br />( Cond. [C] notificationStatistics***.cuedCount (acc.)*** ),<br />[C] memberStatistics***.totalCommentCount (acc.)***,<br />[C] postComprehensive***.totalCommentCount (acc.)***,<br />[C] topicComprehensive***.totalCommentCount (acc.)***,<br />[C] channelStatistics***.totalCommentCount (acc.)*** |

### ▶️Edit a subcomment

| Behaviour                                                    | Affected tables / collections                                |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Edit a subcomment<br />(Only allowed once,<br /> Editing results in losing<br />like / dislike data)🆕 | [C] subcommentComprehensive ***(put.)***,<br />[C] memberStatistics***.totalCommentEditCount (acc.)***,<br />( Cond. [PRL] NotifyCued ***(est.)*** ),<br />( Cond. [C] Notification*.cuedCount* ***(acc.)*** ) |

### ▶️Delete a subcomment

| Behaviour           | Affected tables / collections                                |
| ------------------- | ------------------------------------------------------------ |
| Delete a subcomment | [C] subcommentComprehensive ***(put.)***,<br />[C] memberStatistics***.totalCommentDeleteCount (acc.)***<br />[C] commentComprehensive***.totalSubcommentDeleteCount (acc.)***,<br />[C] postComprehensive***.totalCommentDeleteCount (acc.)***<br />[C] topicComprehensive***.totalCommentDeleteCount (acc.)***<br />[C] channelStatistics***.totalCommentDeleteCount(acc.)***<br />( Cond. [C] topicComprehensive***.totalCommentDeleteCount(acc.)*** ) |

### ▶️Pin a comment

| Behaviour     | Affected tables / collections                      |
| ------------- | -------------------------------------------------- |
| Pin a comment | [C] postComprehensive***.pinnedCommentId (put.)*** |

## 📦Topic

| Behaviour      | Affected tables / collections                        |
| -------------- | ---------------------------------------------------- |
| Create a topic | See ▶️Create a post                                   |
| Refer a topic  | See ▶️Create a post                                   |
| Search a topic | [C] topicComprehensive***.totalSearchCount (acc.)*** |

## 📦Post

### ▶️View a post

| Behaviour   | Affected tables / collections                                |
| ----------- | ------------------------------------------------------------ |
| View a post | ( Cond. [RL] HistoryMapping ***(est./put.)*** ),<br />[C] memberStatistics***.totalCreationHitCount (acc.)***,<br />[C] postComprehensive***.totalHitCount (acc.)***,<br />[C] channelStatistics***.totalHitCount (acc.)***,<br />( Cond. [C] topicStatistics ***.totalHitCount (acc.)*** ) |

1. Look up post status in **[C] postComprehensive**

### ▶️Create a post

| Behaviour     | Affected tables / collections                                |
| ------------- | ------------------------------------------------------------ |
| Create a post | [C] postComprehensive,<br />( Cond. [C] topicPostMapping ***(est.)*** )<br />( Cond. [C] topicComprehensive ***(est.)*** )<br />[C] memberStatistics***.totalCreationCount (acc.)***,<br />[C] channelStatistics***.totalPostCount (acc.)***<br />( Cond. [C] topicComprehensive***.totalPostCount (acc.)*** ),<br />( Cond. [PRL] Notice***.Cued (est.)*** ),<br />( Cond. [C] notificationStatistics***.cuedCount (acc.)*** ) |

1. Insert a new document of ***IPostComprehensive*** in **[C] postComprehensive**
2. Skip (if this post not belonged to any topics) or Insert a new document of ***ITopicPostMapping*** in **[C] topicPostMapping**
3. Skip (if this post belongs to no new topics) or Insert a new document of ***ITopicComprehensive***  in **[C] topicComprehensive**, Insert a new document of ***ITopicPostMapping*** in **[C] topicPostMapping**
4. Update document (**totalCreationCount**) in **[C] memberStatistics**
5. Update document (**totalPostCount**) in **[C] channelStatistics**
6. Skip (if this post not belonged to any topics) or Update documents (**totalPostCount**) in **[C] topicComprehensive**
7. Skip (if blocked by post author) or Create a new record of ***CuedNotice*** in **[PRL] Notice**
8. Skip (if blocked by post author)  or Update document (**cuedCount**) in **[C] notificationStatistics**

### ▶️Edit a post

| Behaviour   | Affected tables / collections                                |
| ----------- | ------------------------------------------------------------ |
| Edit a post | [C] postComprehensive,<br />[C] memberComprehensive***.totalCommentEditCount (acc.)***<br />( Cond. [PRL] Notice***.Cued (est.)*** ),<br />( Cond. [C] notificationStatistics***.cuedCount (acc.)*** ) |

### ▶️Delete a post

| Behaviour     | Affected tables / collections                                |
| ------------- | ------------------------------------------------------------ |
| Delete a post | [C] postComprehensive***.status (put.)***,<br />[C] memberStatistics***.totalCreationDeleteCount (acc.)***,<br />[C] channelStatistics***.totalPostDeleteCount (acc.)***,<br />( Cond. [C] topicComprehensive***.totalCreationDeleteCount (acc.)*** ),<br />( Cond. [C] topicPostMapping***.status (put.)***) |

### ▶️Save a post

| Behaviour     | Affected tables / collections                                |
| ------------- | ------------------------------------------------------------ |
| Save a post   | [RL] SavedMapping,<br />( Cond. [PRL] Notice***.Saved (est.)*** ),<br />( Cond. [C] notificationStatistics***.savedCount (acc.)*** ),<br />[C] memberStatistics***.totalSavedCount(acc.)***,<br />[C] postComprehensive***.totalSavedCount(acc.)***,<br />[C] channelStatistics***.totalSavedCount (acc.)***<br />( Cond.[C] topicComprehensive***.totalSavedCount(acc.)*** ) |
| Unsave a post | [C] memberStatistics***.totalUnsavedCount(acc.)***,<br />[C] postComprehensive***.totalUnsavedCount(acc.)***,<br />[C] channelStatistics***.totalUnsavedCount (acc.)***<br />( Cond. [C] topicComprehensive***.totalUnsavedCount(acc.) )*** |



# APIs

## 🛠️Notification

GET|`/api/notification/[id]`

## 🛠️Member

### Signup

POST|`/api/member/behaviour/signup/index`

### Signin

POST|`/api/auth/[...nextauth]`

### Info & Statistics

GET|`/api/member/info/[id]`

POST|`/api/member/info/[id]`

POST|`/api/member/behaviour/follow/[id]`

POST|`/api/member/behaviour/block/[id]`

GET|`/api/member/behaviour/resetpassword/request?emaillAddress=`

## 🛠️Comment

###  Comment Info & Statistics

GET|`/api/comment/s/of/[postId]`

POST|`/api/comment/of/[postId]/info/index`

GET|`/api/comment/of/[postId]/info/[commentId]`

POST|`/api/comment/of/[postId]/info/[commentId]`

PUT|`/api/comment/of/[postId]/info/[commentId]`

DELETE|`/api/comment/of/[postId]/info/[commentId]`

### Subcomment Info & Statistics

GET|`/api/subcomment/s/of/[commentId]`

POST|`/api/subcomment/of/[commentId]/info/index`

GET|`/api/subcomment/of/[commentId]/info/[subcommentId]`

POST|`/api/subcomment/of/[commentId]/info/[subcommentId]`

PUT|`/api/subcomment/of/[commentId]/info/[subcommentId]`

DELETE|`/api/subcomment/of/[commentId]/info/[subcommentId]`

## 🛠️Channel

### Info & Statistics

GET|`/api/channel/info/[id]`

GET|`/api/channel/dictionary`

GET|`/api/channel/index`

## 🛠️Topic

### Info & Statistics

GET| `/api/topic/[id]`

GET| `/api/topic/of/channel/[id]`

POST| `/api/topic/index`

## 🛠️Post

### Info & Statistics

GET|`/api/post/info/[id]`

POST|`/api/post/info/index`

PUT|`/api/post/info/[id]`

DELETE|`/api/post/info/[id]`

POST|`/api/post/behaviour/save/[id]`

POST|`/api/post/behaviour/attitude/[id]`





 





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

