export function getMemberInfoNameValueMapping(prop: string) {
    return {
        nickname: 'NicknameStr',
        gender: 'GenderValue'
    }[prop]
}