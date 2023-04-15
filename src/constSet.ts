export enum FILTER {
    for_ios = "for_ios",
    others = ""
};
export enum IllustType {
    illust = "illust",
    manga = "manga",
    others = ""
};
export enum RESTRICT {
    pub = "public",
    pri = "private",
    others = ""
};
export enum CONTENT_TYPE {
    illust = "illust",
    manga = "manga",
    others = ""
};
export enum MODE {
    day = "day",
    week = "week",
    month = "month",
    day_male = "day_male",
    day_female = "day_female",
    week_original = "week_original",
    week_rookie = "week_rookie",
    day_manga = "day_manga",
    day_r18 = "day_r18",
    day_male_r18 = "day_male_r18",
    day_female_r18 = "day_female_r18",
    week_r18 = "week_r18",
    week_r18g = "week_r18g",
    others = "",
};
export enum SEARCH_TARGET {
    partial_match_for_tags = "partial_match_for_tags",
    exact_match_for_tags = "exact_match_for_tags",
    title_and_caption = "title_and_caption",
    keyword = "keyword",
    others = ""
}
export enum SORT {
    date_desc = "date_desc",
    date_asc = "date_asc",
    popular_desc = "popular_desc",
    others = ""
}
export enum DURATION {
    within_last_day = "within_last_day",
    within_last_week = "within_last_week",
    within_last_month = "within_last_month",
    others = ""
}
export enum BOOL {
    TRUE = "true",
    FALSE = "false"
}