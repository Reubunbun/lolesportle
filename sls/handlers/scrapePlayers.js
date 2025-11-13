const cheerio = require('cheerio');
const knex = require('knex')({ client: 'mysql' });
const withDb = require('../shared/helpers/withDb');
const { SCRAPE_TIMEOUT } = require('../shared/constants');

const BLACKLIST_ROLES = [
  'Coach',
];

exports.handler = withDb(async (dbConn) => {
  const [rows] = await dbConn.query(
    knex('players')
      .select('url')
      .where('page_missing', 0)
      .where('last_checked', '<', new Date(Date.now() - SCRAPE_TIMEOUT))
      .limit(10)
      .toString(),
  );

  for (const { url } of rows) {
    console.log('Scraping player:', url);

    const response = await fetch(url);
    const text = await response.text();
    const $ = cheerio.load(text);

    const name = $('h1.firstHeading').text().trim();
    const iconPath = $('div.infobox-image img').first().attr('src');

    const fullDoBText = $('div.infobox-cell-2.infobox-description')
      .filter((_, el) => $(el).text().trim() === 'Born:')
      .next()
      .text()
      .trim();
    const birthDate = fullDoBText.split(' (').shift();
    console.log({ birthDate });

    await dbConn.query(
      knex('players')
        .update({
          name,
          birth_date: birthDate ? new Date(birthDate) : null,
          icon_path: iconPath,
          last_checked: new Date(),
        })
        .where('url', url)
        .toString(),
    );
  }
});
