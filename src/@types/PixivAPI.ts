export type Method = "get" | "post";

export interface ParamType {
    [key: string]: any;
}

interface AuthResUser {
    id: string;
    name: string;
}

interface AuthResResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token: string;
    user: AuthResUser;
}

export interface AuthRes extends AuthResResponse{
    response: AuthResResponse;
}

/**
 * 注意UserDetail中的头像链接只有medium
 */
interface ImageURL {
    medium: string;
    large?: string;
    square_medium?: string;
    original?: string;
}

interface UserInfo {
    id: number;
    name: string;
    account: string;
    profile_image_urls: ImageURL;
    comment: string;
    is_followed: boolean;
    is_access_blocking_user: boolean;
}

export interface UserDetail {
    user: UserInfo;
    profile: ParamType;
    profile_publicity: ParamType;
    workspace: ParamType;
}

interface TagInfo {
    name: string;
    translated_name: string;
}

interface IllustInfo {
    id: number;
    title: string;
    type: string;
    image_urls: ImageURL;
    caption: string;
    user: UserInfo;
    tags: Array<TagInfo>;
    create_date: string;
    page_count: number;
    width: number;
    height: number;
    meta_pages: Array<ImageURL>;
    meta_single_page: ImageURL;
    total_view: number;
    total_bookmarks: number;
    total_comments: number;
    next_url: string;
}

interface IllustDetailedInfo extends IllustInfo{
    sanity_level: number;
    illust_ai_type: number;
}

export interface UserIllusts{
    illusts: Array<IllustInfo>;
    next_url: string;
}

export interface RelatedUserInfo {
    user: UserInfo;
    illusts: Array<IllustInfo>;
}

export interface RelatedUser {
    user_previews: Array<RelatedUserInfo>;
}

export interface IllustDetail {
    illust: IllustInfo;
}

interface Comment {
    id: number;
    comment: string;
    date: string;
    user: UserInfo;
    // parent_comment:
}

export interface IllustComment {
    total_comment: number;
    comments: Array<Comment>;
    next_url: string;
    comment_access_control: number;
}

export interface RecommendedIllust{
    illusts: Array<IllustDetailedInfo>;
    next_url: string;
}


