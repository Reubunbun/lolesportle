import LiquipediaAPI from '@shared/helpers/liquipediaApi';
import withDb from '@shared/helpers/withDb';

const BLACKLIST_TERMS = [
    'promotion',
    'qualifier',
    'rift rivals',
    'all-star',
    'circuit points',
    'aram',
    'play-in',
    'spring expansion',
    'worlds qualifying series',
    'season kickoff',
    'season opening',
];

export const handler = withDb(async (dbConn) => {
    const results = await LiquipediaAPI.query(
        'tournament',
        [
            'pageid',
            'pagename',
            'name',
            'shortname',
            'tickername',
            'seriespage',
            'startdate',
            'enddate',
            'participantsnumber',
        ],
        {
            liquipediatier: '1',
            enddate: `<${(new Date()).toISOString().split('T').shift()}`,
        },
    );

    const filteredResults = results.filter(
        r => !BLACKLIST_TERMS.some(term => r.name.toLowerCase().includes(term),
    ));

    await dbConn('tournaments')
        .insert(filteredResults.map(r => ({
            page_id: r.pageid,
            path_name: r.pagename,
            name: r.name,
            alt_names: JSON.stringify(
                Array.from(new Set([ r.shortname, r.tickername ].filter(Boolean)))
            ),
            series: r.seriespage,
            start_date: r.startdate,
            end_date: r.enddate,
            no_participants: (r.participantsnumber < 0) ? 0 : r.participantsnumber,
        })))
        .onConflict('path_name')
        .merge([
            'path_name',
            'name',
            'alt_names',
            'series',
            'start_date',
            'end_date',
            'no_participants',
        ]);
});
