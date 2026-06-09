import type { TurnResult } from '../types/card';

interface TurnResultsTableProps {
  turnResults: TurnResult[];
}

export function TurnResultsTable({ turnResults }: TurnResultsTableProps) {
  return (
    <div className="table-scroll">
      <table className="results-table">
        <thead>
          <tr>
            <th>Turn</th>
            <th>Points this turn</th>
            <th>Cumulative</th>
            <th>Not started</th>
            <th>In progress</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {turnResults.map((row) => (
            <tr key={row.turn}>
              <td>{row.turn}</td>
              <td
                className={
                  row.pointsThisTurn < 0
                    ? 'negative'
                    : row.pointsThisTurn > 0
                      ? 'positive'
                      : undefined
                }
              >
                {row.pointsThisTurn > 0 ? `+${row.pointsThisTurn}` : row.pointsThisTurn}
              </td>
              <td>{row.cumulativePoints}</td>
              <td>{row.notStarted}</td>
              <td>{row.inProgress}</td>
              <td>{row.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ScoreBreakdownTableProps {
  turnResults: TurnResult[];
}

export function ScoreBreakdownTable({ turnResults }: ScoreBreakdownTableProps) {
  return (
    <div className="table-scroll">
      <table className="results-table">
        <thead>
          <tr>
            <th>Turn</th>
            <th>Completion</th>
            <th>Recurring</th>
            <th>Penalties</th>
            <th>In progress value</th>
          </tr>
        </thead>
        <tbody>
          {turnResults.map((row) => (
            <tr key={row.turn}>
              <td>{row.turn}</td>
              <td className={row.completionPoints > 0 ? 'positive' : undefined}>
                {row.completionPoints > 0 ? `+${row.completionPoints}` : row.completionPoints}
              </td>
              <td className={row.recurringPoints > 0 ? 'positive' : undefined}>
                {row.recurringPoints > 0 ? `+${row.recurringPoints}` : row.recurringPoints}
              </td>
              <td className={row.penaltyPoints < 0 ? 'negative' : undefined}>
                {row.penaltyPoints}
              </td>
              <td>{row.inProgressValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
