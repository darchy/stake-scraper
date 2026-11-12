import Link from "next/link";
import { formatInteger } from "@/lib/format";
import type { StudioRow } from "@/lib/manage-types";
import { LocalDate } from "./local-date";
import { ROW_LINK, ROW_LINK_DANGER, TD, TH } from "./ui";

export function StudiosTable({ studios }: { studios: StudioRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-ink-2">
            <th scope="col" className={TH}>Studio</th>
            <th scope="col" className={`${TH} text-right`}>Followers</th>
            <th scope="col" className={`${TH} text-right`}>Games</th>
            <th scope="col" className={`${TH} text-right`}>Snapshots</th>
            <th scope="col" className={TH}>Added</th>
            <th scope="col" className={`${TH} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {studios.map((studio) => (
            <tr key={studio.id} className="border-b border-hairline last:border-0 hover:bg-plate-sunk">
              <th scope="row" className={`${TD} text-left font-medium text-ink`}>
                {studio.name}
              </th>
              <td className={`${TD} text-right`}>
                {studio.followers === null ? <span className="text-muted">—</span> : formatInteger(studio.followers)}
              </td>
              <td className={`${TD} text-right`}>
                <Link
                  href={`/games?studio=${studio.id}`}
                  className="font-medium text-data underline-offset-4 hover:underline"
                  aria-label={`${studio.gameCount} games by ${studio.name}`}
                >
                  {formatInteger(studio.gameCount)}
                </Link>
              </td>
              <td className={`${TD} text-right text-ink-2`}>{formatInteger(studio.snapshotCount)}</td>
              <td className={`${TD} text-ink-2`}>
                <LocalDate ms={studio.createdAt} />
              </td>
              <td className={`${TD} text-right whitespace-nowrap`}>
                <Link href={`/games/new?studio=${studio.id}`} className={ROW_LINK}>
                  Add game
                </Link>
                <Link href={`/studios/${studio.id}/edit`} className={ROW_LINK}>
                  Edit
                </Link>
                <Link href={`/studios/${studio.id}/delete`} className={ROW_LINK_DANGER}>
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
