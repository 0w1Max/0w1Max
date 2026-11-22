#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {validatePublication} from './validate-daily.mjs';
const svgPath=process.argv[2];
if(!svgPath)throw Error('Provide the published SVG path');
const statePath=process.argv[3]??resolve(dirname(svgPath),'commando-state.json');
const result=validatePublication(readFileSync(svgPath,'utf8'),JSON.parse(readFileSync(statePath,'utf8')),JSON.parse(readFileSync(new URL('../commando-settings.json',import.meta.url),'utf8')));
console.log('PASS',result);
