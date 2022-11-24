# Mojito New Zealand 莫希托新西兰

8 September 2022 | Established

27 October 2022 | Domain name announced

[toc]

# Branding

26/10/2022 | Domain name officially announced

MOJITO.CO.NZ

Mojito.co.nz

莫希托新西兰



# Management

## · Webmaster Email

webmaster.mojito@gmail.com



# Architecture

- Ui: Metrial UI

- Server: NextJs + NodeJs
- Host:  Azure Web App / [Vercel](https://vercel.com/pricing)
- DB: Azure Table Storage
- File Storage: Azure Blob Storage (Update: 27Oct2022)



# Entity

## · MemberBehaviour

### · · [Entity] VerifyAccountRequestInfo

```typescript
type VerifyAccountRequestInfo = {
    memberId: string;
}
```

### · · [Entity] ResetPasswordRequestInfo

```typescript
type ResetPasswordRequestInfo = {
    memberId: string;
    resetPasswordToken: string;
    expireDate: number;
}
```





# Table Design

## · [Class] System (Not-in-use)

| Key          | Type   | Desc |
| ------------ | ------ | ---- |
| PartitionKey | string |      |
| RowKey       | string |      |



## · [Class] Member



### · · [Design] Member

#### *Update 7/11/2022*

- Due to azure table storage could not offer any index query or query of the amount of entities, I decided to use random strings as memberIds.
- A table that works as an index will be maintained under MemberManagement Class.
- Method to create user string refer to [this](#Random 16).



### · · [Table] MemberInfo

| Key          | Type   | Desc                               |
| ------------ | ------ | ---------------------------------- |
| PartitionKey | string | MemberIdStr                        |
| RowKey       | string | Category name, e.g. "EmailAddress" |
| *            |        |                                    |

*Column key varies with RowKey.

| RowKey                                                       | Corresponding Column Key                            | Corresponding Column Type/Value E.g.  |
| ------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------- |
| EmailAddress<br />***Update 10/11/2022 ⚠️Email➡️ EmailAddress*** | EmailAddressStr<br />***EmailStr➡️EmailAddressStr*** |                                       |
| Nickname                                                     | NicknameStr                                         |                                       |
| AvatarImageUrl                                               | AvatarImageUrlStr                                   |                                       |
| ~~BackgroundImageUrl~~                                       | ~~BackgroundImageUrlStr~~                           |                                       |
| BriefIntro                                                   | BriefIntroStr                                       |                                       |
| Gender                                                       | GenderValue                                         | number, 0 / 1 / -1 (Keep as secret)   |
| Birthday                                                     | BirthdayValue                                       | string                                |
| ... other properties                                         | ...                                                 |                                       |
|                                                              |                                                     |                                       |
| MemberCategory                                               | value                                               | string                                |
| LoginProviderId                                              | SignInProviderIdStr                                 | string, 'mojito' / 'github'           |
| ~~MemberSettings~~<br />***Update 11/11/2022 ⚠️ moved to [Table] MemberAccountSettings*** | ~~value~~                                           | ~~string, stringified JSON, "{...}"~~ |
| ~~MemberScopeOfPower~~<br />***Update 11/11/2022 ⚠️moved to [Table] MemberManagement*** | ~~value~~                                           | ~~string, stringified JSON, "{...}"~~ |
| ~~AccountStatus~~<br />***Update 11/11/2022 ⚠️moved to [Table] MemberManagement*** | ~~IsActive~~                                        | ~~boolean~~                           |
| PostCounts                                                   | PostCountsValue                                     | number                                |
| CommentCounts                                                | CommentCountsValue                                  | number                                |
| FollowingCounts                                              | FollowingCountsValue                                | number                                |
| FollowedByCounts                                             | FollowedByCountsValue                               | number                                |
| SavedCounts                                                  | SavedCountsValue                                    | number                                |
| LikedCounts                                                  | LikedCountsValue                                    | number                                |
| DislikedCounts                                               | DislikedCountsValue                                 | number                                |

- AccountStatus
  - `IsActive === 'false'` if account is not email-verified or being suspend

#### · · · [Design] MemberSettings (Not-in-use)

```json
{
    "AllowPrivateMessage": true,
    "AllowNotification": {
        "NotifyOnCued": true
    },
    "ForwardPostOnComment": false
}
```



### · · [Table] MemberLogin

| Key          | Type   | Desc                                   |
| ------------ | ------ | -------------------------------------- |
| PartitionKey | string | MemberIdStr                            |
| RowKey       | string | Category name, e.g. "PasswordHash" ... |
| *            |        |                                        |

*Column key varies with RowKey.

| RowKey                                                       | Corresponding Column Key | Corresponding Column Type/Value E.g. |
| ------------------------------------------------------------ | ------------------------ | ------------------------------------ |
| PasswordHash                                                 | PasswordHashStr          | string, "%(&%(&%(&^=="               |
| ResetPasswordToken<br />***Update 6/11/2022***               | ResetPasswordTokenStr    | string, "ABC123"                     |
| ~~VerificationCode~~<br />***Update 6/11/2022***<br />***Update 8/11/2022: deprecated*** | ~~VerificationCodeStr~~  | ~~string, "ABC123"~~                 |

***Update 8/11/2022: deprecated due to implement of ReCAPTCHA***



### · · [Table-RL] LoginCredentialsMapping

| Key          | Type   | Desc                                                         |
| ------------ | ------ | ------------------------------------------------------------ |
| PartitionKey | string | Category name, "EmailAddress" ~~/ "Nickname"~~<br />***Update 10/11/2022 ⚠️ Email➡️ EmailAddress***<br />***Update 12/11/2022 ⚠️ Nickname login forever forbidden, introduce "GitHubOAuth"/"GoogleOAuth"/...*** |
| RowKey       | string | EmailAddressStr, "abc@123.com" ~~/ NicknameStr, "henrycechen"~~ |
| MemberIdStr  | string |                                                              |
| IsActive     | bool   |                                                              |

**\* 31/10/2022** There will not be an `IsActive` column for this table, an delete request will result in removing process.



### · · [Table-RL] NicknameMapping

| Key          | Type   | Desc                       |
| ------------ | ------ | -------------------------- |
| PartitionKey | string | Category name, "Nickname"  |
| RowKey       | string | NicknameStr, "henrycechen" |
| MemberIdStr  | string |                            |
| IsActive     | bool   |                            |

**\* 31/10/2022** There will not be an `IsActive` column for this table, an delete request will result in removing process.





### · · [Table] MemberAccountSettings (Not-in-use)

| Key          | Type   | Desc                                   |
| ------------ | ------ | -------------------------------------- |
| PartitionKey | string | MemberIdStr                            |
| RowKey       | string | Category name, e.g. "PasswordHash" ... |
| *            |        |                                        |

*Column key varies with RowKey.





## · [Class] MemberBehaviour

*12/10/2022: MemberBehaviour to be disassembled to separated tables*

| Behaviour                                                    | TableName                  | Desc           |
| ------------------------------------------------------------ | -------------------------- | -------------- |
| Follow a member                                              | FollowingMemberIdList      | Table-RL       |
| Be followed by a number (**Passive**)                        | FollowedByMemberIdList     | Table-RL-**P** |
| ~~Subscribe a member~~ <br />***Update 23/11/2022 ⚠️ deprecated*** | ~~SubscribedMemberIdList~~ | ~~Table-RL~~   |
| Block a member<br />***Update 5/11/2022***                   | BlockedMemberIdList        | Table-RL       |
| Make a post                                                  | PostMapping                | Table-RL       |
| View a post                                                  | ViewedPostIdList           | Table-RL       |
| ~~Like a post~~<br />***Update 25/11/2022 ⚠️ deprecated***    | ~~LikedPostMapping~~       | ~~Table-RL~~   |
|                                                              |                            |                |
| Save a post                                                  | SavedPost                  | Table-RL       |
| Make / Accept a PM                                           | PmIdListStr (Not-in-use)   | Table-RL       |



### · · [Table-RL] \<Member\> FollowingMemberMapping

\* This table records the following memberId list of the partition key owner (memberId)

| Key          | Type   | Desc                 |
| ------------ | ------ | -------------------- |
| PartitionKey | string | MemberIdStr          |
| RowKey       | string | FollowingMemberIdStr |
| IsActive     | bool   |                      |



### · · [Table-RL-P] \<Member\> FollowedByMemberMapping

\* This table records the subscribed memberId list of the partition key owner (memberId)

| Key          | Type   | Desc                  |
| ------------ | ------ | --------------------- |
| PartitionKey | string | MemberIdStr           |
| RowKey       | string | FollowedByMemberIdStr |
| IsActive     | bool   |                       |



### · · [Table-RL] \<Member\> BlockedMemberMapping

\* This table records the subscribed memberId list of the partition key owner (memberId)

| Key          | Type   | Desc               |
| ------------ | ------ | ------------------ |
| PartitionKey | string | MemberIdStr        |
| RowKey       | string | BlockedMemberIdStr |
| IsActive     | bool   |                    |



### · · [Table-RL] \<Post\> PostMapping

\* This table records the posts published by the partition key owner (memberId)

| Key          | Type   | Desc        |
| ------------ | ------ | ----------- |
| PartitionKey | string | MemberIdStr |
| RowKey       | string | PostIdStr   |



### · · [Table-RL] \<Post\> HistoryMapping

\* This table records the posts published by the partition key owner (memberId)

| Key          | Type    | Desc            |
| ------------ | ------- | --------------- |
| PartitionKey | string  | MemberIdStr     |
| RowKey       | string  | PostIdStr       |
| IsActive     | boolean | Default, `true` |



### · · [Table-RL] \<Post\> AttitudePostMapping

\* Update on this table will also affect this table

| Key          | Type   | Desc                      |
| ------------ | ------ | ------------------------- |
| PartitionKey | string | MemberIdStr               |
| RowKey       | string | PostIdStr                 |
| Attitude     | number | `-1 | 0 | 1`, default `0` |



### · · [Table-RL] \<Comment\> AttitudeCommentMapping

\* Update on this table will also affect this table

| Key          | Type   | Desc                      |
| ------------ | ------ | ------------------------- |
| PartitionKey | string | MemberIdStr               |
| RowKey       | string | CommentIdStr              |
| Attitude     | number | `-1 | 0 | 1`, default `0` |



### · · [Table-RL] \<Subcomment\> AttitudeSubcommentMapping

\* Update on this table will also affect this table

| Key          | Type   | Desc                      |
| ------------ | ------ | ------------------------- |
| PartitionKey | string | MemberIdStr               |
| RowKey       | string | SubcommentId              |
| Attitude     | number | `-1 | 0 | 1`, default `0` |





### ~~· · [Table-RL] \<Post\> LikedPostMapping~~ ⚠️ deprecated



### ~~· · [Table-RL] \<Post\> DislikedPostMapping~~ ⚠️ deprecated



### · · [Table-RL] \<Post\> SavedPostMapping

| Key          | Type   | Desc        |
| ------------ | ------ | ----------- |
| PartitionKey | string | MemberIdStr |
| RowKey       | string | PostId      |
| IsActive     | bool   |             |



### · · [Table-RL] \<Comment\> LikedCommentMapping

### · · [Table-RL] \<Comment\> DislikedCommentMapping



### · · [Table-RL] \<Subcomment\> LikedSubcommentMapping

### · · [Table-RL] \<Subcomment\> DislikedSubcommentMapping



### · · [Table-RL] PrivateMessageMapping (Not-in-use)

| Key          | Type   | Desc        |
| ------------ | ------ | ----------- |
| PartitionKey | string | MemberIdStr |
| RowKey       | string | PMId        |
| IsActive     | bool   |             |



## · [Class] MemberManagement

### · · [Table] MemberManagement

| Key          | Type   | Desc                            |
| ------------ | ------ | ------------------------------- |
| PartitionKey | string | MemberIdStr                     |
| RowKey       | string | Category name, e.g. "AllowPost" |
| *            |        |                                 |

*Corresponding column keys may be identical but hold different values.

| RowKey          | Corresponding Column Key | Corresponding Column Type/Value E.g.                         |
| --------------- | ------------------------ | ------------------------------------------------------------ |
| MemberStatus    | AccountStatusValue       | number, default 0, code explain [below](· · [Design] \<Property\> Member Status) |
| AllowShortPost  | Value                    | bool, (default) true                                         |
| Allow...Post    | Value                    | bool, (default) false                                        |
| AllowCommenting | Value                    | bool, (default) true                                         |
| PostDowngraded  | Value                    | bool, (default) false                                        |

### · · [Design] \<Property\> MemberStatus

| Code    | Explanation                                             |
| ------- | ------------------------------------------------------- |
| -1      | Deactivated / Suspended                                 |
| 0       | Established, email address not verified                 |
| **200** | **Email address verified or third party login, normal** |
| 404     | Restricted to certain content                           |
| 405     | Restricted to cetain behaviour                          |



### · · [Design] MemberIndex

| Key          | Type   | Desc                            |
| ------------ | ------ | ------------------------------- |
| PartitionKey | string | MemberIdStr                     |
| RowKey       | string | Category name, e.g. "AllowPost" |
| *            |        |                                 |

*Corresponding column keys may be identical but hold different values.



### · · [Design] Post Downgrade

- If a member has got a compromised reputation, his/her posting will be downgraded by the system.



### · · [Table] MemberPrestige (Abbr. Mptg)

| Key          | Type   | Desc                                   |
| ------------ | ------ | -------------------------------------- |
| PartitionKey | string | MemberIdStr                            |
| RowKey       | string | Category name, e.g. "MemberReputation" |
| *            |        |                                        |

*Column key varies with RowKey.

| RowKey     | Corresponding Column Key | Corresponding Column Type/Value E.g. |
| ---------- | ------------------------ | ------------------------------------ |
| Reputation | Weight                   | int, (default) 100                   |





## · [Class] PrivateMessage (Not-in-use)

### · · [Table] PrivateMessage

| Key          | Type   | Desc                             |
| ------------ | ------ | -------------------------------- |
| PartitionKey | string | PmIdStr                          |
| RowKey       | string | Category name, e.g. InitMemberId |
| *            |        |                                  |

*Column key varies with RowKey.

| RowKey           | Corresponding Column Key | Corresponding Column Type/Value E.g. |
| ---------------- | ------------------------ | ------------------------------------ |
| InitMemberId     | InitMemberIdStr          | string                               |
| RecpMemberIdList | RecpMemberIdListStr      | string                               |
| MessageList      | MessageListStr           | string                               |





## · [Class] CommentInfo

### · · [Table] CommentInfo

| Key          | Type   | Desc                         |
| ------------ | ------ | ---------------------------- |
| PartitionKey | string | CommentIdStr                 |
| RowKey       | string | Category name, e.g. MemberId |

*Column key varies with RowKey.

| RowKey        | Corresponding Column Key | Corresponding Column Type/Value E.g. |
| ------------- | ------------------------ | ------------------------------------ |
| MemberId      | MemberIdStr              | string                               |
| Content       | ContentStr               | string                               |
| LikedTimes    | LikedTimesValue          | number                               |
| DislikedTimes | DislikedTimesValue       | number                               |
| CommentStatus | CommentStatusValue       | number                               |



### · · [Table-RL] PostCommentMapping

| Key          | Type   | Desc         |
| ------------ | ------ | ------------ |
| PartitionKey | string | PostIdStr    |
| RowKey       | string | CommentIdStr |
| IsActive     | bool   |              |



## · [Class] CommentBehaviour

### · · [Table-RL-P] CommentLikedMemberMapping

\* Passive acting table affect by action applied on this [table](#· · [Table-RL] \<Comment\> LikedCommentIdList)

| Key          | Type   | Desc         |
| ------------ | ------ | ------------ |
| PartitionKey | string | CommentIdStr |
| RowKey       | string | MemberIdStr  |
| IsActive     | bool   |              |



### · · [Table-RL-P] CommentDislikedMemberMapping

\* Passive acting table affect by action applied on this [table](#· · [Table-RL] \<Comment\> DislikedCommentIdList)

| Key          | Type   | Desc         |
| ------------ | ------ | ------------ |
| PartitionKey | string | CommentIdStr |
| RowKey       | string | MemberIdStr  |
| IsActive     | bool   |              |





## · [Class] Subcomment

### · · [Table] SubcommentInfo

| Key          | Type   | Desc                         |
| ------------ | ------ | ---------------------------- |
| PartitionKey | string | SubcommentIdStr              |
| RowKey       | string | Category name, e.g. MemberId |

*Column key varies with RowKey.

| RowKey      | Corresponding Column Key | Corresponding Column Type/Value E.g.      |
| ----------- | ------------------------ | ----------------------------------------- |
| MemberId    | MemberIdStr              | string                                    |
| TextContent | TextContentStr           | string                                    |
| Liked       | MemberIdListStr          | string, stringified array, "['...', ...]" |
| Disliked    | MemberIdListStr          | string, stringified array, "['...', ...]" |
| IsActive    | value                    | bool                                      |



### · · [Table-RL] CommentSubcommentMapping

| Key          | Type   | Desc            |
| ------------ | ------ | --------------- |
| PartitionKey | string | CommentIdStr    |
| RowKey       | string | SubcommentIdStr |
| IsActive     | bool   |                 |





## · [Class] SubcommentBehaviour

### · · [Table-RL-P] SubcommentLikedMemberMapping

\* Passive acting table affect by action [action](#· · [Table-RL] \<Subcomment\> LikedSubcommentIdList)

| Key          | Type   | Desc         |
| ------------ | ------ | ------------ |
| PartitionKey | string | CommentIdStr |
| RowKey       | string | MemberIdStr  |
| IsActive     | bool   |              |



### · · [Table-RL-P] SubcommentDisLikedMemberMapping

\* Passive acting table affect by  [action](#· · [Table-RL] \<Subcomment\> DislikedSubcommentIdList)

| Key          | Type   | Desc         |
| ------------ | ------ | ------------ |
| PartitionKey | string | CommentIdStr |
| RowKey       | string | MemberIdStr  |
| IsActive     | bool   |              |



## · [Class] Notification (Not-in-use)

### · · [Table] Notification

| Key          | Type   | Desc                     |
| ------------ | ------ | ------------------------ |
| PartitionKey | string | MemberIdStr              |
| RowKey       | string | Category name, e.g. Cued |
| *            |        |                          |

*Corresponding column keys may be identical but hold different values.

| RowKey     | Corresponding Column Key | Corresponding Column Type/Value E.g. |
| ---------- | ------------------------ | ------------------------------------ |
| Cued       | value                    | int                                  |
| Liked      | value                    | int                                  |
| Saved      | value                    | int                                  |
| Subscribed | value                    | int                                  |
| Pmed       | value                    | int                                  |

### · · [Design] Triggering notificatoin

- whenever a member performs a cue/like/save/subscribe/pmed action, notificationService will be triggered to log this action.
- whenever a member performs a query on these notification stack, notificationService will reset the stack to zero.



## · [Class] Post


### · · [Table] PostInfo

| Key          | Type   | Desc                         |
| ------------ | ------ | ---------------------------- |
| PartitionKey | string | PostIdStr                    |
| RowKey       | string | Category name, e.g. MemberId |
| *            |        |                              |

*Column key varies with RowKey.

| RowKey                                                       | Corresponding Column Key                | Corresponding Column Type/Value E.g.                         |
| ------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| MemberId                                                     | MemberIdStr                             | string                                                       |
| ImageUrlList                                                 | ImageUrlListStr                         | string, stringified array, "['...', ...]"                    |
| ~~TitleContent~~<br />***Update 15/11/2022 ➡️Title***         | ~~TitleContentStr~~<br />TitleStr       | sring                                                        |
| ~~TextContent~~<br />***Update 15/11/2022 ➡️Content***        | ~~TextContentStr~~<br />ContentStr      | string                                                       |
| ~~Category~~<br />***Update 14/11/2022 ➡️ChannelId***         | ~~CategoryStr~~<br />***ChannelIdStr*** | string, e.g. ~~"Po"~~  "food"                                |
| ~~TagList (Not-in-use)~~<br />***Update 23/11/2022 ➡️TopicList*** | ~~TagListStr~~<br />***TopicListStr***  | string, stringified array                                    |
| ViewedTimes                                                  | ViewedTimesValue                        | int                                                          |
| LikedTimes                                                   | LikedTimesValue                         | int, affect by like action                                   |
| DislikedTimes                                                | DislikedTimesValue                      | int, affect by dislike action                                |
| SavedTimes                                                   | SavedTimesValues                        | int                                                          |
| CommentNumber                                                | CommentNumberValue                      | int                                                          |
| ~~PostStatus~~                                               | ~~PostStatusValue~~                     | ~~int, explained [below](#· · · [Design] Post Status)~~<br />***Update 15/11/2022 Moved to [Table] PostManagement*** |
| Grade (Not-in-use)                                           | Weight                                  | int, (default) 100                                           |





## · [Class] PostBehaviour

### · · [Table-RL-P] PostLikedMemberIdList

\* **Passive** acting table affect by [action on this table](#· · [Table-RL] \<Post\> LikedPostIdList)

| Key          | Type   | Desc        |
| ------------ | ------ | ----------- |
| PartitionKey | string | PostIdStr   |
| RowKey       | string | MemberIdStr |
| IsActive     | bool   |             |



### · · [Table-RL-P] PostDislikedMemberIdList

\* **Passive** acting table affect by [action on this table](· · [Table-RL] \<Post\> DislikedPostIdList)

| Key          | Type   | Desc        |
| ------------ | ------ | ----------- |
| PartitionKey | string | PostIdStr   |
| RowKey       | string | MemberIdStr |
| IsActive     | bool   |             |

### · · ~~[Design] PostCategoryIdList~~ *Update 15/11/2022*

> - ShortPost (Po)
> - Article (Art)
> - Listing (Lst)
> - Product (Pd)
> - Advertisement (Ad)





## · [Class] PostManagement

### · · [Table] PostManagement

| Key          | Type   | Desc                            |
| ------------ | ------ | ------------------------------- |
| PartitionKey | string | PostIdStr                       |
| RowKey       | string | Category name, e.g. "AllowPost" |
| *            |        |                                 |

*Corresponding column keys may be identical but hold different values.

| RowKey                      | Corresponding Column Key | Corresponding Column Type/Value E.g.                         |
| --------------------------- | ------------------------ | ------------------------------------------------------------ |
| **PostStatus**              | **PostStatusValue**      | number, default 200, code explain [below](· · [Design] \<Property\> PostStatus) |
| PostDowngraded (Not-in-use) | Value                    | bool, (default) false                                        |



### · · [Design] \<Property\> PostStatus

| Code    | Explanation                                   |
| ------- | --------------------------------------------- |
| -1      | Deactivated / Suspended                       |
| **200** | **Normal**                                    |
| 404     | Restricted to certain content                 |
| 405     | Restricted to cetain behaviour, e.g., comment |





## · [Class] Channel

### · · [Design] \<List\> ChannelIdList

| ChannelId   | ChannelNameStr | 中文   | Svg Icon Reference |
| ----------- | -------------- | ------ | ------------------ |
| recommend   | Recommended    | 推荐   |                    |
| food        | Food           | 美食   | RestaurantIcon     |
| shopping    | Shopping       | 好物   | GradeIcon          |
| hobby       | Hobby          | 兴趣   | NightlifeIcon      |
| sports      | Sports         | 运动   | SportsTennisIcon   |
| travel      | Travel         | 旅行   | AirplaneTicketIcon |
| photography | Photography    | 摄影   | PhotoCameraIcon    |
| life        | Life           | 生活   | FamilyRestroomIcon |
| pets        | Pets           | 萌宠   | PetsIcon           |
| automobile  | Automobile     | 汽车   | TimeToLeaveIcon    |
| realestate  | Realestate     | 不动产 | HouseIcon          |
| furnishing  | Furnishing     | 家装   | YardIcon           |
| invest      | Invest         | 投资   | MonetizationOnIcon |
| event       | Event          | 时事   | NewspaperIcon      |



### · · [Table] ChannelInfo

#### · · [Entity] ChannelInfo

| Key          | Type   | Desc                   |
| ------------ | ------ | ---------------------- |
| PartitionKey | string | **"ChannelInfo"**      |
| RowKey       | string | ChannelIdStr           |
| CH           | string | ChannelName in Chinese |
| EN           | string | ChannelName in English |
| SvgIconPath  | string | string, svg icon path  |

#### · · [Entity] ChannelIndex

| Key               | Type   | Desc                       |
| ----------------- | ------ | -------------------------- |
| PartitionKey      | string | **"ChannelIndex"**         |
| RowKey            | string | **"default"**              |
| ChannelIndexValue | string | stringified array, "[...]" |









### · · [Table-RL] ChannelPostMapping

| Key          | Type    | Desc         |
| ------------ | ------- | ------------ |
| PartitionKey | string  | ChannelIdStr |
| RowKey       | string  | PostIdStr    |
| IsActive     | boolean |              |



### · · [Table-RL] TagChannelMapping (Not-in-use)

| Key          | Type    | Desc         |
| ------------ | ------- | ------------ |
| PartitionKey | string  | ChannelIdStr |
| RowKey       | string  | TagIdStr     |
| IsActive     | boolean |              |





## · [Class] Topic







## · [Class] PostIndexing

### · · [Table] KeywordList

| Key          | Type   | Desc                 |
| ------------ | ------ | -------------------- |
| PartitionKey | string | PostCategoryId, e.g. |
| RowKey       | string | KeywordStr           |
| IsActive     | bool   |                      |

### · · [Table] KeywordPostMapping

| Key             | Type   | Desc                                              |
| --------------- | ------ | ------------------------------------------------- |
| PartitionKey    | string | KeywordStr                                        |
| RowKey          | string | PostIdStr                                         |
| PostCategoryStr | string | Post category name, "ShortPost "/ "Article "/ ... |
| IsActive        | bool   |                                                   |

### · · [Design] Affected by Post Grading System

- Post may not appear on the index if it's been controlled/deactived.



## · [Class] PostRanking

### · · [Table] TwentyFourHoursNewPostRanking

hot icon

```
import WhatshotIcon from '@mui/icons-material/Whatshot';
```

newest icon

```
import AccessTimeIcon from '@mui/icons-material/AccessTime';
```



### · · [Table] TwentyFourHoursHotPostRanking

| Key          | Type   | Desc                           |
| ------------ | ------ | ------------------------------ |
| PartitionKey | string | TimeStampStr                   |
| RowKey       | string | Category name, e.g. PostIdList |

*Column key varies with RowKey.

| RowKey     | Corresponding Column Key | Corresponding Column Type/Value E.g.      |
| ---------- | ------------------------ | ----------------------------------------- |
| PostIdList | PostIdListStr            | string, stringified array, "['...', ...]" |
| IsActive   | value                    | true                                      |



### · · [Table] SevenDaysHotPostRanking

| Key          | Type   | Desc                           |
| ------------ | ------ | ------------------------------ |
| PartitionKey | string | TimeStampStr                   |
| RowKey       | string | Category name, e.g. PostIdList |

*Column key varies with RowKey.

| RowKey     | Corresponding Column Key | Corresponding Column Type/Value E.g.      |
| ---------- | ------------------------ | ----------------------------------------- |
| PostIdList | PostIdListStr            | string, stringified array, "['...', ...]" |
| IsActive   | value                    | true                                      |



### · · [Design] PostRanking Mechanism

1. Get **New Zealand Standard *Time(GMT+12*)** Date (NZT 0:00, ignore *Daylight Saving Time*) as **PartitionKey**
2. Update **PostIdListStr** field for ranking purpose



### · · [Design] Affected by Post Grading System (Not-properly-designed)

- Triggered every 15 minute automaticly by the system, re-rank the latest postings





## Reference

- [Design for Querying](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-for-query)



# Systems Design



## · Member System

- MemberInfo
- MemberSettings
- MemberLogin
- MemberBehaviour
- MemberMessage

### ·· Member Prestige System

- Reputation
- Coin

### ·· *\*Design-Unfinished\** Algorithm

$$
Initial\ Posting\ Weight = 100 \times MemberReputation\ Weight
$$

### ·· Universal Ranking Map

| Rank | Weight    | to Member                               | to Post                |
| ---- | --------- | --------------------------------------- | ---------------------- |
| A    | 150       | Key opinion leader                      | Highly recommanded     |
| B    | 110 - 149 | Member with good reputation             | Nice, higher ranked    |
| C    | 90 - 109  | Normal                                  | Normal                 |
| D    | 50 - 89   | Member with bad reputation              | Bad, Lower ranked      |
| E    | 1 - 49    | Post / Commenting forbidden (temporary) | Awful, controlled      |
| F    | 1 - 49    | Deactived by WebMaster                  | Deactived by WebMaster |



## · Notification System

### ·· Triggering notificatoin

- whenever a member performs a cue/like/save/subscribe/pmed action, notificationService will be triggered to log this action.
- whenever a member performs a query on these notification stack, notificationService will reset the stack to zero.

## · Private Message System



## · Comment System

### ·· Comment Grading System

- 当赞(Like)/嘘(Dislike)比例超过1/3时，Comment/Subcomment会被标记为赞爆/嘘爆
- 赞爆/嘘爆会影响到 Member Reputation

## · Post System

- ShortPost (Po) - 区块：兴趣
- Article (Art) - 区块：文章/长文章
- Listing (Lst) - 区块：好物
- Product (Pod) - 区块：商店

### ·· Post Indexing System

- Keyword
- TimeStamp

### ·· Post Grading System

- PostGrade





# Mail

## · Use Azure Communication Service to send emails

## · Send an email

```shell
npm i @azure/communication-email
```



[Reference](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email?pivots=programming-language-javascript)





# Ui Design

## · Swiper on home page

Options

- [Swiper](https://swiperjs.com/get-started)



## · Post FormData(image) to API

During dev, three ways of posting form data has been tested but finally the way using `Axios` has been accepted.

### · · Fetch API (JSON)

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

### · · XMLHttpRequest (FormData)

```typescript
// using XMLHttpRequest
const request = new XMLHttpRequest();
request.open('POST', '/api/image/putImage');
request.setRequestHeader('content-type', 'multipart/form-data; boundary=null'); // boundary must be set? During tests it is
request.send(formData);
```

### · · Axios (FormData with progress indicator) 

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



## · MUI Theme

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

  



# Db & Storage

## · Using Azure Data Tables Api

```
npm install @azure/data-tables
```

## · Docs Reference

[Reference](https://www.npmjs.com/package/@azure/data-tables/v/13.0.0)

## · `&` Used in no-standard CSS

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



## · Authorize access to data in Azure Storage

> Each time you access data in your storage account, your client  application makes a request over HTTP/HTTPS to Azure Storage. By  default, every resource in Azure Storage is secured, and every request  to a secure resource must be authorized. Authorization ensures that the  client application has the appropriate permissions to access a  particular resource in your storage account.

[Reference](https://learn.microsoft.com/en-us/azure/storage/common/authorize-data-access)



# Authenticate & Authorize

## · NextAuth.js

[Reference](https://next-auth.js.org/)

[Example](https://github.com/nextauthjs/next-auth-example)

## · Use JWT

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



## · A study on `[...nextauth].ts`

### · · `signin({ user, account, profile, email, credentials })` callback

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

## · ReCAPTCHA

[recaptcha console](https://www.google.com/u/4/recaptcha/admin/site/584181821)

### · · 使用ReCAPTCHA保护所有不被NextAuth保护的API Endpoint

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



### · · Solve react-google-recaptcha null ref issue

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



## · AES

### · · Change password service

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



## · Use Azure Storage

[Reference](https://learn.microsoft.com/en-us/azure/storage/queues/storage-nodejs-how-to-use-queues?tabs=javascript)



## · Use Gmail Api to send emails

[Youtube](https://www.youtube.com/watch?v=-rcRf7yswfM)



## · [TS] Option '--resolveJsonModule' cannot be specified without 'node' module resolution strategy.

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



## · Optional property access operator

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

