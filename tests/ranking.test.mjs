import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false } });
after(() => server.close());
const {
  applyTodayRanking, computeStats, computeTopPairs, computeRanks,
  getRankingConfig, filterByPeriod,
  computeTopSeeds,
} = await server.ssrLoadModule('/src/lib/ranking.js');
const { localISODate } = await server.ssrLoadModule('/src/lib/date.js');
const { default: Leaderboard } = await server.ssrLoadModule('/src/components/Leaderboard.jsx');
const { default: TopSeeds } = await server.ssrLoadModule('/src/components/TopSeeds.jsx');
const players = ['Visitor', 'Partner', 'Suresh Padaga', 'HR'];
const rankOptions = { qualifiedOnly: true, prioritizeRegular: false };
const games = (count, team1 = players.slice(0, 2), team2 = players.slice(2)) =>
  Array.from({ length: count }, (_, id) => ({
    id: String(id), date: localISODate(), team1, team2, score1: 21, score2: 15,
  }));
const todayStats = (matches) => applyTodayRanking(computeStats(matches, players, 3));

test('non-regular players are unranked at 3 matches and can lead at 4', () => {
  const three = todayStats(games(3));
  const ranks = computeRanks(three, rankOptions);
  const visitor = three.findIndex((row) => row.name === 'Visitor');
  assert.equal(three[visitor].qualified, false);
  assert.equal(ranks[visitor], null);
  assert.equal(three[0].isRegular, true);

  const four = todayStats(games(4));
  assert.equal(four[0].isRegular, false);
  assert.equal(four[0].qualified, true);
  assert.equal(computeRanks(four, rankOptions)[0], 1);
});

test('regular players need 3 matches, not 2', () => {
  assert.ok(todayStats(games(2)).every((row) => !row.qualified));
  assert.ok(todayStats(games(3)).filter((row) => row.isRegular).every((row) => row.qualified));
});

test('qualified regular and non-regular players share equal-score ranks', () => {
  const rows = todayStats(games(4, ['Visitor', 'Suresh Padaga'], ['Partner', 'HR']));
  assert.deepEqual(computeRanks(rows, rankOptions), [1, 1, 3, 3]);
});

test('doubles eligibility counts games together and requires 4 for a non-regular pair', () => {
  const three = applyTodayRanking(computeTopPairs(games(3), 3));
  assert.equal(three.find((row) => !row.isRegular).qualified, false);
  assert.equal(three.find((row) => row.isRegular).qualified, true);
  const four = applyTodayRanking(computeTopPairs(games(4), 3));
  assert.equal(four[0].isRegular, false);
  assert.equal(four[0].qualified, true);
  const mixed = applyTodayRanking(computeTopPairs(
    games(3, ['Visitor', 'Suresh Padaga'], ['Partner', 'HR']), 3,
  ));
  assert.ok(mixed.every((row) => !row.qualified));
});

test('Today has no regular priority; other period settings stay intact', () => {
  assert.equal(getRankingConfig('today').prioritizeRegular, false);
  assert.deepEqual(getRankingConfig('sunday'), { minMatches: 3, prioritizeRegular: false });
  for (const period of ['week', 'month', 'year', 'all']) {
    assert.deepEqual(getRankingConfig(period), { minMatches: 10, prioritizeRegular: true });
  }
});

test('Today leaderboard renders NA below the threshold', () => {
  const html = renderToStaticMarkup(React.createElement(Leaderboard, { matches: games(3), players }));
  assert.ok(html.includes('NA'));
  const qualified = renderToStaticMarkup(React.createElement(Leaderboard, { matches: games(4), players }));
  assert.ok(!qualified.includes('>NA<'));
  assert.ok(qualified.indexOf('Visitor') < qualified.indexOf('Suresh Padaga'));
});

test('Top Seeds shows winning pairs immediately without eligibility or regular priority', () => {
  const html = renderToStaticMarkup(React.createElement(TopSeeds, { matches: games(3), players }));
  assert.ok(html.includes('Visitor'));
  assert.ok(!html.includes('Provisional'));
  assert.ok(html.indexOf('Visitor') < html.indexOf('Suresh Padaga'));
  const qualified = renderToStaticMarkup(React.createElement(TopSeeds, { matches: games(4), players }));
  assert.ok(qualified.includes('Visitor'));
  assert.ok(qualified.indexOf('Visitor') < qualified.indexOf('Suresh Padaga'));
  const immediate = renderToStaticMarkup(React.createElement(TopSeeds, { matches: games(1), players }));
  assert.ok(immediate.includes('Visitor'));
  assert.ok(!immediate.includes('Provisional'));
  assert.ok(!immediate.includes('to qualify'));
  assert.ok(!/>\s*Wilson Score\s*</.test(immediate));
  assert.ok(!immediate.includes('No matches'));
});

test('Top Seeds orders both individuals and pairs by wins rather than Wilson score', () => {
  const matches = [
    ...games(5),
    ...games(5, players.slice(2), players.slice(0, 2)),
    ...games(4, ['Unbeaten One', 'Unbeaten Two'], ['Opponent One', 'Opponent Two']),
  ];
  for (const mode of ['singles', 'doubles']) {
    const rows = computeTopSeeds(matches, players, mode);
    const moreWins = rows.findIndex((row) => row.name === 'Visitor' || row.players?.includes('Visitor'));
    const unbeaten = rows.findIndex((row) => row.name === 'Unbeaten One' || row.players?.includes('Unbeaten One'));
    assert.ok(rows[unbeaten].score > rows[moreWins].score);
    assert.ok(moreWins < unbeaten);
    assert.equal(rows[0].wins, 5);
    assert.equal(computeTopSeeds(games(1), players, mode)[0].wins, 1);
  }
});

test('Top Seeds breaks equal wins by fewer losses, without regular priority', () => {
  const matches = [
    ...games(2),
    ...games(2, players.slice(2), ['Other One', 'Other Two']),
  ];
  for (const mode of ['singles', 'doubles']) {
    const rows = computeTopSeeds(matches, players, mode);
    assert.equal(rows[0].isRegular, false);
    assert.equal(rows[0].wins, 2);
    assert.equal(rows[0].losses, 0);
  }
});

test('Overall retains Sunday matches', () => {
  const sunday = { ...games(1)[0], date: '2026-11-01' };
  assert.equal(filterByPeriod([sunday], 'all').length, 1);
});

test('Top Seeds renders three carousel slides and manual navigation', () => {
  const matches = [...games(3), ...games(1, ['Third One', 'Third Two'], ['Fourth One', 'Fourth Two'])];
  const html = renderToStaticMarkup(React.createElement(TopSeeds, { matches, players }));
  assert.equal((html.match(/aria-roledescription="slide"/g) || []).length, 3);
  assert.ok(html.includes('Top Seed #3'));
  assert.ok(!html.includes('Next top seed'));
  assert.ok(html.includes('bottom-1'));
  assert.ok(html.includes('Pause automatic slides'));
  assert.ok(html.includes('Show top seed 3'));
  const empty = renderToStaticMarkup(React.createElement(TopSeeds, { matches: [], players }));
  assert.ok(!empty.includes('aria-roledescription="carousel"'));
});
