const cheerio = require('cheerio');
const knex = require('knex')({ client: 'mysql' });
const { LIQUIPEDIA_BASE_URL } = require('../shared/constants');
const withDb = require('../shared/helpers/withDb');

const BLACKLISTED_TOURNAMENTS = [
  'all-star',
  'rift rivals',
  'circuit points',
];

const INTERNATIONAL_IDENTIFIERS = [
  'Asia_Invitational',
  'Esports_World_Cup',
  'First_Stand_Tournament',
  'IGN_ProLeague',
  'Intel_Extreme_Masters',
  'Mid-Season_Invitational',
  'World_Championship',
];

exports.handler = withDb(async (dbConn) => {
  const response = await fetch('https://liquipedia.net/leagueoflegends/S-Tier_Tournaments');
  const text = await response.text();

  const $ = cheerio.load(text);

  const tournaments = [];

  $('div.gridTable.tournamentCard.Tierless.NoGameIcon').each((_, elTable) => {
    $(elTable).find('div.gridRow').each((_, elRow) => {
      const tournamentName = $(elRow).find('div.Tournament').text().trim();

      const isBlacklisted = BLACKLISTED_TOURNAMENTS.some(blacklistedTerm =>
        tournamentName.toLowerCase().includes(blacklistedTerm)
      );
      if (isBlacklisted) return;

      const firstPlaceCell = $(elRow).find('div.FirstPlace');
      if (
        // The tournament has not finished yet, or was cancelled
        firstPlaceCell.length === 0 ||
        firstPlaceCell.text().trim() === 'TBD'
      ) {
        console.log(tournamentName, 'skipped (not finished yet or cancelled)');
        return;
      }

      const tournamentLink = $(elRow).find('div.Tournament a').last().attr('href');
      const isInternational = INTERNATIONAL_IDENTIFIERS.some(identifier =>
        tournamentLink.includes(identifier)
      );

      tournaments.push({
        name: tournamentName,
        url: `${LIQUIPEDIA_BASE_URL}${tournamentLink}`,
        is_international: isInternational,
      });
    });
  });

  await dbConn.query(
    knex('tournaments')
      .insert(tournaments)
      .onConflict()
      .merge([ 'name', 'is_international' ])
      .toString(),
  );
});
