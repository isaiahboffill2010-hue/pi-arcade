import path from'node:path';import os from'node:os';import{StateStore}from'../dist-electron/electron/services/store.js';import{verifyGames}from'../dist-electron/electron/services/verification.js';
if(process.platform!=='linux'||process.arch!=='arm64'){console.error('This verifier is intended for ARM64 Linux');process.exit(2)}
const ids=process.argv.slice(2);if(!ids.length){console.error('Usage: node scripts/verify-pi-games.mjs GAME_ID...');process.exit(2)}
process.env.PI_ARCADE_TEST_MODE='1';const store=new StateStore(path.join(os.homedir(),'.config','pi-arcade'));let failed=false;
for(const id of ids){const results=await verifyGames(store,id);const runtime=results.find(result=>result.stage==='launch-runtime-exit');console.log(JSON.stringify({id,state:runtime?.state??'missing',detail:runtime?.detail??'No runtime result'}));if(!runtime||runtime.state==='failed'||runtime.state==='blocked')failed=true}
if(failed)process.exitCode=1;
