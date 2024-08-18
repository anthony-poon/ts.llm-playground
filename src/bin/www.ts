#!/usr/bin/env node
import http from '../http';
import database from "@database";

(async () => {
  await database.initialize();
  await http.initialize();
  http.listen();
})();
