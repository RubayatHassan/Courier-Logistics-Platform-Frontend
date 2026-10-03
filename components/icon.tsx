"use client";

const paths: Record<string, string> = {
  box: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z|m3.3 7 8.7 5 8.7-5|M12 22V12|m7.5 4.2 9 5.2",
  search: "m21 21-4.34-4.34|M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  arrow: "M7 17 17 7|M7 7h10v10",
  arrowRight: "M5 12h14|m12 5 7 7-7 7",
  plus: "M12 5v14|M5 12h14",
  package: "M16.5 9.4 7.55 4.24|M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z|M3.3 7 12 12l8.7-5|M12 22V12",
  truck: "M10 17h4V5H2v12h3|M20 17h2v-6l-3-4h-5|m14 17-9 0|M14 9h5l3 4|a2 2 0 1 0 4 0 2 2 0 1 0-4 0|a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M20 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75",
  wallet: "M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h14a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6|M20 12h-4a2 2 0 1 0 0 4h4",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20|M12 6v6l4 2",
  check: "m5 12 4 4L19 6",
  close: "M18 6 6 18|m6-12 12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
  pin: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z|M12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|m16 17 5-5-5-5|M21 12H9",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9|M10 21h4",
  spark: "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z|m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z",
};

export function Icon({ name, size = 19, className = "" }: { name: keyof typeof paths | string; size?: number; className?: string }) {
  const lines = paths[name]?.split("|");
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{lines?.map((d, i) => <path d={d} key={`${name}-${i}`} />)}</svg>;
}
