import Link from "next/link";
import { formatInteger } from "@/lib/format";
import type { GameRow } from "@/lib/manage-types";
import { LocalDate } from "./local-date";
import { ROW_LINK, ROW_LINK_DANGER, TD, TH } from "./ui";

export function GamesTable({ games, showStudio }: { games: GameRow[]; showStudio: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-ink-2">
            <th scope="col" className={TH}>Game</th>
            {showStudio && <th scope="col" className={TH}>Studio</th>}
            <th scope="col" className={TH}>stake.com id</th>
            <th scope="col" className={`${TH} text-right`}>Saves</th>
            <th scope="col" className={`${TH} text-right`}>Snapshots</th>
            <th scope="col" className={TH}>Last snapshot</th>
            <th scope="col" className={`${TH} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {games.map((game) => (
            <tr key={game.id} className="border-b border-hairline last:border-0 hover:bg-plate-sunk">
              <th scope="row" className={`${TD} text-left font-normal`}>
                <span className="block font-medium text-ink">{game.name}</span>
                <span className="block font-mono text-xs text-muted">{game.gameSlug}</span>
              </th>
              {showStudio && (
                <td className={TD}>
                  <Link href={`/games?studio=${game.studioId}`} className="text-ink-2 hover:text-ink">
                    {game.studio}
                  </Link>
                </td>
              )}
              <td className={`${TD} font-mono text-xs text-ink-2`}>
                {game.stakeId ?? <span className="font-sans text-sm text-muted">—</span>}
              </td>
              <td className={`${TD} text-right`}>
                {game.saves === null ? <span className="text-muted">—</span> : formatInteger(game.saves)}
              </td>
              <td className={`${TD} text-right text-ink-2`}>{formatInteger(game.snapshotCount)}</td>
              <td className={`${TD} text-ink-2`}>
                <LocalDate ms={game.lastSnapshotAt} />
              </td>
              <td className={`${TD} text-right whitespace-nowrap`}>
                <Link href={`/?game=${game.id}`} className={ROW_LINK}>
                  Stats
                </Link>
                <Link href={`/games/${game.id}/edit`} className={ROW_LINK}>
                  Edit
                </Link>
                <Link href={`/games/${game.id}/delete`} className={ROW_LINK_DANGER}>
                  Delete
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
