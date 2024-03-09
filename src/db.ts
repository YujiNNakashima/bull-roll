const { Pool } = require("pg");

const pool = new Pool({
  user: "youruser",
  host: "localhost",
  database: "yourdbname",
  password: "yourpassword",
  port: 5432,
});

export default pool;
