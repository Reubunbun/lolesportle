const cheerio = require('cheerio');
const knex = require('knex')({ client: 'mysql' });
const { LIQUIPEDIA_BASE_URL } = require('../shared/constants');
const withDb = require('../shared/helpers/withDb');

/** @param {string} fullLink */
function getParsedLink(fullLink) {
  const url = new URL(fullLink);
  const isRedLink = url.searchParams.has('redlink');
  const title = url.searchParams.get('title');

  if (!title) {
    return { url: fullLink, pageMissing: false };
  }

  return {
    url: `${LIQUIPEDIA_BASE_URL}/leagueoflegends/${title}`,
    pageMissing: isRedLink,
  };
}

/**
 * @param {number} numberOfTeams
 * @param {number} position
 */
function positionToWinPercentage(position, numberOfTeams) {
  const percentage = ((numberOfTeams - position) / (numberOfTeams - 1)) * 100;
  return Math.round(percentage);
}

exports.handler = withDb(async (dbConn) => {
  const [tournamentsToScrape] = await dbConn.query(
    knex('tournaments')
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
      if (!teamPath) return;

      const players = [];

      const elPlayerTable = $(elTeamCard).find('table[data-toggle-area-content="1"]');
      $(elPlayerTable).find('tr').each((_, elRow) => {
        const role = $(elRow).find('th img').first().attr('alt');
        const playerUrl = $(elRow).find('a').last().attr('href');

        if (!playerUrl || !role) return;

        players.push({ role, player: `${LIQUIPEDIA_BASE_URL}${playerUrl}` });
      });

      if (!players.length) return;

      teamToPlayers[`${LIQUIPEDIA_BASE_URL}${teamPath}`] = players;
    });

    // 3. Positions

    const teamToPosition = {};
    const elPositionTable = $('div.prizepooltable').first();
    $(elPositionTable).find('div.csstable-widget-row').each((i, elRow) => {
      if (i === 0) return; // header

      const elExpandButton = $(elRow).find('div.general-collapsible-expand-button');
      if (elExpandButton.length > 0) {
        return;
      }

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
      knex('teams')
        .insert(allTeams.map(url => {
          const parsedUrl = getParsedLink(url);
          return {
            url: parsedUrl.url,
            page_missing: parsedUrl.pageMissing,
          };
        }))
        .onConflict()
        .merge([ 'page_missing' ])
        .toString(),
    );

    await dbConn.query(
      knex('players')
        .insert(
          Object.values(teamToPlayers).flat().map(({ player: playerUrl }) => {
            const parsedUrl = getParsedLink(playerUrl);
            return {
              url: parsedUrl.url,
              page_missing: parsedUrl.pageMissing,
            };
          })
        )
        .onConflict()
        .merge([ 'page_missing' ])
        .toString(),
    );

    const tournamentPlayerInserts = allTeams.flatMap(teamUrl => {
      const players = teamToPlayers[teamUrl];
      const position = teamToPosition[teamUrl];

      console.log(`positionToWinPercentage(${position}, ${allTeams.length}): ${positionToWinPercentage(position, allTeams.length)}`);

      return players.map(({ player, role }) => ({
        tournament_url: url,
        player_url: getParsedLink(player).url,
        team_url: getParsedLink(teamUrl).url,
        position: position,
        role,
        beat_percent: positionToWinPercentage(position, allTeams.length),
      }));
    });
    await dbConn.query(
      knex('tournament_players')
        .insert(tournamentPlayerInserts)
        .onConflict()
        .merge(['team_url', 'position', 'beat_percent', 'role'])
        .toString(),
    );

    await dbConn.query(
      knex('tournaments')
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
});
