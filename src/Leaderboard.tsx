import { useEffect, useRef, useState } from 'react';
import './Leaderboard.css';
import { z } from "zod";
import Navbar from './Navbar';
import { 
  computeDuration, 
  formatTime, 
  refreshPage,
} from './base';

const VIEW_MODE_KEY = "view-mode";
const REFRESH_INTERVAL = 30;

const Challenge = z.object({
  slug: z.string(),
  submissions: z.number(),
  time_taken: z.number(),
})

const Contestant = z.object({
  challenges: z.array(Challenge),
  hacker: z.string(),
});

type Challenge = z.infer<typeof Challenge>;
type Contestant = z.infer<typeof Contestant>;

const Data = z.object({
  community: z.object({
    contests: z.object({
      allContest: z.object({
        contest: z.record(
          z.string(), 
          z.object({
            leaderboard_freeze_time: z.string().nullable().transform(
              (time) => time === null ? "0" : time
            ),
            epoch_endtime: z.number(),
          })
        )
      }),
      contestLeaderboard: z.object({
        didInvalidate: z.boolean()
      }).catchall(z.object({
        leaderboard: z.object({
          leaders: z.array(Contestant)
        })
      }))
    })
  })
});

interface TableProps {
  leaders: Contestant[];
  mode: ViewMode;
}

function Table({ leaders, mode }: TableProps) {
  if (leaders[0] === undefined) {
    return "No data!";
  }

  const slugs = leaders[0].challenges.map(item => item.slug);

  if (mode === "condensed") {
    const solvesPerProblem = slugs.map(slug =>
      leaders.reduce((count, leader) => {
        const solved = leader.challenges
          .filter(c => c.time_taken > 0)
          .map(c => c.slug);

        return count + (solved.includes(slug) ? 1 : 0);
      }, 0)
    );

    return (
      <table className="leaderboard">
        <thead>
          <tr>
            <th></th>
            {slugs.map(slug => (
              <th key={slug}>{slug}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr>
            <td># of solvers</td>
            {solvesPerProblem.map((count, i) => (
              <td
                key={slugs[i]}
                className={count > 0 ? "solved" : undefined}
              >
                {count}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="leaderboard">
      <thead>
        <tr>
          <th className="col-hacker">User</th>
          <th className="col-solved">Solved</th>

          {slugs.map((slug) => (
            <th key={slug} className="col-data">{slug}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {leaders.map((leader) => {
          const challenges = new Map(
            leader.challenges.map((c) => [c.slug, c])
          );

          const solved = leader.challenges.filter(
            (c) => c.time_taken > 0
          ).length;

          return (
            <tr key={leader.hacker}>
              <td className="col-hacker">{leader.hacker}</td>
              <td className="col-solved">{solved}</td>

              {slugs.map((slug) => {
                const challenge = challenges.get(slug);

                if (challenge === undefined) {
                  return <td key={slug} className="col-data">?</td>;
                }

                if (challenge.time_taken > 0) {
                  return (
                    <td key={slug} className="solved data">
                      ✓ {formatTime(challenge.time_taken)}{" "}
                      ({challenge.submissions})
                    </td>
                  );
                }

                if (challenge.submissions > 0) {
                  return (
                    <td key={slug} className="col-data">
                      ✗ ({challenge.submissions})
                    </td>
                  );
                }

                return <td key={slug} className="col-data">—</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

interface Times {
  endTime: number;
  freezeTime: number;
  fetchTime: number;
}

interface Durations {
  endDuration: number;
  freezeDuration: number;
  fetchDuration: number;
}

interface FetchedData {
  contestants: Contestant[]; 
  times: Times;
}

function extractInitialData(content: object): FetchedData {
  const parsedContent = Data.parse(content);
  const leaderboard = Object.values(
    parsedContent.community.contests.contestLeaderboard
  ).filter((item) => typeof item !== "boolean")[0];
  if (leaderboard === undefined) {
    throw new Error("cannot find leaderboard in JSON");
  }
  const contest = Object.values(parsedContent.community.contests.allContest.contest)[0];
  if (contest === undefined) {
    throw new Error("cannot find contest in JSON");
  }
  return {
    contestants: leaderboard.leaderboard.leaders,
    times: {
      freezeTime: new Date(contest.leaderboard_freeze_time).getTime(),
      endTime: contest.epoch_endtime * 1000,
      fetchTime: Date.now(),
    }
  };
}

const ViewMode = z.enum(["detailed", "condensed"]);
type ViewMode = z.infer<typeof ViewMode>;

function Leaderboard({ input }: { input: object }) {
  const [leaders, setLeaders] = useState<Contestant[]>([]);
  const [times, setTimes] = useState<Times | null>(null);
  const [durations, setDurations] = useState<Durations | null>(null);
  const [mode, setMode] = useState<ViewMode>(() => {
    const viewMode = localStorage.getItem(VIEW_MODE_KEY);
    return viewMode === null ? "detailed" : ViewMode.parse(viewMode);
  });
  const initialTime = useRef(Date.now());

  useEffect(() => {
    const data = extractInitialData(input);
    setLeaders(data.contestants);
    setTimes(data.times);
    setDurations({
      endDuration: computeDuration(data.times.endTime, 1),
      freezeDuration: computeDuration(data.times.freezeTime, 1),
      fetchDuration: computeDuration(data.times.fetchTime, -1),
    });
  }, [input]);

  const timerRef = useRef<null | number>(null);

  const stopTime = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
    }
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (times !== null) {
        setDurations({
          endDuration: computeDuration(times.endTime, 1),
          freezeDuration: computeDuration(times.freezeTime, 1),
          fetchDuration: computeDuration(times.fetchTime, -1),
        });
      } else {
        stopTime();
      }
    }, 1000);
    return stopTime;
  }, [times]);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    setTimeout(refreshPage, REFRESH_INTERVAL * 1000);
  }, []);

  return (
    <>
      <Navbar popLevel={1} />
      <div className="tamper-container">
        <h1>Leaderboard</h1>

        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginBottom: 20 
        }}>
          <div>
            <fieldset className="view-mode">
              <label>
                <input
                  type="radio"
                  name="view"
                  value="detailed"
                  checked={mode === "detailed"}
                  onChange={() => setMode("detailed")}
                />
                <span>Detailed</span>
              </label>

              <label>
                <input
                  type="radio"
                  name="view"
                  value="condensed"
                  checked={mode === "condensed"}
                  onChange={() => setMode("condensed")}
                />
                <span>Condensed</span>
              </label>
            </fieldset>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontVariantNumeric: "tabular-nums" }}>
            <div style={{ display: "flex", flexDirection: "column", marginRight: 20 }}>
              <span className="time-row">Time left (contest)</span>
              <span className="time-row">Time left (submission)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "end", fontWeight: "bold" }}>
              <span className="time-row">{durations === null ? "loading..." : formatTime(durations.freezeDuration)}</span>
              <span className="time-row">{durations === null ? "loading..." : formatTime(durations.endDuration)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Table leaders={leaders} mode={mode} />
        </div>

        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          This scoreboard will automatically refresh every {REFRESH_INTERVAL} seconds.
          Last refresh: {
            durations === null 
              ? computeDuration(initialTime.current, -1) 
              : durations.fetchDuration
          } seconds ago.
        </span>
      </div>
    </>
  );
}

export default Leaderboard;
