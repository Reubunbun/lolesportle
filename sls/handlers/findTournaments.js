const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const knex = require('knex')({ client: 'mysql' });
const { LIQUIPEDIA_BASE_URL } = require('../shared/constants');

const BLACKLISTED_TOURNAMENTS = [
  'all-star',
  'rift rivals',
  'circuit points',
];

async function findTournaments(dbConn) {
  const response = await fetch('https://liquipedia.net/leagueoflegends/S-Tier_Tournaments');
  const text = await response.text();

  const $ = cheerio.load(text);

  const tournaments = [];
  const seriesUrlToDetails = {};

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

      const seriesLink = $(elRow).find('div.Tournament a').first().attr('href');
      const seriesName = $(elRow).find('div.Tournament img').first().attr('alt').trim();
      const seriesSmallLogo = $(elRow).find('div.Tournament img').first().attr('src').trim();
      const tournamentLink = $(elRow).find('div.Tournament a').last().attr('href');

      seriesUrlToDetails [`${LIQUIPEDIA_BASE_URL}${seriesLink}`] = {
        name: seriesName,
        small_icon_path: seriesSmallLogo,
      };

      tournaments.push({
        name: tournamentName,
        url: `${LIQUIPEDIA_BASE_URL}${tournamentLink}`,
        series_url: `${LIQUIPEDIA_BASE_URL}${seriesLink}`,
      });
    });
  });

  const allSeries = Object.keys(seriesUrlToDetails);
  await dbConn.query(
    knex('esportle.tournament_series')
      .insert(Array.from(allSeries).map(url => ({ url, ...seriesUrlToDetails[url] })))
      .onConflict()
      .ignore()
      .toString(),
  );

  await dbConn.query(
    knex('esportle.tournaments')
      .insert(tournaments)
      .onConflict()
      .merge([
        'name',
        'start_date',
        'end_date',
      ])
      .toString(),
  );
}

exports.handler = async () => {
  const dbConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await findTournaments(dbConn);
  } catch (e) {
    console.error(e);
  } finally {
    await dbConn.end();
  }
};
