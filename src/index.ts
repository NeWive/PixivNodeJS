import axios, {AxiosInstance, AxiosRequestHeaders} from "axios";
import * as crypto from "crypto";
import * as _ from "lodash"
import {
    AuthRes,
    UserIllusts,
    Method,
    ParamType,
    UserDetail,
    RelatedUser,
    IllustDetail,
    IllustComment,
    RecommendedIllust,
    TrendingTagIllust,
    UserIllustConfigArg,
    UserBookmarksIllustConfigArg,
    RelatedUserConfigArg,
    FollowedNewIllustConfigArg,
    IllustCommentConfigArg,
    RelatedIllustConfigArg,
    RecommendedIllustConfigArg,
    IllustRankingConfigArg,
    TrendingTagsIllustConfigArg,
    SearchIllustConfigArg,
    UserDetailConfigArg
} from "./@types/PixivAPI";
import * as https from "https";
import {SocksProxyAgent} from "socks-proxy-agent";
import * as moment from "moment";
import * as qs from "qs";
import {access} from "fs/promises";
import {createWriteStream} from "fs";
import * as ConstSet from "./constSet";
import path from "path";
import {checkHasProperty} from "./util";

class PixivClient {
    private clientID = "MOBrBDS8blbauoSck0ZfDbtuzpyT"
    private clientSecret = "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj"
    private hashSecret = "28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c"
    private host = "https://app-api.pixiv.net";
    private userID: string | number;
    private refreshToken: string;
    private accessToken: string;
    private expire: number;
    private requester: AxiosInstance;
    private proxyHost: string = "";
    private proxyPort: number = 1;
    private useProxy: boolean = false;

    // 只支持socks
    constructor() {
        this.userID = "";
        this.accessToken = "";
        this.refreshToken = "";
        this.expire = 3600;
        this.requester = axios.create({
            timeout: 15000
        });
        this.requester.defaults.headers.common["Accept-Language"] = "zh-CN,zh;q=0.9,en-GB;q=0.8,en;q=0.7";
        this.requester.defaults.headers.common["content-type"] = "application/x-www-form-urlencoded";
    }

    public setProxy(host: string, port: number) {
        this.proxyHost = host;
        this.proxyPort = port;
    }

    public setUseProxy(useProxy: boolean) {
        this.useProxy = useProxy;
    }

    private getMD5(key: string) {
        const md5 = crypto.createHash("md5");
        return md5.update(key, "utf-8").digest("hex");
    }

    private mergeHeaders(source: ParamType, target: ParamType) {
        return _.assign(target, source);
    }

    private async streamRequest(
        path: string,
        method: Method,
        url: string,
        headers: AxiosRequestHeaders,
        params: ParamType,
        data: unknown
    ): Promise<boolean> {
        const writer = createWriteStream(path);
        let httpsAgent;
        if(this.useProxy) {
            if(this.proxyHost && this.proxyPort) {
                httpsAgent = new SocksProxyAgent(`socks5://${this.proxyHost}:${this.proxyPort}`);
            } else {
                console.log("未配置代理");
                return false;
            }
        } else {
            httpsAgent = new https.Agent({keepAlive: true});
        }
        try {
            if(method === "get") {
                try {
                    const response = await this.requester.get(
                        url,
                        {
                            headers,
                            httpsAgent,
                            params,
                            responseType: "stream"
                        }
                    );
                    response.data.pipe(writer);
                    return await(new Promise((res) => {
                        writer.on("finish", () => {
                            res(true);
                        });
                        writer.on("error", (e) => {
                            console.log(e);
                            res(false);
                        });
                    }));
                } catch (e) {
                    console.log(e);
                    return false;
                }
            } else if(method === "post") {
                try {
                    const response = await this.requester.post(
                        url,
                        data,
                        {
                            headers,
                            httpsAgent,
                            params,
                            responseType: "stream"
                        }
                    );
                    response.data.pipe(writer);
                    return await(new Promise((res) => {
                        writer.on("finish", () => {
                            res(true);
                        });
                        writer.on("error", (e) => {
                            console.log(e);
                            res(false);
                        });
                    }));
                } catch (e: any) {
                    console.log(e);
                    return false;
                }
            }
        } catch (e) {
            console.error(e);
            return false;
        }
        return false;
    }

    private async request<T>(
        method: Method,
        url: string,
        headers: AxiosRequestHeaders,
        params: ParamType,
        data: unknown
    ) {
        // const mergedHeaders = this.mergeHeaders(headers, this.requester.defaults.headers);
        let httpsAgent;
        if(this.useProxy) {
            if(this.proxyHost && this.proxyPort) {
                httpsAgent = new SocksProxyAgent(`socks5://${this.proxyHost}:${this.proxyPort}`);
            } else {
                throw new Error("未配置代理Host和Port");
            }
        } else {
            httpsAgent = new https.Agent({keepAlive: true});
        }
        try {
            if(method === "get") {
                try {
                    return {
                        data: (await this.requester.get(
                            url,
                            {
                                headers,
                                httpsAgent,
                                params
                            }
                        )).data as T,
                        status: true
                    }
                } catch (e: any) {
                    return {
                        data: e.response.data,
                        status: false,
                        code: e.response.status,
                        message: e.response.statusText
                    };
                }
            } else if(method === "post") {
                try {
                    return {
                        data: (await this.requester.post(
                            url,
                            data,
                            {
                                params,
                                headers,
                                httpsAgent
                            }
                        )).data as T,
                        status: true,
                    }
                } catch (e: any) {
                    return {
                        data: e.response.data,
                        status: false,
                        code: e.response.status,
                        message: e.response.statusText
                    };
                }
            } else if(method === "DELETE") {
                try {
                    return {
                        data: (await this.requester.delete(
                            url,
                            {
                                params,
                                headers,
                                httpsAgent,
                                data
                            }
                        )).data as T,
                        status: true
                    }
                } catch (e: any) {
                    return {
                        data: e.response.data,
                        status: false,
                        code: e.response.status,
                        message: e.response.statusText
                    };
                }
            }
        } catch (e) {
            console.error(e);
            console.log(`请求失败，方法：${method}，URL：${url}，message：${e}`);
            return {
                data: e.response.data,
                status: false,
                code: e.response.status,
                message: e.response.statusText
            };
        }
        console.log(`未知的请求方法：${method}`);
        return {
            data: {},
            status: false
        }
    }

    public async auth(
        refreshToken: string
    ) {
        let localTime = moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss+00:00");
        let mergedHeaders: ParamType = {
            ...this.requester.defaults.headers,
            "x-client-time": localTime,
            "x-client-hash": this.getMD5(localTime + this.hashSecret)
        };
        const authHost = "https://oauth.secure.pixiv.net/auth/token";
        const data: ParamType = {
            "get_secure_url": 1,
            "client_id": this.clientID,
            "client_secret": this.clientSecret,
            "grant_type": "refresh_token",
            "refresh_token": refreshToken ? refreshToken : this.refreshToken
        };
        if(!Object.prototype.hasOwnProperty.call(mergedHeaders, "user-agent")) {
            mergedHeaders["app-os"] = "ios";
            mergedHeaders["app-os-version"] = "14.6";
            mergedHeaders["user-agent"] = "PixivIOSApp/7.13.3 (iOS 14.6; iPhone13,2)"
        }
        const res = await this.request("post", authHost, mergedHeaders as AxiosRequestHeaders, {}, qs.stringify(data));
        if (res.status) {
            const data: AuthRes = res.data;
            this.userID = data.response.user.id;
            this.accessToken = data.response.access_token;
            this.refreshToken = data.response.refresh_token;
            this.expire = data.response.expires_in;
            return data;
        } else {
            console.log(`认证失败，${res}`);
            return false;
        }
    }

    public async download(
        url: string,
        filename: string,
        dir: string,
        refer: string = "https://app-api.pixiv.net/"
    ) {
        try {
            await access(dir);
            const header: ParamType = {
                "refer": refer
            };
            return await this.streamRequest(
                path.resolve(dir, filename),
                "get",
                url,
                header as AxiosRequestHeaders,
                {},
                {}
            );
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * 发起请求，是否携带access_token
     * @param method
     * @param url
     * @param headers
     * @param param
     * @param data
     * @param auth
     */
    private async requestWithAuth<T>(
        method: Method,
        url: string,
        headers: ParamType,
        param: any,
        data: any,
        auth: boolean = true,
    ) {
        const mergedHeaders: ParamType = {
            ...this.requester.defaults.headers,
            ...headers
        };
        if (!Object.prototype.hasOwnProperty.call(mergedHeaders, "user-agent")) {
            mergedHeaders["app-os"] = "ios"
            mergedHeaders["app-os-version"] = "14.6"
            mergedHeaders["user-agent"] = "PixivIOSApp/7.13.3 (iOS 14.6; iPhone13,2)"
        }
        if(auth) {
            mergedHeaders["Authorization"] = `Bearer ${this.accessToken}`;
            const res = await this.request<T>(method, url, mergedHeaders as AxiosRequestHeaders, param, data);
            if(res.status) {
                return res.data as T;
            }
            console.log(res.data);
            throw new Error(`请求时发生错误，Code: ${res.code}，${res.message}}`);
        } else {
            const res = await this.request<T>(method, url, mergedHeaders as AxiosRequestHeaders, param, data);
            if(res.status) {
                return res.data as T;
            }
            throw new Error(`请求时发生错误，Code: ${res.code}，${res.message}, ${res}`);
        }
    }

    /**
     * 用户详情
     * @param userID
     * @param config
     */
    public async getUserDetail(
        userID: string | number,
        config: UserDetailConfigArg = {}
    ) {
        const url = `${this.host}/v1/user/detail`;
        const params: ParamType = {
            "user_id": userID,
            "filter": ConstSet.FILTER.for_ios,
        };
        return await this.requestWithAuth<UserDetail>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 用户作品列表
     * @param userID
     * @param config
     */
    public async getUserIllusts(
        userID: string | number,
        config: UserIllustConfigArg = {}
    ) {
        const url = `${this.host}/v1/user/illusts`;
        const params = {
            "user_id": userID,
            type: ConstSet.IllustType.illust,
            filter: ConstSet.FILTER.for_ios,
            offset: 0,
            ...config
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 用户收藏作品列表
     * @param userID
     * @param config
     */
    public async getUserBookmarksIllusts(
        userID: string | number,
        config: UserBookmarksIllustConfigArg = {}
    ) {
        const url = `${this.host}/v1/user/bookmarks/illust`;
        const params = {
            "user_id": userID,
            "restrict": ConstSet.RESTRICT.pub,
            "filter": ConstSet.FILTER.for_ios,
            ...config
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 获取相关用户
     * @param seedUserID
     * @param config
     */
    public async getRelatedUser(
        seedUserID: number | string,
        config: RelatedUserConfigArg = {}
    ) {
        const url = `${this.host}/v1/user/related`;
        const params = {
            "filter": ConstSet.FILTER.for_ios,
            "offset": 0,
            "seed_user_id": seedUserID,
            ...config
        };
        return await this.requestWithAuth<RelatedUser>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 获取已关注用户的更新
     * @param config
     */
    public async getFollowedNewIllusts(
        config: FollowedNewIllustConfigArg = {}
    ) {
        const url = `${this.host}/v2/illust/follow`;
        const param = {
            "restrict": ConstSet.RESTRICT.pub,
            "offset": 0,
            ...config
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            param,
            {},
            true
        );
    }

    /**
     * 根据PID获取作品详情
     * @param illustID
     */
    public async getIllustDetail(
        illustID: string | number
    ) {
        const url = `${this.host}/v1/illust/detail`;
        const params = {
            "illust_id": illustID
        };
        return await this.requestWithAuth<IllustDetail>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 获取作品评论
     * @param illustID
     * @param config
     */
    public async getIllustComment(
        illustID: number | string,
        config: IllustCommentConfigArg = {}
    ) {
        const url = `${this.host}/v1/illust/comments`;
        const params = {
            "illust_id": illustID,
            "offset": 0,
            "include_total_comments": false,
            ...config
        };
        return await this.requestWithAuth<IllustComment>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 相关作品列表
     * @param illustID
     * @param config
     */
    public async getRelatedIllust(
        illustID: number | string,
        config: RelatedIllustConfigArg = {}
    ) {
        const url = `${this.host}/v2/illust/related`;
        const params = {
            "illust_id": illustID,
            "filter": ConstSet.FILTER.for_ios,
            "offset": 0,
            ...config
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 插画推荐
     * @param withAuth
     * @param config
     */
    public async getRecommendedIllust(
        withAuth: boolean,
        config: RecommendedIllustConfigArg = {},
    ) {
        const url = `${this.host}${withAuth ? "/v1/illust/recommended" : "/v1/illust/recommended-nologin"}`;
        const params = {
            "content_type": ConstSet.CONTENT_TYPE.illust,
            "filter": ConstSet.FILTER.for_ios,
            "offset": 0,
            "include_ranking_label": true,
            ...config
        };
        //todo: ranking_illusts
        return await this.requestWithAuth<RecommendedIllust>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 作品排行
     * @param config
     */
    public async getIllustRanking(
        config: IllustRankingConfigArg = {}
    ) {
        const url = `${this.host}/v1/illust/ranking`;
        const params = {
            "mode": ConstSet.MODE.day,
            "filter": ConstSet.FILTER.for_ios,
            "offset": 0,
            ...config
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 获取趋势标签作品
     * @param withAuth
     * @param config
     */
    public async getTrendingTagsIllust(
        config: TrendingTagsIllustConfigArg = {}
    ) {
        const url = `${this.host}/v1/trending-tags/illust`;
        const params = {
            "filter": ConstSet.FILTER.for_ios,
            ...config
        };
        return await this.requestWithAuth<TrendingTagIllust>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    /**
     * 搜索作品
     * @param word
     * @param config
     */
    public async searchIllust(
        word: string,
        config: SearchIllustConfigArg = {}
    ) {
        const url = `${this.host}/v1/search/illust`;
        const params = {
            word,
            "search_target": ConstSet.SEARCH_TARGET.keyword,
            "sort": ConstSet.SORT.date_desc,
            "filter": ConstSet.FILTER.for_ios,
            "duration": ConstSet.DURATION.others,
            "offset": 0,
            ...config
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            params,
            {},
            true
        );
    }

    public async getNextPage<T>(
        url: string
    ) {
        return await this.requestWithAuth<T>(
            "get",
            url,
            {},
            {},
            {},
            true
        );
    }

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

export default PixivClient;