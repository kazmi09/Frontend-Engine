import mysql from "mysql2/promise";

// Parse the DATABASE_URL
// Format: mysql+mysqlconnector://user:password@host/database
function parseDatabaseUrl(url: string) {
  const match = url.match(/mysql\+mysqlconnector:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/);
  if (!match) {
    throw new Error("Invalid DATABASE_URL format. Expected: mysql+mysqlconnector://user:password@host/database");
  }
  
  return {
    user: match[1],
    password: decodeURIComponent(match[2]), // Decode URL encoding (%40 = @)
    host: match[3],
    database: match[4],
  };
}

let pool: mysql.Pool | null = null;

export function getMySQLPool(): mysql.Pool {
  if (pool) {
    return pool;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Please set it to: mysql+mysqlconnector://root:DesiDrop%40123@localhost/desi_drop_beta"
    );
  }

  let config;
  try {
    config = parseDatabaseUrl(process.env.DATABASE_URL);
    console.log(`[MySQL] Connecting to database: ${config.database} on ${config.host} as ${config.user}`);
  } catch (error: any) {
    console.error("[MySQL] Error parsing DATABASE_URL:", error.message);
    throw error;
  }

  try {
    pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
    
    // Test the connection
    pool.getConnection()
      .then(async (conn) => {
        console.log("[MySQL] Connection pool created successfully");
        conn.release();
      })
      .catch((err) => {
        console.error("[MySQL] Failed to create connection pool:", err.message);
        console.error("[MySQL] Error code:", err.code);
        pool = null; // Reset pool on error
      });

    return pool;
  } catch (error: any) {
    console.error("[MySQL] Error creating connection pool:", error.message);
    throw error;
  }
}

export async function queryMySQL<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const pool = getMySQLPool();
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sql, params || []);
      return rows as T[];
    } finally {
      connection.release();
    }
  } catch (error: any) {
    // Log detailed error information
    console.error("[MySQL] Query error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });
    
    // Re-throw with more context
    const errorMessage = error.sqlMessage || error.message || 'Unknown MySQL error';
    const errorCode = error.code || 'UNKNOWN';
    throw new Error(`MySQL ${errorCode}: ${errorMessage}`);
  }
}

