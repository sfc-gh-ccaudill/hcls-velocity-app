import snowflake from "snowflake-sdk";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

snowflake.configure({ logLevel: "ERROR" });

let connection: snowflake.Connection | null = null;
let cachedToken: string | null = null;

function getOAuthToken(): string | null {
  if (process.env.SNOWFLAKE_TOKEN) {
    return process.env.SNOWFLAKE_TOKEN.trim();
  }
  if (process.env.SNOWFLAKE_PASSWORD) {
    return null;
  }
  const tokenPath = "/snowflake/session/token";
  try {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, "utf8").trim();
    }
  } catch {
  }
  return null;
}

function parseTomlConnection(connectionName: string): Record<string, string> | null {
  const homeDir = process.env.HOME || "";
  const paths = [
    path.join(homeDir, ".snowflake", "connections.toml"),
    path.join(homeDir, ".snowflake", "config.toml"),
  ];

  for (const tomlPath of paths) {
    try {
      if (!fs.existsSync(tomlPath)) continue;
      const content = fs.readFileSync(tomlPath, "utf8");
      const lines = content.split("\n");
      let inSection = false;
      const config: Record<string, string> = {};
      const sectionNames = [
        connectionName.toLowerCase(),
        `connections.${connectionName}`.toLowerCase(),
      ];

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          const section = trimmed.slice(1, -1).toLowerCase();
          inSection = sectionNames.includes(section);
          continue;
        }
        if (inSection && trimmed && !trimmed.startsWith("#")) {
          const eqIndex = trimmed.indexOf("=");
          if (eqIndex > 0) {
            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            config[key] = value;
          }
        }
      }
      if (Object.keys(config).length > 0) return config;
    } catch {
      continue;
    }
  }
  return null;
}

function getConfig(): snowflake.ConnectionOptions {
  const connectionName = process.env.SNOWFLAKE_CONNECTION_NAME;
  
  if (connectionName) {
    const tomlConfig = parseTomlConnection(connectionName);
    if (tomlConfig) {
      const config: Record<string, unknown> = {
        account: tomlConfig.account || tomlConfig.accountname,
        username: tomlConfig.user || tomlConfig.username,
        warehouse: tomlConfig.warehouse,
        database: process.env.SNOWFLAKE_DATABASE || "TEMP",
        schema: process.env.SNOWFLAKE_SCHEMA || "VELOCITY_AI",
        role: tomlConfig.role,
      };

      if (tomlConfig.authenticator?.toUpperCase() === "SNOWFLAKE_JWT" && tomlConfig.private_key_file) {
        let keyPath = tomlConfig.private_key_file;
        if (keyPath.startsWith("~")) {
          keyPath = path.join(process.env.HOME || "", keyPath.slice(1));
        }
        config.authenticator = "SNOWFLAKE_JWT";
        config.privateKey = fs.readFileSync(keyPath, "utf8");
      } else if (tomlConfig.authenticator?.toUpperCase() === "EXTERNALBROWSER") {
        config.authenticator = "EXTERNALBROWSER";
      } else if (tomlConfig.authenticator?.toLowerCase() === "programmatic_access_token" && tomlConfig.token) {
        config.authenticator = "programmatic_access_token";
        config.token = tomlConfig.token.trim();
        config.host = tomlConfig.host || process.env.SNOWFLAKE_HOST;
      } else if (tomlConfig.password) {
        config.password = tomlConfig.password;
      }

      return config as unknown as snowflake.ConnectionOptions;
    }
  }

  const base = {
    account: process.env.SNOWFLAKE_ACCOUNT,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH",
    database: process.env.SNOWFLAKE_DATABASE || "TEMP",
    schema: process.env.SNOWFLAKE_SCHEMA || "VELOCITY_AI",
  };

  const token = getOAuthToken();
  if (token) {
    return {
      ...base,
      host: process.env.SNOWFLAKE_HOST,
      token,
      authenticator: "programmatic_access_token",
    };
  }

  if (process.env.SNOWFLAKE_PASSWORD) {
    return {
      ...base,
      username: process.env.SNOWFLAKE_USER,
      password: process.env.SNOWFLAKE_PASSWORD,
    };
  }

  return {
    ...base,
    username: process.env.SNOWFLAKE_USER,
    authenticator: "EXTERNALBROWSER",
  };
}

async function getConnection(): Promise<snowflake.Connection> {
  const token = getOAuthToken();
  const connectionName = process.env.SNOWFLAKE_CONNECTION_NAME;

  if (connection && (!token || token === cachedToken)) {
    return connection;
  }

  if (connection) {
    console.log("Token changed, reconnecting");
    connection.destroy(() => {});
    connection = null;
  }

  if (connectionName) {
    console.log("Connecting with connection name:", connectionName);
  } else if (token) {
    console.log("Connecting with OAuth token");
  } else {
    console.log("Connecting with external browser auth");
  }
  
  const config = getConfig();
  const conn = snowflake.createConnection(config);
  
  console.log("Config authenticator:", config.authenticator);
  
  const useAsync = config.authenticator === "EXTERNALBROWSER" || 
                   config.authenticator === "OKTA";
  
  if (useAsync) {
    await conn.connectAsync(() => {});
  } else {
    await new Promise<void>((resolve, reject) => {
      conn.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  connection = conn;
  cachedToken = token;
  return connection;
}

function isRetryableError(err: unknown): boolean {
  const error = err as { message?: string; code?: number };
  return !!(
    error.message?.includes("OAuth access token expired") ||
    error.message?.includes("terminated connection") ||
    error.code === 407002
  );
}

export async function query<T>(sql: string, retries = 1): Promise<T[]> {
  try {
    const conn = await getConnection();
    return await new Promise<T[]>((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve((rows || []) as T[]);
          }
        },
      });
    });
  } catch (err) {
    console.error("Query error:", (err as Error).message);
    if (retries > 0 && isRetryableError(err)) {
      connection = null;
      return query(sql, retries - 1);
    }
    throw err;
  }
}

export async function execute(sql: string): Promise<void> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      complete: (err) => {
        if (err) reject(err);
        else resolve();
      },
    });
  });
}
