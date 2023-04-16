# PixivNodeJS

Pixiv API for NodeJS

> 由于P站的原因无法使用用户名密码，请使用`refresh_token`进行替代
> 
> 获取`refresh_token`，请查看[@ZipFile Pixiv OAuth Flow](https://gist.github.com/ZipFile/c9ebedb224406f4f11845ab700124362) or [OAuth with Selenium/ChromeDriver]( https://gist.github.com/upbit/6edda27cb1644e94183291109b8a5fde)

项目复刻自[@upbit/Pixivpy3](https://github.com/upbit/pixivpy)

支持socks5代理

## 目前已实现API，未实现部分后面会慢慢做

```typescript
import {
    FollowedNewIllustConfigArg,
    IllustComment,
    IllustCommentConfigArg,
    IllustDetail, IllustRankingConfigArg, RecommendedIllust,
    RecommendedIllustConfigArg,
    RelatedIllustConfigArg,
    RelatedUser,
    RelatedUserConfigArg, SearchIllustConfigArg, TrendingTagIllust, TrendingTagsIllustConfigArg,
    UserBookmarksIllustConfigArg,
    UserDetailConfigArg,
    UserIllustConfigArg,
    UserIllusts
} from "./src/@types/PixivAPI";

class Index {
    // 设置代理
    setProxy(host: string): void;

    // 是否使用代理
    setUseProxy(useProxy: boolean): void;

    // 根据refresh_token获取access_token(必须执行)
    auth(refresh_token: string): Promise<false | AuthRes>;

    // 获取指定userID的用户信息
    getUserDetail(userID: string | number, config: UserDetailConfigArg = {}): Promise<UserDetail>;

    // 根据userID获取用户作品列表
    getUserIllusts(userID: string | number, config: UserIllustConfigArg = {}): Promise<UserIllusts>;

    // 获取用户收藏作品列表
    getUserBookmarksIllusts(userID: string | number, config: UserBookmarksIllustConfigArg = {}): Promise<UserIllusts>;

    // 获取相关用户
    getRelatedUser(seedUserID: number | string, config: RelatedUserConfigArg = {}): Promise<RelatedUser>;

    // 获取已关注用户的更新
    getFollowedNewIllusts(config: FollowedNewIllustConfigArg = {}): Promise<UserIllusts>;

    // 根据PID获取作品详情
    getIllustDetail(illustID: string | number): Promise<IllustDetail>;

    // 获取作品评论
    getIllustComment(illustID: number | string, config: IllustCommentConfigArg = {}): Promise<IllustComment>;

    // 获取相关作品列表
    getRelatedIllust(illustID: number | string, config: RelatedIllustConfigArg = {}): Promise<UserIllusts>;

    // 插画推荐
    getRecommandedIllust(withAuth: boolean, config: RecommendedIllustConfigArg = {}): Promise<RecommendedIllust>;

    // 作品排行
    getIllustRanking(config: IllustRankingConfigArg = {}): Promise<UserIllusts>;

    // 获取趋势标签作品
    getTrendingTagsIllust(config: TrendingTagsIllustConfigArg = {}): Promise<TrendingTagIllust>;

    // 搜索作品（并不好用）
    searchIllust(word: string, config: SearchIllustConfigArg = {}): Promise<UserIllusts>;
    
    // 获取下一页
    getNextPage<T>(url: string): Promise<T>;

    // todo: 小说推荐
    // todo: 搜索小说
    // todo: 搜索用户
    // todo: 作品收藏
    // todo: 新增收藏
    // todo: 关注用户
    // todo: 取关用户
    // todo: 用户收藏标签列表
    // todo: 关注用户列表
    // todo: 好p友
    // todo: 黑名单用户
    // todo: 用户小说列表
    // todo: 小说系列详情
    // todo: 小说详情
    // todo: 小说正文
    // todo: 特辑详情
}
```

## Example

```typescript
async function main() {
    const client = new Index();
    client.setProxy("127.0.0.1", 10808);
    client.setUseProxy(true);
    await client.auth("1145141919810");
    console.log(client);
    console.log(await client.getUserDetail("275527"));
    console.log(await client.getUserBookmarksIllusts(2088434));
    console.log(((await client.getRelatedUser(275527)) as any).user_previews[0]);
    console.log(await client.getFollowedNewIllusts());
    console.log(await client.getIllustDetail(59580629));
    console.log(await client.getIllustComment(59580629));
    console.log(await client.getRelatedIllust(59580629));
    console.log(await client.getRecommendedIllust(true, {
        bookmark_illust_ids: [59580629]
    }));
    console.log(await client.getRecommendedIllust(true));
    console.log((await client.getTrendingTagsIllust()).trend_tags[0].illust);
    const url = await client.searchIllust("reimu", {sort: SORT.popular_desc});
    console.log(url.illusts[0]);
    console.log(await client.getNextPage<UserIllusts>(url.next_url));
    console.log(await client.getIllustRanking());
}
```
