const cheerio = require('cheerio');
const knex = require('knex')({ client: 'mysql' });
const withDb = require('../shared/helpers/withDb');
const { SCRAPE_TIMEOUT } = require('../shared/constants');

exports.handler = withDb(async (dbConn) => {
  const [rows] = await dbConn.query(
    knex('players')
      .select('url')
      .where('page_missing', 0)
      .where('last_checked', '<', new Date(Date.now() - SCRAPE_TIMEOUT))
      .limit(5000)
      .toString(),
  );

  for (const { url } of rows) {
    await new Promise(res => setTimeout(res, 2_000));
    console.log('Scraping player:', url);

    const response = await fetch(url);
    const text = await response.text();
    const $ = cheerio.load(text);

    const redirUrl = $('link[rel="canonical"]').attr('href');
    if (redirUrl && redirUrl !== url) {
      await dbConn.query(
        knex('players')
          .insert({ url: redirUrl })
          .onConflict()
          .ignore()
          .toString(),
      );

      await dbConn.query(
        knex('players')
          .update({ linked_player: redirUrl, last_checked: new Date() })
          .where('url', url)
          .toString(),
      );

      continue;
    }

    const name = $('h1.firstHeading').text().trim();
    const iconPath = $('div.infobox-image img').first().attr('src');

    const fullDoBText = $('div.infobox-cell-2.infobox-description')
      .filter((_, el) => $(el).text().trim() === 'Born:')
      .next()
      .text()
      .trim();
    const parsedBirthDate = fullDoBText.match(/([a-z]+\s+\d+,\s+\d+)/i);
    let birthDate = null;
    if (parsedBirthDate) {
      birthDate = parsedBirthDate[0];
    }

    const nationalities = [];
    $('div.infobox-cell-2.infobox-description')
      .filter((_, el) => $(el).text().trim() === 'Nationality:')
      .next()
      .find('img')
      .each((_, img) => nationalities.push($(img).attr('alt').trim()));

    await dbConn.query(
      knex('players')
        .update({
          name,
          birth_date: birthDate ? new Date(birthDate) : null,
          icon_path: iconPath,
          nationalities: JSON.stringify(nationalities),
          last_checked: new Date(),
        })
        .where('url', url)
        .toString(),
    );
  }
});
