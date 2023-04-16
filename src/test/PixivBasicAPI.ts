import PixivClient from "../PixivClient";
import {SORT} from "../constSet";
import {UserIllusts} from "../@types/PixivAPI";

async function main() {
    const client = new PixivClient();
    client.setProxy("127.0.0.1", 10808);
    client.setUseProxy(true);
    await client.auth("GvNl3pADffWDXRzsRvz2JggqyGDwYOsBPSzYNT6Ut-w");
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

 main();