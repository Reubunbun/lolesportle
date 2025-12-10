import axios from 'axios';
import https from 'https';

type Tournament = {
    pageid: number;
    pagename: string;
    namespace: number;
    objectname: string;
    name: string;
    shortname: string;
    tickername: string;
    banner: string;
    bannerurl: string;
    bannerdark: string;
    bannerdarkurl: string;
    icon: string;
    iconurl: string;
    icondark: string;
    icondarkurl: string;
    seriespage: string;
    serieslist: Record<`${number}`, string>;
    previous: string;
    previous2: string;
    next: string;
    next2: string;
    game: string;
    mode: string;
    patch: string;
    endpatch: string;
    type: string;
    organizers: string;
    startdate: string;
    enddate: string;
    sortdate: string;
    locations: Record<string, string>;
    prizepool: number;
    participantsnumber: number;
    liquipediatier: string;
    liquipediatiertype: string;
    publishertier: string;
    status: string;
    maps: string;
    format: string;
    sponsors: string;
    extradata: Record<string, string>;
    wiki: string;
};
type Placement = {
    pageid: number;
    pagename: string;
    namespace: number;
    objectname: string;
    tournament: string;
    series: string;
    parent: string;
    imageurl: string;
    imagedarkurl: string;
    startdate: string;
    date: string;
    placement: string;
    prizemoney: number;
    individualprizemoney: number;
    prizepoolindex: number;
    weight: number;
    mode: string;
    type: string;
    liquipediatier: string;
    liquipediatiertype: string;
    publishertier: string;
    icon: string;
    iconurl: string;
    icondark: string;
    icondarkurl: string;
    game: string;
    lastvsdata: {
        opponenttype: string;
        opponentname: string;
        score: number;
        opponenttemplate: string;
    };
    opponentname: string;
    opponenttemplate: string;
    opponenttype: string;
    opponentplayers: Record<`p${number}`, string>;
    qualifier: string;
    qualifierpage: string;
    qualifierurl: string;
    extradata: {
        prizepoints2: string;
        publisherpremier: string;
        patch: string;
        status: string;
        series2: string;
        prizepoints: string;
        lis: string;
    };
    wiki: string;
};
type Team = {
    pageid: number;
    pagename: string;
    namespace: number;
    objectname: string;
    name: string;
    locations: Record<string, string>;
    region: string;
    logo: string;
    logourl: string;
    logodark: string;
    logodarkurl: string;
    textlesslogourl: string;
    textlesslogodarkurl: string;
    status: string;
    createdate: string;
    disbanddate: string;
    earnings: number;
    earningsbyyear: Record<string, number>;
    template: string;
    links: {
        instagram: string;
        youtube: string;
        facebook: string;
        home: string;
        twitter: string;
    };
    extradata: {
        competesin: string;
    };
    wiki: string;
};
type Player = {
    pageid: number;
    pagename: string;
    namespace: number;
    objectname: string;
    id: string;
    alternateid: string;
    name: string;
    localizedname: string;
    type: string;
    nationality: string;
    nationality2: string;
    nationality3: string;
    region: string;
    birthdate: string;
    deathdate: string;
    teampagename: string;
    teamtemplate: string;
    links: {
        facebook: string;
        twitter: string;
        twitch: string;
    };
    status: string;
    earnings: number;
    earningsbyyear: Record<string, number>;
    extradata: {
        [key: `signatureChampion${number}`]: string|undefined;
        roles: Record<number, string>;
        role: string;
    }
    wiki: string;
};

type Endpoints = {
    tournament: Tournament;
    placement: Placement;
    team: Team;
    player: Player;
};

type LiquipediaResponse<T> = {
    result: T;
};
type FilteredLiquipediaResponse<T, K extends keyof T> = LiquipediaResponse<Pick<T, K>[]>;

export default class LiquipediaAPI {
    private static _axios = axios.create({
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        baseURL: 'https://api.liquipedia.net/api/v3',
        headers: {
            Authorization: `Apikey ${process.env.LIQUIPEDIA_API_KEY}`,
            Accept: 'application/json',
        },
        params: {
            wiki: 'leagueoflegends',
            limit: 10000,
        },
    });

    static async query<E extends keyof Endpoints, R extends keyof Endpoints[E]>(
        endpoint: E,
        returnFields: readonly R[],
        conditions: Partial<Record<keyof Endpoints[E], string|string[]>>,
        limit: number = 1000,
    ) : Promise<Pick<Endpoints[E], R>[]> {
        const formattedConditions: string[] = [];
        for (const [key, value] of Object.entries(conditions)) {
            if (!Array.isArray(value)) {
                formattedConditions.push(`[[${key}::${value}]]`);
                continue;
            }

            const conditionsForGroup: string[] = [];
            for (const groupedValue of value) {
                conditionsForGroup.push(`[[${key}::${groupedValue}]]`);
            }
            formattedConditions.push(`(${conditionsForGroup.join('OR')})`);
        }

        const { data } = await LiquipediaAPI
            ._axios
            .get<FilteredLiquipediaResponse<Endpoints[E], typeof returnFields[number]>>(
                endpoint,
                {
                    params: {
                        limit,
                        query: returnFields.join(','),
                        conditions: formattedConditions.join('AND'),
                    },
                },
            );

        return data.result;
    }
}
