/* import { createConnection } from "promise-mysql";
import { config } from "dotenv";
config();

const connectionMySql = createConnection({
  host:process.env.host,
  database:process.env.MySQLConnection,
  user:process.env.user,
  password:process.env.password
})

const getConnectionMySql = async ()=> await connectionMySql;

export default {
  getConnectionMySql
} */