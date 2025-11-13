const cheerio = require('cheerio');
const knex = require('knex')({ client: 'mysql' });
const { SCRAPE_TIMEOUT } = require('../shared/constants');
const withDb = require('../shared/helpers/withDb');

exports.handler = withDb(async (dbConn) => {
  const [rows] = await dbConn.query(
    knex('tournament_series')
      .select('url')
      .where('last_checked', '<', new Date(Date.now() - SCRAPE_TIMEOUT))
      .limit(10)
      .toString(),
  );

  for (const { url } of rows) {
    console.log('Scraping tournament series', url);

    const response = await fetch(url);
    const text = await response.text();

    if (text.includes('There is currently no text in this page')) {
      await dbConn.query(
        knex('tournament_series')
          .update({ last_checked: new Date() })
          .where('url', url)
          .toString(),
      );

      continue;
    }

    const $ = cheerio.load(text);
    const iconPath = $('div.infobox-image img').first().attr('src');

    await dbConn.query(
      knex('tournament_series')
        .update({ big_icon_path: iconPath, last_checked: new Date() })
        .where('url', url)
        .toString(),
    );
  }
});
