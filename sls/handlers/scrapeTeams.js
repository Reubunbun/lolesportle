const cheerio = require('cheerio');
const knex = require('knex')({ client: 'mysql' });
const { SCRAPE_TIMEOUT } = require('../shared/constants');
const withDb = require('../shared/helpers/withDb');

exports.handler = withDb(async (dbConn) => {
  const [rows] = await dbConn.query(
    knex('teams')
      .select('url')
      .where('page_missing', 0)
      .where('last_checked', '<', new Date(Date.now() - SCRAPE_TIMEOUT))
      .limit(10)
      .toString(),
  );

  for (const { url } of rows) {
    console.log('Scraping team:', url);
    const response = await fetch(url);
    const text = await response.text();
    const $ = cheerio.load(text);

    const redirUrl = $('link[rel="canonical"]').attr('href');
    if (redirUrl && redirUrl !== url) {
      await dbConn.query(
        knex('teams')
          .insert({ url: redirUrl })
          .onConflict()
          .ignore()
          .toString(),
      );

      await dbConn.query(
        knex('teams')
          .update({ linked_team: redirUrl, last_checked: new Date() })
          .where('url', url)
          .toString(),
      );

      continue;
    }

    const name = $('h1.firstHeading').text().trim();
    const iconPath = $('div.infobox-image img').first().attr('src');

    await dbConn.query(
      knex('teams')
        .update({
          name,
          icon_path: iconPath,
          last_checked: new Date(),
        })
        .where('url', url)
        .toString(),
    );
  }
});
