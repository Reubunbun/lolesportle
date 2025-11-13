const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const knex = require('knex')({ client: 'mysql' });
const { SCRAPE_TIMEOUT } = require('../shared/constants');

async function scrapeTeams(dbConn) {
    const [rows] = await dbConn.query(
        knex('esportle.teams')
            .select('url')
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
              knex('esportle.teams')
                .insert({ url: redirUrl })
                .onConflict()
                .ignore()
                .toString(),
            );

            await dbConn.query(
              knex('esportle.teams')
                .update({ linked_team: redirUrl, last_checked: new Date() })
                .where('url', url)
                .toString(),
            );

            continue;
        }

        const name = $('h1.firstHeading').text().trim();
        const iconPath = $('div.infobox-image img').first().attr('src');

        await dbConn.query(
            knex('esportle.teams')
                .update({
                    name,
                    icon_path: iconPath,
                    last_checked: new Date(),
                })
                .where('url', url)
                .toString(),
        );
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
    await scrapeTeams(dbConn);
  } catch (e) {
    console.error(e);
  } finally {
    await dbConn.end();
  }
};
