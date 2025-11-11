const cheerio = require('cheerio');

const BLACKLISTED_TOURNAMENTS = [
  'all-star',
  'rift rivals',
];

exports.handler = async () => {
  const response = await fetch('https://liquipedia.net/leagueoflegends/S-Tier_Tournaments');
  const text = await response.text();

  const $ = cheerio.load(text);

  const timeNow = Date.now();
  const tournaments = [];
  $('div.gridTable.tournamentCard.Tierless.NoGameIcon').each((_, elTable) => {
    $(elTable).find('div.gridRow').each((_, elRow) => {
      const dateCell = $(elRow).find('div.Date').text().trim();
      let [startDateStr, endDateStr] = dateCell.split(' - ');
      if (!endDateStr) {
        endDateStr = startDateStr;
      }

      const [startDayMonth, startYear] = startDateStr.split(',').map(s => s.trim());
      const [endDayMonth, endYear] = endDateStr.split(',').map(s => s.trim());

      const startDayMonthParts = startDayMonth.split(' ');
      const endDayMonthParts = endDayMonth.split(' ');

      const startDay = startDayMonthParts.pop();
      const startMonth = startDayMonthParts.pop();

      const endDay = endDayMonthParts.pop();
      const endMonth = endDayMonthParts.pop();

      const startDate = { day: startDay, month: startMonth, year: startYear };
      const endDate = { day: endDay, month: endMonth, year: endYear };

      if (!startDate.year) {
        startDate.year = endDate.year;
      }
      if (!endDate.month) {
        endDate.month = startDate.month;
      }

      const endTimestamp = Date.parse(`${endDate.month} ${endDate.day}, ${endDate.year}`);
      if (endTimestamp > timeNow) return;

      const tournamentName = $(elRow).find('div.Tournament').text().trim();
      const tournamentLink = $(elRow).find('div.Tournament a').last().attr('href');

      const isBlacklisted = BLACKLISTED_TOURNAMENTS.some(blacklistedTerm =>
        tournamentName.toLowerCase().includes(blacklistedTerm)
      );
      if (isBlacklisted) return;

      tournaments.push({
        name: tournamentName,
        link: `https://liquipedia.net${tournamentLink}`,
      });
    });
  });

  console.log(tournaments);
};
