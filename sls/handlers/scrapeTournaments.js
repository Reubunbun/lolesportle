const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const knex = require('knex')({ client: 'mysql' });
const { LIQUIPEDIA_BASE_URL } = require('../shared/constants');

/**
 * @param {number} numberOfTeams
 * @param {number} position
 */
function positionToWinPercentage(position, numberOfTeams) {
  const percentage = ((numberOfTeams - position) / (numberOfTeams - 1)) * 100;
  return Math.round(percentage);
}

/** @param {mysql.Connection} dbConn */
async function scrapeTournaments(dbConn) {
  const [tournamentsToScrape] = await dbConn.query(
    knex('esportle.tournaments')
      .select('url')
      .where('needs_scrape', 1)
      .limit(10)
      .toString(),
  );

  for (const { url } of tournamentsToScrape) {
    console.log('Scraping tournament:', url);

    const response = await fetch(url);
    const text = await response.text();
    const $ = cheerio.load(text);

    // 1. Start and end dates

    const startDate = $('.infobox-cell-2.infobox-description')
      .filter((_, el) => $(el).text().trim() === 'Start Date:')
      .next()
      .text()
      .trim();
    const endDate = $('.infobox-cell-2.infobox-description')
      .filter((_, el) => $(el).text().trim() === 'End Date:')
      .next()
      .text()
      .trim();

    // 2. Teams and players

    const teamToPlayers = {};
    $('div.teamcard').each((_, elTeamCard) => {
      const teamPath = $(elTeamCard).find('a').first().attr('href');
      const players = [];

      const elPlayerTable = $(elTeamCard).find('table[data-toggle-area-content="1"]');
      $(elPlayerTable).find('td').each((_, elRow) => players.push($(elRow).find('a').last().attr('href')));

      teamToPlayers[`${LIQUIPEDIA_BASE_URL}${teamPath}`] =
        players.filter(Boolean).map(playerUrl => `${LIQUIPEDIA_BASE_URL}${playerUrl}`);
    });

    // 3. Positions

    const teamToPosition = {};
    const elPositionTable = $('div.prizepooltable').first();
    $(elPositionTable).find('div.csstable-widget-row').each((i, elRow) => {
      if (i === 0) return; // header

      const position = $(elRow).find('div.prizepooltable-place').text().trim();
      const parsedPosition = (position.split('-').pop() || '').match(/^\d+/);
      if (!parsedPosition) {
        throw new Error(`Could not parse position: ${position}`);
      }
      const intPosition = +parsedPosition[0];

      const teams = [];
      $(elRow).find('div.block-team').each((_, elTeam) => {
        const teamLink = $(elTeam).find('span.name a').attr('href');
        if (teamLink) {
          teams.push(`${LIQUIPEDIA_BASE_URL}${teamLink}`);
        }
      });

      if (teams.length === 0) {
        throw new Error(`No teams found for position ${position} in tournament ${url}`);
      }

      for (const teamUrl of teams) {
        teamToPosition[teamUrl] = intPosition;
      }
    });

    // 4 Upserts

    const allTeams = Object.keys(teamToPlayers);
    await dbConn.query(
      knex('esportle.teams')
        .insert(allTeams.map(url => ({ url })))
        .onConflict()
        .ignore()
        .toString(),
    );

    const allPlayers = Array.from(new Set(Object.values(teamToPlayers).flat()));
    await dbConn.query(
      knex('esportle.players')
        .insert(allPlayers.map(url => ({ url })))
        .onConflict()
        .ignore()
        .toString(),
    );

    const tournamentPlayerInserts = allTeams.flatMap(teamUrl => {
      const players = teamToPlayers[teamUrl];
      const position = teamToPosition[teamUrl];

      console.log(`positionToWinPercentage(${position}, ${allTeams.length}): ${positionToWinPercentage(position, allTeams.length)}`);

      return players.map(playerUrl => ({
        tournament_url: url,
        player_url: playerUrl,
        team_url: teamUrl,
        position: position,
        beat_percent: positionToWinPercentage(position, allTeams.length),
      }));
    });
    await dbConn.query(
      knex('esportle.tournament_players')
        .insert(tournamentPlayerInserts)
        .onConflict()
        .merge(['team_url', 'position', 'beat_percent'])
        .toString(),
    );

    await dbConn.query(
      knex('esportle.tournaments')
        .update({
          start_date: startDate || null,
          end_date: endDate || null,
          needs_scrape: 0,
        })
        .where('url', url)
        .toString(),
    );

    return;
  }
}

exports.handler = async () => {
  const dbConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await scrapeTournaments(dbConn);
  } catch (e) {
    console.error(e);
  } finally {
    await dbConn.end();
  }
};
