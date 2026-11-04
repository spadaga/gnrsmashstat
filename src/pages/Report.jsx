import { useState } from "react";
import Avatar from "../components/Avatar";
import { localISODate } from "../lib/date";
import {
  AlertTriangle,
  BarChart3,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  Clock,
  History,
  Search,
  ArrowLeftRight,
  Swords,
  Trophy,
  RotateCcw,
} from "lucide-react";
import YoutubeIcon from "../components/YoutubeIcon";
import {
  computeStats,
  computePairStats,
  computeDuoStats,
  computeHeadToHead,
  computeAbandonedMatches,
  applyPeriod,
  getRankingConfig,
  matchesForPlayer,
  matchesForPair,
  formatYoutubeUrl,
  sortPlayersByTier,
} from "../lib/ranking";
import ConfirmDialog from "../components/ConfirmDialog";

const TABS = [
  { key: "h2h", label: "Head-to-Head", shortLabel: "H2H" },
  { key: "duo", label: "Duo Head-to-Head", shortLabel: "Duo H2H" },
  { key: "combos", label: "Player Combos", shortLabel: "Combos" },
  { key: "individual", label: "Individual Rankings", shortLabel: "Individual" },
  { key: "pairs", label: "Pair Rankings", shortLabel: "Pairs" },
  { key: "updates", label: "Record Updates", shortLabel: "Updates" },
  { key: "abandoned", label: "Abandoned Matches", shortLabel: "Abandoned" },
  { key: "partyDue", label: "Party Dues", shortLabel: "Dues" },
];

const PERIODS = [
  { key: "today", label: "Today", shortLabel: "Day" },
  { key: "week", label: "Week", shortLabel: "Week" },
  { key: "month", label: "Month", shortLabel: "Month" },
  { key: "year", label: "Year", shortLabel: "Year" },
  { key: "custom", label: "Custom Range", shortLabel: "Custom" },
];

const selectCls =
  "border dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-orange-400 focus:outline-none";
const dateCls =
  "border dark:border-slate-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100";

export function Bar({ label, value, max, color = "bg-orange-600" }) {
  const pct = max > 0 && value > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 sm:w-36 shrink-0 text-xs text-slate-600 dark:text-slate-300 truncate">
        {label}
      </span>
      <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-bold text-slate-700 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}

function renderPlayerOptions(playerList) {
  const sorted = sortPlayersByTier(playerList || []);
  const active = sorted.filter((p) => typeof p === "string" || !p.inactive);
  const inactive = sorted.filter((p) => typeof p === "object" && p.inactive);
  return [
    ...active.map((p) => {
      const name = typeof p === "string" ? p : p.name;
      return (
        <option key={name} value={name}>
          {name}
        </option>
      );
    }),
    ...inactive.map((p) => {
      const name = typeof p === "string" ? p : p.name;
      return (
        <option key={name} value={name}>
          {name} (Inactive)
        </option>
      );
    }),
  ];
}

export function PeriodTabs({
  period,
  onPeriod,
  from,
  to,
  onFrom,
  onTo,
  periods = PERIODS,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => onPeriod(p.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition ${
              period === p.key
                ? "bg-slate-900 dark:bg-orange-600 text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <span className="sm:hidden">
              {p.shortLabel || p.short || p.label}
            </span>
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => onFrom(e.target.value)}
            className={dateCls}
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => onTo(e.target.value)}
            className={dateCls}
          />
        </div>
      )}
    </div>
  );
}

function StatTile({
  value,
  label,
  color = "text-orange-600",
  onClick,
  active,
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`text-center rounded-xl py-3 px-1.5 sm:px-2 transition w-full min-w-0 flex flex-col items-center justify-center ${
        active
          ? "bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-400"
          : "bg-slate-50 dark:bg-slate-700/50"
      } ${onClick ? "cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20" : ""}`}
    >
      <div
        className={`text-sm xs:text-base sm:text-xl md:text-2xl font-extrabold ${color} whitespace-nowrap flex items-center justify-center leading-tight`}
      >
        {value}
      </div>
      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap truncate max-w-full">
        {label}
      </p>
    </Tag>
  );
}

function MatchRow({ m }) {
  const team1Won = m.score1 > m.score2;
  return (
    <div className="px-3 py-2 rounded-lg border dark:border-slate-700 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-slate-400 w-16 shrink-0">{m.date}</span>
        <span
          className={`flex-1 text-right ${team1Won ? "font-bold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
        >
          {m.team1.join(" & ")}
        </span>
        <span className="font-bold shrink-0 bg-slate-50 dark:bg-slate-700 rounded px-1.5 py-0.5">
          <span
            className={
              team1Won
                ? "text-orange-600"
                : "text-slate-500 dark:text-slate-400"
            }
          >
            {m.score1}
          </span>
          -
          <span
            className={
              !team1Won
                ? "text-orange-600"
                : "text-slate-500 dark:text-slate-400"
            }
          >
            {m.score2}
          </span>
        </span>
        <span
          className={`flex-1 ${!team1Won ? "font-bold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
        >
          {m.team2.join(" & ")}
        </span>
        {m.youtubeUrl && (
          <a
            href={formatYoutubeUrl(m.youtubeUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-red-500 hover:text-red-600 transition p-0.5"
            title="Watch match video"
          >
            <YoutubeIcon size={14} />
          </a>
        )}
      </div>
      {m.comment && (
        <p className="text-slate-600 dark:text-slate-300 italic font-medium mt-1">
          "{m.comment}"
        </p>
      )}
    </div>
  );
}

function MatchResultsPanel({ title, matches }) {
  return (
    <div className="mt-4 border-t dark:border-slate-700 pt-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
        {title} ({matches.length})
      </h4>
      {matches.length === 0 ? (
        <p className="text-slate-400 text-sm">No matches.</p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {matches.map((m) => (
            <MatchRow key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}


function H2HPlayerSelect({ value, onChange, options, placeholder, inactives }) {
  const sorted = sortPlayersByTier(options, inactives);
  const activeOpts = sorted.filter(
    (p) => !inactives.has(String(typeof p === "string" ? p : p.name).toLowerCase()),
  );
  const inactiveOpts = sorted.filter((p) =>
    inactives.has(String(typeof p === "string" ? p : p.name).toLowerCase()),
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-orange-400 focus:outline-none cursor-pointer font-medium"
    >
      <option value="">{placeholder}</option>
      {activeOpts.map((p) => {
        const name = typeof p === "string" ? p : p.name;
        return (
          <option key={name} value={name}>
            {name}
          </option>
        );
      })}
      {inactiveOpts.map((p) => {
        const name = typeof p === "string" ? p : p.name;
        return (
          <option key={name} value={name}>
            {name} (Inactive)
          </option>
        );
      })}
    </select>
  );
}

function HeadToHeadSection({ matches, players, photoByName = {} }) {
  const playerNamesList = players.map((p) => (typeof p === "string" ? p : p.name));
  const inactives = new Set(
    players
      .filter((p) => typeof p === "object" && p.inactive)
      .map((p) => p.name.toLowerCase()),
  );

  const [period, setPeriod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [p1, setP1] = useState(playerNamesList[0] || "");
  const [p2, setP2] = useState(playerNamesList[1] || "");
  const [p3, setP3] = useState(playerNamesList[2] || "");
  const [p4, setP4] = useState(playerNamesList[3] || "");

  const filteredMatches = applyPeriod(matches, period, from, to);

  const teamA = [p1, p2].filter(Boolean);
  const teamB = [p3, p4].filter(Boolean);

  const chosen = [p1, p2, p3, p4].filter(Boolean);

  const optionsFor = (current) =>
    playerNamesList.filter((p) => p === current || !chosen.includes(p));

  function swapTeams() {
    const oldP1 = p1, oldP2 = p2;
    setP1(p3);
    setP2(p4);
    setP3(oldP1);
    setP4(oldP2);
  }

  function clearAll() {
    setP1("");
    setP2("");
    setP3("");
    setP4("");
  }

  const ready = teamA.length > 0 && teamB.length > 0;
  let directMatches = [];
  let winsA = 0;
  let winsB = 0;
  let pointsA = 0;
  let pointsB = 0;

  if (ready) {
    directMatches = filteredMatches.filter((m) => {
      const t1HasA = teamA.every((p) => m.team1.includes(p));
      const t2HasB = teamB.every((p) => m.team2.includes(p));
      if (t1HasA && t2HasB) return true;

      const t1HasB = teamB.every((p) => m.team1.includes(p));
      const t2HasA = teamA.every((p) => m.team2.includes(p));
      return t1HasB && t2HasA;
    });

    directMatches.forEach((m) => {
      const team1Won = m.score1 > m.score2;
      const t1HasA = teamA.every((p) => m.team1.includes(p));
      if (t1HasA) {
        pointsA += m.score1;
        pointsB += m.score2;
        if (team1Won) winsA++;
        else winsB++;
      } else {
        pointsA += m.score2;
        pointsB += m.score1;
        if (!team1Won) winsA++;
        else winsB++;
      }
    });
  }

  const played = directMatches.length;
  const labelA = teamA.length > 0 ? teamA.join(" & ") : "Team 1";
  const labelB = teamB.length > 0 ? teamB.join(" & ") : "Team 2";
  const winRateA = played > 0 ? Math.round((winsA / played) * 100) : 0;
  const winRateB = played > 0 ? Math.round((winsB / played) * 100) : 0;

  return (
    <div>
      <PeriodTabs
        period={period}
        onPeriod={setPeriod}
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        periods={UPDATE_PERIODS}
      />

      {/* P1-P2 vs P3-P4 Selector Card */}
      <div className="bg-slate-50 dark:bg-slate-700/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 mb-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-orange-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Head-to-Head Matchup Filter (P1 & P2 vs P3 & P4)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={swapTeams}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-600 hover:text-orange-600 dark:hover:text-orange-400 transition shadow-xs"
              title="Swap Team 1 and Team 2"
            >
              <ArrowLeftRight size={12} /> Swap
            </button>
            {chosen.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border dark:border-slate-600 transition shadow-xs"
              >
                <RotateCcw size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-center">
          {/* Team 1 (P1 & P2) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-orange-200 dark:border-orange-900/50 shadow-xs">
            <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                Team 1 ({labelA})
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {p1 && <Avatar name={p1} photo={photoByName[p1]} size="xs" />}
                <H2HPlayerSelect
                  value={p1}
                  onChange={setP1}
                  options={optionsFor(p1)}
                  placeholder="Player 1 (P1)"
                  inactives={inactives}
                />
              </div>
              <div className="flex items-center gap-2">
                {p2 && <Avatar name={p2} photo={photoByName[p2]} size="xs" />}
                <H2HPlayerSelect
                  value={p2}
                  onChange={setP2}
                  options={optionsFor(p2)}
                  placeholder="Player 2 (P2)"
                  inactives={inactives}
                />
              </div>
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex items-center justify-center py-1 md:py-0">
            <span className="w-8 h-8 rounded-full bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
              VS
            </span>
          </div>

          {/* Team 2 (P3 & P4) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Team 2 ({labelB})
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {p3 && <Avatar name={p3} photo={photoByName[p3]} size="xs" />}
                <H2HPlayerSelect
                  value={p3}
                  onChange={setP3}
                  options={optionsFor(p3)}
                  placeholder="Player 3 (P3)"
                  inactives={inactives}
                />
              </div>
              <div className="flex items-center gap-2">
                {p4 && <Avatar name={p4} photo={photoByName[p4]} size="xs" />}
                <H2HPlayerSelect
                  value={p4}
                  onChange={setP4}
                  options={optionsFor(p4)}
                  placeholder="Player 4 (P4)"
                  inactives={inactives}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!ready ? (
        <p className="text-slate-400 text-sm text-center py-6">
          Please select players for both Team 1 and Team 2 to view direct Head-to-Head statistics.
        </p>
      ) : (
        <>
          {/* Status / Outcome Banner */}
          <div className="mb-4 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-700 flex items-center justify-center gap-2 text-center">
            {played === 0 ? (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                No direct matches found between {labelA} and {labelB} in this period.
              </span>
            ) : winsA === winsB ? (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" />
                Series is tied {winsA}–{winsB} across {played} {played === 1 ? "match" : "matches"}.
              </span>
            ) : winsA > winsB ? (
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" />
                {labelA} leads {labelB} {winsA}–{winsB} ({winRateA}% win rate).
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" />
                {labelB} leads {labelA} {winsB}–{winsA} ({winRateB}% win rate).
              </span>
            )}
          </div>

          {/* Stat Tiles */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatTile
              value={
                <span className="whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                  {winsA}W {played > 0 && <span className="text-xs opacity-75 font-normal">({winRateA}%)</span>}
                </span>
              }
              label={`${labelA} Wins`}
            />
            <StatTile
              value={played}
              label="Total Head-to-Head"
              color="text-orange-600 dark:text-orange-400"
            />
            <StatTile
              value={
                <span className="whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                  {winsB}W {played > 0 && <span className="text-xs opacity-75 font-normal">({winRateB}%)</span>}
                </span>
              }
              label={`${labelB} Wins`}
            />
          </div>

          {played > 0 && (
            <div className="mb-5 space-y-2">
              <Bar label={labelA} value={winsA} max={Math.max(1, winsA, winsB)} color="bg-orange-600" />
              <Bar
                label={labelB}
                value={winsB}
                max={Math.max(1, winsA, winsB)}
                color="bg-slate-400 dark:bg-slate-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Total Points: {pointsA} pts ({played > 0 ? (pointsA / played).toFixed(1) : 0} avg)</span>
                <span>Total Points: {pointsB} pts ({played > 0 ? (pointsB / played).toFixed(1) : 0} avg)</span>
              </div>
            </div>
          )}

          {/* Direct Matches List */}
          <div className="border-t dark:border-slate-700 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Direct Matches ({played})
            </h4>
            {played === 0 ? (
              <p className="text-slate-400 text-sm">No matches found.</p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {directMatches.map((m) => (
                  <MatchRow key={m.id} m={m} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DuoSection({ matches, players }) {
  const pName = (p) => (typeof p === "string" ? p : p.name);
  const [a, setA] = useState(players[0] ? pName(players[0]) : "");
  const [b, setB] = useState(players[1] ? pName(players[1]) : "");
  const [selected, setSelected] = useState(null);
  const aOptions = players.filter((p) => pName(p) !== b);
  const bOptions = players.filter((p) => pName(p) !== a);
  const ready = a && b && a !== b;
  const s = ready ? computeDuoStats(matches, a, b) : null;
  const h2h = ready ? computeHeadToHead(matches, a, b) : null;
  const max = s
    ? Math.max(1, s.togetherWins, s.togetherLosses, s.aWithoutBWins)
    : 1;

  function pick(key, e) {
    e.target.blur();
    setSelected((cur) => (cur === key ? null : key));
  }
  function selectPlayer(setter, value) {
    setter(value);
    setSelected(null);
  }

  const panels =
    s && h2h
      ? {
          togetherWins: {
            title: `Wins — ${a} & ${b} together`,
            list: s.matches.togetherWins,
          },
          togetherLosses: {
            title: `Losses — ${a} & ${b} together`,
            list: s.matches.togetherLosses,
          },
          aWithoutBWins: {
            title: `${a}'s wins without ${b}`,
            list: s.matches.aWithoutBWins,
          },
          h2hA: {
            title: `${a} beat ${b} (any partner)`,
            list: h2h.matches.aWins,
          },
          h2hB: {
            title: `${b} beat ${a} (any partner)`,
            list: h2h.matches.bWins,
          },
        }
      : {};
  const activePanel = selected ? panels[selected] : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={a}
          onChange={(e) => selectPlayer(setA, e.target.value)}
          className={selectCls}
        >
          {renderPlayerOptions(aOptions)}
        </select>
        <span className="text-slate-400 text-xs">&</span>
        <select
          value={b}
          onChange={(e) => selectPlayer(setB, e.target.value)}
          className={selectCls}
        >
          {renderPlayerOptions(bOptions)}
        </select>
      </div>
      {!ready ? (
        <p className="text-slate-400 text-sm">Pick two different players.</p>
      ) : (
        <>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            As Teammates
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-2">
            <StatTile
              value={s.togetherWins}
              label={`Wins ${a} & ${b} together`}
              onClick={(e) => pick("togetherWins", e)}
              active={selected === "togetherWins"}
            />
            <StatTile
              value={s.togetherLosses}
              label={`Losses with ${b}`}
              color="text-slate-700 dark:text-slate-200"
              onClick={(e) => pick("togetherLosses", e)}
              active={selected === "togetherLosses"}
            />
            <StatTile
              value={s.aWithoutBWins}
              label={`${a}'s wins without ${b}`}
              onClick={(e) => pick("aWithoutBWins", e)}
              active={selected === "aWithoutBWins"}
            />
          </div>
          <div className="space-y-2 mb-5">
            <Bar label="Together — Wins" value={s.togetherWins} max={max} />
            <Bar
              label={`Losses w/ ${b}`}
              value={s.togetherLosses}
              max={max}
              color="bg-slate-400 dark:bg-slate-500"
            />
            <Bar
              label={`${a} w/o ${b} — Wins`}
              value={s.aWithoutBWins}
              max={max}
            />
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Head-to-Head — {a} vs {b} (any partner)
          </h3>
          {h2h.played === 0 ? (
            <p className="text-slate-400 text-sm">
              {a} and {b} haven't faced each other directly yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <StatTile
                  value={h2h.aWins}
                  label={`${a} wins vs ${b}`}
                  onClick={(e) => pick("h2hA", e)}
                  active={selected === "h2hA"}
                />
                <StatTile
                  value={h2h.bWins}
                  label={`${b} wins vs ${a}`}
                  onClick={(e) => pick("h2hB", e)}
                  active={selected === "h2hB"}
                />
              </div>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                {h2h.aWins === h2h.bWins
                  ? `Tied ${h2h.aWins}–${h2h.bWins} in direct matchups.`
                  : h2h.aWins > h2h.bWins
                    ? `${a} leads ${b} ${h2h.aWins}–${h2h.bWins} in direct matchups.`
                    : `${b} leads ${a} ${h2h.bWins}–${h2h.aWins} in direct matchups.`}
              </p>
            </>
          )}

          {activePanel && (
            <MatchResultsPanel
              title={activePanel.title}
              matches={activePanel.list}
            />
          )}
        </>
      )}
    </div>
  );
}

function CombosSection({ matches, players }) {
  const pName = (p) => (typeof p === "string" ? p : p.name);
  const [p, setP] = useState(players[0] ? pName(players[0]) : "");
  const [selected, setSelected] = useState(null);
  const pairs = computePairStats(matches).filter((x) => x.players.includes(p));
  const partnerOf = (pair) => pair.players.find((n) => n !== p);
  const overall = pairs.reduce(
    (acc, x) => ({
      played: acc.played + x.played,
      wins: acc.wins + x.wins,
      losses: acc.losses + x.losses,
    }),
    { played: 0, wins: 0, losses: 0 },
  );
  const max = Math.max(1, ...pairs.map((x) => x.played));

  function pick(key, e) {
    e.target.blur();
    setSelected((cur) => (cur === key ? null : key));
  }
  function selectPlayer(v) {
    setP(v);
    setSelected(null);
  }

  let panelTitle = null,
    panelMatches = [];
  if (selected === "total") {
    panelTitle = `All of ${p}'s matches`;
    panelMatches = matchesForPlayer(matches, p);
  } else if (selected?.startsWith("partner:")) {
    const partner = selected.slice("partner:".length);
    panelTitle = `${p} & ${partner} together`;
    panelMatches = matchesForPair(matches, [p, partner]);
  }

  return (
    <div>
      <select
        value={p}
        onChange={(e) => selectPlayer(e.target.value)}
        className={`${selectCls} mb-4`}
      >
        {renderPlayerOptions(players)}
      </select>
      {pairs.length === 0 ? (
        <p className="text-slate-400 text-sm">No matches for {p} yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatTile value={pairs.length} label="Combinations played" />
            <StatTile
              value={overall.played}
              label="Total matches"
              onClick={(e) => pick("total", e)}
              active={selected === "total"}
            />
            <StatTile
              value={
                <span className="whitespace-nowrap inline-flex items-center justify-center gap-0.5 sm:gap-1">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {overall.wins}W
                  </span>
                  <span className="text-slate-400 font-normal">–</span>
                  <span className="text-red-500 dark:text-red-400">
                    {overall.losses}L
                  </span>
                </span>
              }
              label="Overall record"
              onClick={(e) => pick("total", e)}
              active={selected === "total"}
            />
          </div>
          <div className="space-y-2 mb-5">
            {pairs.map((x) => (
              <Bar
                key={x.players.join("|")}
                label={`w/ ${partnerOf(x)}`}
                value={x.played}
                max={max}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            {pairs.map((x) => {
              const partner = partnerOf(x);
              const key = `partner:${partner}`;
              return (
                <button
                  key={x.players.join("|")}
                  type="button"
                  onClick={(e) => pick(key, e)}
                  className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg border transition ${
                    selected === key
                      ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                    w/ {partner}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {x.played} played ·{" "}
                    <span className="text-orange-600 font-bold">{x.wins}W</span>{" "}
                    – {x.losses}L · {x.winRate}%
                  </span>
                </button>
              );
            })}
          </div>
          {panelTitle && (
            <MatchResultsPanel title={panelTitle} matches={panelMatches} />
          )}
        </>
      )}
    </div>
  );
}

function IndividualSection({ matches, players }) {
  const [period, setPeriod] = useState("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = applyPeriod(matches, period, from, to);
  const { minMatches, prioritizeRegular } = getRankingConfig(period);
  const stats = computeStats(filtered, players, minMatches, prioritizeRegular)
    .filter((s) => s.played > 0)
    .slice(0, 10);
  const max = Math.max(1, ...stats.map((s) => s.wins));

  function pick(name, e) {
    e.target.blur();
    setSelected((cur) => (cur === name ? null : name));
  }
  function changePeriod(v) {
    setPeriod(v);
    setSelected(null);
  }

  return (
    <div>
      <PeriodTabs
        period={period}
        onPeriod={changePeriod}
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
      />
      {stats.length === 0 ? (
        <p className="text-slate-400 text-sm">No matches in this range.</p>
      ) : (
        <>
          <div className="space-y-2 mb-5">
            {stats.map((s) => (
              <Bar key={s.name} label={s.name} value={s.wins} max={max} />
            ))}
          </div>
          <div className="space-y-1.5">
            {stats.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={(e) => pick(s.name, e)}
                className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg border transition ${
                  selected === s.name
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800"
                }`}
              >
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {i + 1}. {s.name}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {s.played} played ·{" "}
                  <span className="text-orange-600 font-bold">{s.wins}W</span> –{" "}
                  {s.losses}L · {s.winRate}%
                </span>
              </button>
            ))}
          </div>
          {selected && (
            <MatchResultsPanel
              title={`${selected}'s matches`}
              matches={matchesForPlayer(filtered, selected)}
            />
          )}
        </>
      )}
    </div>
  );
}

function PairsSection({ matches }) {
  const [period, setPeriod] = useState("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = applyPeriod(matches, period, from, to);
  const pairs = computePairStats(filtered).slice(0, 10);
  const max = Math.max(1, ...pairs.map((p) => p.wins));

  function pick(key, e) {
    e.target.blur();
    setSelected((cur) => (cur === key ? null : key));
  }
  function changePeriod(v) {
    setPeriod(v);
    setSelected(null);
  }
  const selectedPair = selected
    ? pairs.find((p) => p.players.join("|") === selected)
    : null;

  return (
    <div>
      <PeriodTabs
        period={period}
        onPeriod={changePeriod}
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
      />
      {pairs.length === 0 ? (
        <p className="text-slate-400 text-sm">No matches in this range.</p>
      ) : (
        <>
          <div className="space-y-2 mb-5">
            {pairs.map((p) => (
              <Bar
                key={p.players.join("|")}
                label={p.players.join(" & ")}
                value={p.wins}
                max={max}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            {pairs.map((p, i) => {
              const key = p.players.join("|");
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => pick(key, e)}
                  className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg border transition ${
                    selected === key
                      ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800"
                  }`}
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {i + 1}. {p.players.join(" & ")}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {p.played} played ·{" "}
                    <span className="text-orange-600 font-bold">{p.wins}W</span>{" "}
                    – {p.losses}L · {p.winRate}%
                  </span>
                </button>
              );
            })}
          </div>
          {selectedPair && (
            <MatchResultsPanel
              title={`${selectedPair.players.join(" & ")} matches`}
              matches={matchesForPair(filtered, selectedPair.players)}
            />
          )}
        </>
      )}
    </div>
  );
}

function AbandonedSection({ matches }) {
  const abandoned = computeAbandonedMatches(matches);
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
        <AlertTriangle size={13} className="text-amber-500" />
        Matches where neither side reached 21 points (excluding 11-0 shutouts) — treated as abandoned
        (rain, injury, court time, etc).
      </p>
      {abandoned.length === 0 ? (
        <p className="text-slate-400 text-sm">No abandoned matches recorded.</p>
      ) : (
        <div className="space-y-2">
          {abandoned.map((m) => (
            <div
              key={m.id}
              className="px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0">
                  {m.date}
                </span>
                <span className="flex-1 text-right text-slate-700 dark:text-slate-200">
                  {m.team1.join(" & ")}
                </span>
                <span className="font-bold shrink-0 bg-white dark:bg-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200">
                  {m.score1}-{m.score2}
                </span>
                <span className="flex-1 text-slate-700 dark:text-slate-200">
                  {m.team2.join(" & ")}
                </span>
              </div>
              {m.comment && (
                <p className="text-slate-600 dark:text-slate-300 italic font-medium mt-1">
                  "{m.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function formatLogTime(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const UPDATE_PERIODS = [
  { key: "today", label: "Today", shortLabel: "Day" },
  { key: "week", label: "Week", shortLabel: "Week" },
  { key: "month", label: "Month", shortLabel: "Month" },
  { key: "year", label: "Year", shortLabel: "Year" },
  { key: "all", label: "All Time", shortLabel: "All" },
  { key: "custom", label: "Custom Range", shortLabel: "Custom" },
];

function RecordUpdatesSection({ matches = [], photoByName = {} }) {
  const [period, setPeriod] = useState("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateBasis, setDateBasis] = useState("action");
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [search, setSearch] = useState("");

  const filteredByDate = matches.filter((m) => {
    let dateStr;
    if (dateBasis === "action") {
      const ts = m.updatedAt || m.loggedAt;
      dateStr = ts ? localISODate(new Date(ts)) : m.date;
    } else {
      dateStr = m.date;
    }
    const now = new Date();
    const todayStr = localISODate(now);
    if (period === "all") return true;
    if (period === "today") return dateStr === todayStr;
    if (period === "custom") {
      return (!from || dateStr >= from) && (!to || dateStr <= to);
    }
    const d = new Date(`${dateStr}T00:00:00`);
    if (period === "year") return d.getFullYear() === now.getFullYear();
    if (period === "month")
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    if (period === "week") {
      const startOfWeekDate = new Date(now);
      startOfWeekDate.setDate(now.getDate() - now.getDay());
      startOfWeekDate.setHours(0, 0, 0, 0);
      return d >= startOfWeekDate;
    }
    return true;
  });

  const editorStats = new Map();
  for (const m of filteredByDate) {
    const editor = m.updatedBy || m.loggedBy || "Earlier records";
    if (!editorStats.has(editor)) {
      editorStats.set(editor, {
        name: editor,
        count: 0,
        logged: 0,
        edited: 0,
        matches: [],
      });
    }
    const entry = editorStats.get(editor);
    entry.count++;
    if (m.updatedBy && m.loggedBy && m.updatedBy !== m.loggedBy) {
      entry.edited++;
    } else {
      entry.logged++;
    }
    entry.matches.push(m);
  }

  const editorList = Array.from(editorStats.values()).sort(
    (a, b) => b.count - a.count,
  );
  const topEditor = editorList[0];

  const displayMatches = filteredByDate.filter((m) => {
    const editor = m.updatedBy || m.loggedBy || "Earlier records";
    if (selectedEditor && editor !== selectedEditor) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const inPlayers = [...m.team1, ...m.team2].some((p) =>
        p.toLowerCase().includes(q),
      );
      const inEditor = editor.toLowerCase().includes(q);
      const inComment = (m.comment || "").toLowerCase().includes(q);
      const inDate = (m.date || "").includes(q);
      return inPlayers || inEditor || inComment || inDate;
    }
    return true;
  });

  const sortedMatches = [...displayMatches].sort((a, b) => {
    const timeA = a.updatedAt || a.loggedAt || `${a.date}T00:00:00`;
    const timeB = b.updatedAt || b.loggedAt || `${b.date}T00:00:00`;
    return timeB.localeCompare(timeA);
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <PeriodTabs
          period={period}
          onPeriod={(p) => {
            setPeriod(p);
            setSelectedEditor(null);
          }}
          from={from}
          to={to}
          onFrom={setFrom}
          onTo={setTo}
          periods={UPDATE_PERIODS}
        />

        <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-700/60 p-1 rounded-lg">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1.5">
            Filter by:
          </span>
          <button
            type="button"
            onClick={() => setDateBasis("action")}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              dateBasis === "action"
                ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Update/Log Date
          </button>
          <button
            type="button"
            onClick={() => setDateBasis("match")}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              dateBasis === "match"
                ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Match Date
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatTile
          value={filteredByDate.length}
          label="Total records"
          onClick={() => setSelectedEditor(null)}
          active={selectedEditor === null}
        />
        <StatTile
          value={editorList.length}
          label="Active updaters"
          color="text-emerald-600 dark:text-emerald-400"
        />
        <StatTile
          value={
            topEditor ? (
              <span className="truncate max-w-[9rem] block text-xs sm:text-sm md:text-base font-bold text-orange-600 dark:text-orange-400">
                {topEditor.name} ({topEditor.count})
              </span>
            ) : (
              "None"
            )
          }
          label="Top updater"
          onClick={() => topEditor && setSelectedEditor(topEditor.name)}
          active={topEditor && selectedEditor === topEditor.name}
        />
      </div>

      {filteredByDate.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">
          No records found in this date range.
        </p>
      ) : (
        <>
          {editorList.length > 0 && (
            <div className="mb-5 bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Who Updated The Records
                </span>
                {selectedEditor && (
                  <button
                    type="button"
                    onClick={() => setSelectedEditor(null)}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
                  >
                    Show all ({filteredByDate.length})
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {editorList.map((e) => {
                  const isSelected = selectedEditor === e.name;
                  const isRealPlayer = e.name !== "Earlier records";
                  return (
                    <button
                      key={e.name}
                      type="button"
                      onClick={() =>
                        setSelectedEditor(isSelected ? null : e.name)
                      }
                      className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg border transition ${
                        isSelected
                          ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-800 bg-white dark:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isRealPlayer ? (
                          <Avatar
                            name={e.name}
                            photo={photoByName[e.name]}
                            size="xs"
                          />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-500">
                            ?
                          </span>
                        )}
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {e.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {e.logged > 0 && <span>{e.logged} logged</span>}
                          {e.logged > 0 && e.edited > 0 && <span> · </span>}
                          {e.edited > 0 && <span>{e.edited} edited</span>}
                        </span>
                        <span className="font-bold text-orange-600 dark:text-orange-400 text-xs w-8 text-right">
                          {e.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <History size={13} className="text-orange-600" />
                {selectedEditor ? `${selectedEditor}'s Updates` : "Updated Records"}{" "}
                ({sortedMatches.length})
              </h4>
              <div className="relative w-full sm:w-64">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search player, editor, comment…"
                  className={`${dateCls} w-full pl-7 py-1`}
                />
              </div>
            </div>

            {sortedMatches.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">
                No matching records found.
              </p>
            ) : (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {sortedMatches.map((m) => {
                  const team1Won = m.score1 > m.score2;
                  const logTime = formatLogTime(m.updatedAt || m.loggedAt);
                  const editorName = m.updatedBy || m.loggedBy;
                  const isEdit = m.updatedBy && m.loggedBy && m.updatedBy !== m.loggedBy;

                  return (
                    <div
                      key={m.id}
                      className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-xs text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {editorName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/50">
                              <Avatar
                                name={editorName}
                                photo={photoByName[editorName]}
                                size="xs"
                                className="!w-3.5 !h-3.5 !text-[7px]"
                              />
                              {isEdit ? `Updated by ${m.updatedBy}` : `Logged by ${editorName}`}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              Earlier Record
                            </span>
                          )}
                          {isEdit && m.loggedBy && (
                            <span className="text-[10px] text-slate-400">
                              (logged by {m.loggedBy})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                          {logTime && (
                            <span title="Update / Log timestamp" className="flex items-center gap-1">
                              <Clock size={11} /> {logTime}
                            </span>
                          )}
                          <span>· Match: {m.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span
                          className={`flex-1 text-right truncate ${
                            team1Won
                              ? "font-bold text-slate-800 dark:text-slate-100"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {m.team1.join(" & ")}
                        </span>
                        <span className="font-bold shrink-0 bg-slate-100 dark:bg-slate-700 rounded px-2 py-0.5 text-xs">
                          <span
                            className={
                              team1Won
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-slate-500 dark:text-slate-400"
                            }
                          >
                            {m.score1}
                          </span>
                          {" - "}
                          <span
                            className={
                              !team1Won
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-slate-500 dark:text-slate-400"
                            }
                          >
                            {m.score2}
                          </span>
                        </span>
                        <span
                          className={`flex-1 truncate ${
                            !team1Won
                              ? "font-bold text-slate-800 dark:text-slate-100"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {m.team2.join(" & ")}
                        </span>
                        {m.youtubeUrl && (
                          <a
                            href={formatYoutubeUrl(m.youtubeUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-red-500 hover:text-red-600 transition p-0.5"
                            title="Watch match video"
                          >
                            <YoutubeIcon size={14} />
                          </a>
                        )}
                      </div>

                      {m.comment && (
                        <p className="text-slate-600 dark:text-slate-300 italic text-[11px] mt-0.5">
                          "{m.comment}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DueEditForm({ due, onSave, onCancel }) {
  const [count, setCount] = useState(String(due.count));
  const [comment, setComment] = useState(due.comment || "");
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <input
        type="number"
        min={0}
        value={count}
        onChange={(e) => setCount(e.target.value)}
        className={`${dateCls} w-20`}
      />
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comment"
        className={`${dateCls} flex-1 min-w-[8rem]`}
      />
      <button
        onClick={() => onSave({ count: Number(count) || 0, comment })}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition"
      >
        <Save size={12} /> Save
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
      >
        <X size={12} /> Cancel
      </button>
    </div>
  );
}

function PartyDueSection({
  dues,
  players,
  canModify,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [form, setForm] = useState({
    name: players[0] || "",
    count: "",
    comment: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  function handleAdd(e) {
    e.preventDefault();
    if (!form.name) return;
    onAdd({
      name: form.name,
      count: Number(form.count) || 0,
      comment: form.comment.trim(),
    });
    setForm({
      name: players[0]
        ? typeof players[0] === "string"
          ? players[0]
          : players[0].name
        : "",
      count: "",
      comment: "",
    });
  }

  return (
    <div>
      {canModify && (
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-4">
          <select
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={selectCls}
          >
            {renderPlayerOptions(players)}
          </select>
          <input
            type="number"
            min={0}
            value={form.count}
            onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))}
            placeholder="Count"
            className={`${dateCls} w-24`}
          />
          <input
            type="text"
            value={form.comment}
            onChange={(e) =>
              setForm((f) => ({ ...f, comment: e.target.value }))
            }
            placeholder="Comment (optional)"
            className={`${dateCls} flex-1 min-w-[10rem]`}
          />
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700">
            <Plus size={15} /> Add
          </button>
        </form>
      )}
      {dues.length === 0 ? (
        <p className="text-slate-400 text-sm">No party dues recorded.</p>
      ) : (
        <div className="space-y-1.5">
          {dues.map((d) => (
            <div
              key={d.id}
              className="px-3 py-2 rounded-lg border dark:border-slate-700 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {d.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-bold">{d.count}</span>
                  {canModify && editingId !== d.id && (
                    <>
                      <button
                        onClick={() => setEditingId(d.id)}
                        className="p-1 rounded text-slate-300 hover:text-orange-500"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirm(d)}
                        className="p-1 rounded text-slate-300 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {d.comment && editingId !== d.id && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                  {d.comment}
                </p>
              )}
              {editingId === d.id && (
                <DueEditForm
                  due={d}
                  onCancel={() => setEditingId(null)}
                  onSave={(updates) => {
                    setEditingId(null);
                    onUpdate(d.id, updates);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!confirm}
        title="Delete this due?"
        message={
          confirm ? `The due entry for "${confirm.name}" will be removed.` : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          onDelete(confirm.id);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

export default function Report({ data, actions, isSuperAdmin, photoByName = {} }) {
  const [tab, setTab] = useState("duo");
  const players = data.players;
  const matches = data.matches;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-4">
        <BarChart3 size={16} className="text-orange-600" /> Reports
      </h2>
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition ${
              tab === t.key
                ? "bg-slate-900 dark:bg-orange-600 text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <span className="sm:hidden">{t.shortLabel || t.label}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
      {tab === "partyDue" ? (
        <PartyDueSection
          players={players}
          canModify={isSuperAdmin}
          onAdd={actions?.addDue}
          onUpdate={actions?.updateDue}
          onDelete={actions?.deleteDue}
        />
      ) : (
        <>
          {tab === "h2h" && (
            <HeadToHeadSection
              matches={matches}
              players={players}
              photoByName={photoByName}
            />
          )}
          {tab === "duo" && <DuoSection matches={matches} players={players} />}
          {tab === "combos" && (
            <CombosSection matches={matches} players={players} />
          )}
          {tab === "individual" && (
            <IndividualSection matches={matches} players={players} />
          )}
          {tab === "pairs" && <PairsSection matches={matches} />}
          {tab === "updates" && (
            <RecordUpdatesSection
              matches={matches}
              photoByName={photoByName}
            />
          )}
          {tab === "abandoned" && <AbandonedSection matches={matches} />}
        </>
      )}
    </div>
  );
}
