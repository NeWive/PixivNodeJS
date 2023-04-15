import PixivClient from "../PixivClient";
import {CONTENT_TYPE, FILTER} from "../constSet";

async function main() {
    const client = new PixivClient();
    client.setProxy("127.0.0.1", 10808);
    await client.auth({}, "GvNl3pADffWDXRzsRvz2JggqyGDwYOsBPSzYNT6Ut-w");
    // console.log(client);
    // console.log(await client.getUserDetail("275527", ConstSet.FILTER.for_ios, true, true));
    // const example = await client.getUserIllusts("275527", 0, ConstSet.IllustType.illust, ConstSet.FILTER.for_ios, true, true);
    // console.log(example.next_url);
    // console.log(await client.getUserBookmarksIllust(2088434));
    // console.log(((await client.getRelatedUser(275527)) as any).user_previews[0]);
    // console.log(await client.getFollowedNewIllusts());
    // console.log(await client.getIllustDetail(59580629));
    // console.log(await client.getIllustComment(59580629));
    // console.log(await client.getRelatedIllust(59580629));
    console.log(await client.getRecommendedIllust(0,{
        bookmark_illust_ids: [59580629]
    }, CONTENT_TYPE.illust, FILTER.for_ios,));
    console.log(await client.getRecommendedIllust());
}

 main();