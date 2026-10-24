'use client';

import { useEffect, useState } from 'react';
import { fallback, type Described, type Slot } from '@/lib/a11y/describe';

/** A generated table with a checked one-line summary in its caption. */
export function SlotTable({ rows }: { rows: Slot[] }) {
  const [d, setD] = useState<Described>({ text: fallback({ kind: 'table', rows }), verified: false });

  useEffect(() => {
    let live = true;
    fetch('/api/describe', { method: 'POST', body: JSON.stringify({ kind: 'table', rows }) })
      .then((r) => r.json())
      .then((x: Described) => live && setD(x))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [rows]);

  return (
    <table className="slots">
      <caption>{d.text}</caption>
      <thead>
        <tr>
          <th scope="col">Day</th>
          <th scope="col">Time</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.day + r.time} className={r.free ? 'free' : undefined}>
            <td>{r.day}</td>
            <td>{r.time}</td>
            <td>{r.free ? 'Free' : 'Busy'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
