// Type declarations for sql.js
declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string): Array<{ columns: string[]; values: any[][] }>;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(values?: any[] | { [key: string]: any }): boolean;
    step(): boolean;
    getAsObject(options?: { [key: string]: any }): { [key: string]: any };
    getColumnNames(): string[];
    get(values?: any[]): any[];
    free(): boolean;
    reset(): void;
  }

  export interface SqlJsStatic {
    Database: {
      new (data?: ArrayLike<number> | Buffer): Database;
    };
  }

  export interface InitSqlJsConfig {
    locateFile?: (file: string) => string;
    wasmBinaryFile?: string;
  }

  export default function initSqlJs(config?: InitSqlJsConfig): Promise<SqlJsStatic>;
}
