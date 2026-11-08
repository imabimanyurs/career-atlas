import { readFileSync } from 'node:fs';
const data=JSON.parse(readFileSync('company-registry.json','utf8'));
export const companyRegistry=new Map(data.companies.map(c=>[c.name,c]));
export const registryFor=name=>companyRegistry.get(name)||{name,wave:3,priority:3,notes:'Official government recruitment source'};
