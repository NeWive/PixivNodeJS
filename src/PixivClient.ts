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
    IllustComment, RecommendedIllust
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

interface RecommendedIllustConfigArg {
    max_bookmark_id_for_recommend?: number | string,
    min_bookmark_id_for_recent_illust?: number | string,
    include_ranking_illusts?: boolean,
    bookmark_illust_ids?: Array<number | string>,
    include_privacy_policy?: Array<number | string>
    include_ranking_label?: boolean;
}

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
        data: unknown,
        useProxy: boolean
    ): Promise<boolean> {
        const writer = createWriteStream(path);
        let httpsAgent;
        if(useProxy) {
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
        data: unknown,
        useProxy: boolean
    ) {
        // const mergedHeaders = this.mergeHeaders(headers, this.requester.defaults.headers);
        let httpsAgent;
        if(useProxy) {
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
        headers: ParamType,
        refresh_token?: string
    ) {
        let localTime = moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss+00:00");
        let mergedHeaders: ParamType = {
            ...this.requester.defaults.headers,
            ...headers,
            "x-client-time": localTime,
            "x-client-hash": this.getMD5(localTime + this.hashSecret)
        };
        const authHost = "https://oauth.secure.pixiv.net/auth/token";
        const data: ParamType = {
            "get_secure_url": 1,
            "client_id": this.clientID,
            "client_secret": this.clientSecret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token ? refresh_token : this.refreshToken
        };
        if(!Object.prototype.hasOwnProperty.call(mergedHeaders, "user-agent")) {
            mergedHeaders["app-os"] = "ios";
            mergedHeaders["app-os-version"] = "14.6";
            mergedHeaders["user-agent"] = "PixivIOSApp/7.13.3 (iOS 14.6; iPhone13,2)"
        }
        const res = await this.request("post", authHost, mergedHeaders as AxiosRequestHeaders, {}, qs.stringify(data), true);
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
                {},
                true
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
     * @param useProxy
     * @param auth
     */
    public async requestWithAuth<T>(
        method: Method,
        url: string,
        headers: ParamType,
        param: any,
        data: any,
        useProxy: boolean,
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
            const res = await this.request<T>(method, url, mergedHeaders as AxiosRequestHeaders, param, data, useProxy);
            if(res.status) {
                return res.data as T;
            }
            throw new Error(`请求时发生错误，Code: ${res.code}，${res.message}`);
        } else {
            const res = await this.request<T>(method, url, mergedHeaders as AxiosRequestHeaders, param, data, useProxy);
            if(res.status) {
                return res.data as T;
            }
            throw new Error(`请求时发生错误，Code: ${res.code}，${res.message}`);
        }
    }

    /**
     * 用户详情
     * @param userID
     * @param withAuth
     * @param filter
     * @param useProxy
     */
    public async getUserDetail(
        userID: string | number,
        filter: ConstSet.FILTER = ConstSet.FILTER.for_ios,
        withAuth: boolean = true,
        useProxy: boolean = true
    ) {
        const url = `${this.host}/v1/user/detail`;
        const params: ParamType = {
            "user_id": userID,
            "filter": filter,
        };
        return await this.requestWithAuth<UserDetail>(
            "get",
            url,
            {},
            params,
            {},
            useProxy,
            withAuth
        );
    }

    /**
     * 用户作品列表
     * @param userID
     * @param offset
     * @param type
     * @param filter
     * @param withAuth
     * @param useProxy
     */
    public async getUserIllusts(
        userID: string | number,
        offset: number = 0,
        type: ConstSet.IllustType = ConstSet.IllustType.illust,
        filter: ConstSet.FILTER = ConstSet.FILTER.for_ios,
        withAuth: boolean = true,
        useProxy: boolean = true
    ) {
        const url = `${this.host}/v1/user/illusts`;
        const params = {
            "user_id": userID,
            "filter": filter,
            type,
            offset
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            params,
            {},
            useProxy,
            withAuth
        );
    }

    /**
     * 用户收藏作品列表
     * @param userID
     * @param maxBookmarkID
     * @param tag
     * @param restrict
     * @param filter
     * @param withAuth
     * @param useProxy
     */
    public async getUserBookmarksIllust(
        userID: string | number,
        maxBookmarkID?: string,
        tag?: string,
        restrict: ConstSet.RESTRICT = ConstSet.RESTRICT.pub,
        filter: ConstSet.FILTER = ConstSet.FILTER.for_ios,
        withAuth: boolean = true,
        useProxy: boolean = true
    ) {
        const url = `${this.host}/v1/user/bookmarks/illust`;
        const params = {
            "user_id": userID,
            "restrict": restrict,
            "filter": filter,
        };
        if(maxBookmarkID) {
            params["max_bookmark_id"] = maxBookmarkID;
        }
        if(tag) {
            params["tag"] = tag;
        }
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            params,
            {},
            useProxy,
            withAuth
        );
    }

    /**
     * 获取相关用户
     * @param seedUserID
     * @param offset
     * @param filter
     * @param withAuth
     * @param useProxy
     */
    public async getRelatedUser(
        seedUserID: number | string,
        offset: number = 0,
        filter: ConstSet.FILTER = ConstSet.FILTER.for_ios,
        withAuth: boolean = true,
        useProxy: boolean = true
    ) {
        const url = `${this.host}/v1/user/related`;
        const params = {
            "filter": filter,
            "offset": offset,
            "seed_user_id": seedUserID
        };
        return await this.requestWithAuth<RelatedUser>(
            "get",
            url,
            {},
            params,
            {},
            useProxy,
            withAuth
        );
    }

    /**
     * 获取已关注用户的更新
     * @param offset
     * @param restrict
     * @param withAuth
     * @param useProxy
     */
    public async getFollowedNewIllusts(
        offset: number = 0,
        restrict: ConstSet.RESTRICT = ConstSet.RESTRICT.pub,
        withAuth: boolean = true,
        useProxy: boolean = true
    ) {
        const url = `${this.host}/v2/illust/follow`;
        const param = {
            restrict,
            offset
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            param,
            {},
            useProxy,
            withAuth
        );
    }

    /**
     * 根据PID获取作品详情
     * @param illustID
     * @param withAuth
     * @param useProxy
     */
    public async getIllustDetail(
        illustID: string | number,
        withAuth: boolean = true,
        useProxy: boolean = true
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
            useProxy,
            withAuth
        );
    }

    /**
     * 获取作品评论
     * @param illustID
     * @param offset
     * @param includeTotalComments
     * @param withAuth
     * @param useProxy
     */
    public async getIllustComment(
        illustID: number | string,
        offset: number = 0,
        includeTotalComments: boolean = false,
        withAuth: boolean = true,
        useProxy: boolean = true
    ) {
        const url = `${this.host}/v1/illust/comments`;
        const params = {
            "illust_id": illustID,
            offset,
            "include_total_comments": includeTotalComments
        };
        return await this.requestWithAuth<IllustComment>(
            "get",
            url,
            {},
            params,
            {},
            useProxy,
            withAuth
        );
    }

    /**
     * 相关作品列表
     * @param illustID
     * @param filter
     * @param offset
     * @param withAuth
     * @param useProxy
     */
    public async getRelatedIllust(
        illustID: number | string,
        filter: ConstSet.FILTER = ConstSet.FILTER.for_ios,
        offset: number = 0,
        // viewed: Array<string> = [],
        // illustSeedID: Array<number> = [],
        withAuth: boolean = true,
        useProxy: boolean = true
    ) {
        const url = `${this.host}/v2/illust/related`;
        const params = {
            "illust_id": illustID,
            filter,
            offset
        };
        return await this.requestWithAuth<UserIllusts>(
            "get",
            url,
            {},
            params,
            {},
            useProxy,
            withAuth
        );
    }

    /**
     * 插画推荐
     * @param offset
     * @param contentType
     * @param filter
     * @param useProxy
     * @param withAuth
     * @param config
     */
    public async getRecommendedIllust(
        offset: number = 0,
        config: RecommendedIllustConfigArg = {
            include_ranking_label: true
        },
        contentType: ConstSet.CONTENT_TYPE = ConstSet.CONTENT_TYPE.illust,
        filter: ConstSet.FILTER = ConstSet.FILTER.for_ios,
        useProxy: boolean = true,
        withAuth: boolean = true,
    ) {
        const url = `${this.host}${withAuth ? "/v1/illust/recommended" : "/v1/illust/recommended-nologin"}`;
        const params = {
            "content_type": contentType,
            filter,
            offset
        };
        if(checkHasProperty(config, "include_ranking_label")) {
            params["include_ranking_label"] = config.include_ranking_label;
        } else {
            params["include_ranking_label"] = true;
        }
        if(checkHasProperty(config, "max_bookmark_id_for_recommend")) {
            params["max_bookmark_id_for_recommend"] = config.max_bookmark_id_for_recommend;
        }
        if(checkHasProperty(config, "min_bookmark_id_for_recent_illust")) {
            params["min_bookmark_id_for_recent_illust"] = config.min_bookmark_id_for_recent_illust;
        }
        if(checkHasProperty(config, "include_ranking_illusts")) {
            params["include_ranking_illusts"] = config.include_ranking_illusts;
        }
        if(!withAuth && checkHasProperty(config, "bookmark_illust_ids")) {
            params["bookmark_illust_ids"] = config.bookmark_illust_ids.join(",")
        }
        if(checkHasProperty(config, "include_privacy_policy")) {
            params["include_privacy_policy"] = config.include_privacy_policy;
        }
        //todo: ranking_illusts
        return await this.requestWithAuth<RecommendedIllust>(
            "get",
            url,
            {},
            params,
            {},
            useProxy,
            withAuth
        );
    }

    //todo: 小说推荐

    /**
     * 作品排行
     * @param offset
     * @param mode
     * @param filter
     * @param withAuth
     * @param useProxy
     * @param data：格式"2016-08-01"
     */
    public async getIllustRanking(
        offset: number = 0,
        mode: ConstSet.MODE = ConstSet.MODE.day,
        filter: ConstSet.FILTER = ConstSet.FILTER.for_ios,
        withAuth: boolean = true,
        useProxy: boolean = true,
        date?: string
    ) {
        const url = `${this.host}/v1/illust/ranking`;
        const params = {
            "mode": mode,
            "filter": filter,
            offset
        };
        if(date) {
            params["date"] = date;
        }
        return await this.requestWithAuth(
            "get",
            url,
            {},
            params,
            {},
            useProxy,
            withAuth
        );
    }

    //todo: 趋势标签

    public async searchIllust(
        word: string,
        offset: number = 0,
        searchTarget: ConstSet.SEARCH_TARGET = ConstSet.SEARCH_TARGET.partial_match_for_tags,
        sort: ConstSet.SORT = ConstSet.SORT.date_asc,
        duration: ConstSet.DURATION = ConstSet.DURATION.others,
        // todo: start_date, end_date
        filter: ConstSet.FILTER = ConstSet.FILTER.for_ios,
        useProxy: boolean = true,
        withAuth: boolean = true
    ) {
        const url = `${this.host}/v1/search/illust`;

    }

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