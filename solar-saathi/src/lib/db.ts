// Server only: the Clans Machina MySQL database, the same one the website's
// PHP uses (Clans/db.php), with the same settings:
//   MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE
// None set (local XAMPP): localhost:3306, root, empty password, clansmachina.

import mysql, { type Pool } from "mysql2/promise";

// One pool per server process (kept across dev hot reloads).
const g = globalThis as unknown as { saathiDb?: Pool };

export function db(): Pool {
  g.saathiDb ??= mysql.createPool({
    host: process.env.MYSQLHOST || "localhost",
    port: Number(process.env.MYSQLPORT) || 3306,
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASSWORD ?? "",
    database: process.env.MYSQLDATABASE || "clansmachina",
    charset: "utf8mb4",
    dateStrings: true, // DATE/DATETIME as written ("2026-10-12"), no timezone shift
    connectionLimit: 3,
    connectTimeout: 5000,
  });
  return g.saathiDb;
}
