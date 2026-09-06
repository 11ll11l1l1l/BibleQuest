import fs from 'node:fs';
import assert from 'node:assert/strict';
const doc=fs.readFileSync(new URL('../ERROR_CODES.md',import.meta.url),'utf8');
for(const code of ['BQ-NET-001','BQ-NET-002','BQ-AUTH-001','BQ-AUTH-002','BQ-INP-001','BQ-SRV-429','BQ-SRV-500','BQ-DATA-001','BQ-DATA-002','BQ-MOD-001','BQ-MOD-002','BQ-MOD-003','BQ-APP-001','BQ-APP-002','BQ-UI-001','BQ-UNK-001'])assert.ok(doc.includes(code),`diagnostic documentation missing ${code}`);
console.log('Diagnostic code documentation guard passed');
