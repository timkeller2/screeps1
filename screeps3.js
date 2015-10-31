var avail = 0, encumbered = 0, hostility = 0, cpuR = 0, cpuC = 0, cpuS = 0, cpuB = 0, cpuF = 0, cpuE = 0, roomsexp = 0, loot = null, lootAmount = 0, lootroom = '', notHurt = true, tempStorageLimit = 3000;
var hostileName = '', hostileRoom = '', topUser = null, topUserAmount = 0, maxHostile = 9999, allDrop = [], allSource = [], allCo = [], allHre = [], harvFull = .75, mapping = 0, totalStored = 0, totalFriends = 0, totEvadeCpu = 0;
var maxNodes = 2000, allies = [ 'theAEmix', 'Waveofbabies', 'Vertigan', 'Rumatah' ], storageLevel = 1000000, minBuild = 350000, skipCpuLevel = 25, distRange = 150, mappingRange = 10, bypassCode = false, rampartMult = 2500, growthRate = 10, totalSources = 0, unEncSources = 0, unEncSourcesE = 0;
var roaming = 160, canSpawn = true, cpuByRole = {}, cpuByRSlow = {}, supStop = 75, harvStop = 50, pauseBot = 100, spawnerDiv = 20, ruralSites = [], roomDiv = 35, processSpawner = true, hasMapped = false, startCpu = null, rLevel = 50, maxHelpers = 2;

runScreeps();

function runScreeps() {
    cpuB = Game.getUsedCpu();
    if ( Game.time / spawnerDiv == Math.floor( Game.time / spawnerDiv ) ) supStop += 250;
    if ( Game.time / roomDiv == Math.floor( Game.time / roomDiv ) ) { supStop += 250; console.log( 'Processing room caches...' ); }

    if ( Game.flags.bypass ) bypassCode = true;
    
    var test = Memory.cpu;
    cpuB = Game.getUsedCpu() - cpuB;
    
    rF();  // Run Flags
    rR();  // Run Rooms
    rC();  // Run Creeps
    rS();  // Run Spawners

    if ( Game.cpuLimit < 500 ) Memory.governmentShutdowns = Memory.governmentShutdowns + 1;
    Memory.cpu = Memory.cpu + cpuR + cpuC + cpuS + cpuB + cpuF;
    Memory.cpuB = Memory.cpuB + cpuB;
    Memory.cpuF = Memory.cpuF + cpuF;
    Memory.cpuR = Memory.cpuR + cpuR;
    Memory.cpuC = Memory.cpuC + cpuC;
    Memory.cpuS = Memory.cpuS + cpuS;
    Memory.lastcpu = cpuR + cpuC + cpuS + cpuB + cpuF;
    Memory.mapping = Memory.mapping + mapping;

    if ( Game.flags.cpu ) console.log( 'CPU ' + Math.floor( Memory.lastcpu ) + ':  B: ' + Math.floor( cpuB ) + ' F: ' + Math.floor( cpuF ) + ' R: ' + Math.floor( cpuR ) + ' C: ' + Math.floor( cpuC ) + ' S: ' + Math.floor( cpuS ) + '  Top User: ' + topUser.name + ' ' + topUser.pos + '  e: ' + topUser.memory.epathed +  '  CPU: ' + topUser.memory.usedCpu1 + ', ' + topUser.memory.usedCpu2 + ', ' + topUser.memory.usedCpu3 + ', Total: ' + topUser.memory.usedCpu + '  Creeps Mapping: ' + mapping );
    if ( totEvadeCpu > 50 ) console.log( 'Evasion Cpu: ' + totEvadeCpu );
    
    if ( Game.time / 10 == Math.floor( Game.time / 10 ) || Memory.lastReport < Game.time - 10 ) {
        Memory.lastReport = Game.time;
        if ( Game.flags.houseCleaning ) houseCleaning();
        console.log( ' ' );
        console.log( 'TURN ' + Game.time + '  -------------------------------------------------------------------------------------------------------------------------- ' );
        for( var ms in Game.spawns ) { 
            var sp = Game.spawns[ms];
            var creep = sp.spawning ? sp.spawning.name : '';
            console.log( sp.name + '  Rooms: ' + roomsexp + '  Bots: ' + sp.memory.friends + '  Mil: '+ sp.memory.military + '  Art: '+ sp.memory.artillery + '  Heal: '+ sp.memory.healers +'  Carry: ' + sp.memory.carriers + '  Builds: ' + sp.memory.parts*3 + '/1500  Dying: '+ sp.memory.sick + '% load   Stored: ' + sp.room.memory.storedEnergy + '  Ex: ' + sp.memory.exe + '  Spawning: ' + creep );
            totalFriends += sp.memory.friends;
        }
        console.log( 'Sources: ' + unEncSourcesE + '/' + unEncSources + '/' + totalSources + '  Stored: ' + totalStored + '  Avail: ' + avail + ' - ' + encumbered + ' = ' + Math.floor( avail - encumbered ) + '   Hostility: ' + hostility + ' ' + hostileName + ' ' + hostileRoom + '  Loot: ' + lootAmount + ' in '+lootroom+'  AvCpu: b'+  Math.floor(Memory.cpuB/10) + ' f' + Math.floor(Memory.cpuF/10) + ' r' +  Math.floor(Memory.cpuR/10) + ' c' + Math.floor(Memory.cpuC/10) + ' s' +  Math.floor(Memory.cpuS/10) + '=' +  Math.floor(Memory.cpu/10) + '/' + Game.cpuLimit + '  Skipped Bots: ' + Math.floor( Memory.skips / 10 ) + '/' + Math.floor( Memory.pauseBots / 10 ) + '/' + totalFriends + '  Mapping: ' + Memory.mapping + '  Shutdowns: ' + Memory.governmentShutdowns + '  AllCon: ' + allCo.length );
        Memory.cpu = 0;
        Memory.cpuB = 0;
        Memory.cpuF = 0;
        Memory.cpuR = 0;
        Memory.cpuC = 0;
        Memory.cpuS = 0;
        Memory.mcpu = 0;
        Memory.skips = 0;
        Memory.mapping = 0;
        Memory.pauseBots = 0; 
        Memory.healerHeal = 0;
        Memory.governmentShutdowns = 0;
        Memory.healer = null;

        if ( Game.flags.cpuUnit ) {
            for( var title in Memory.cpuByRSlow ) {
                if ( Math.floor( Memory.cpuByRSlow[title] ) > 0 ) console.log( title + ': ' + Math.floor( Memory.cpuByRSlow[title] / 10 ) );
            }
        }
        
        Memory.cpuByRSlow = {};
    }

    if ( Game.flags.cpu ) {
        var cpuReport = '';
        for( var role in cpuByRole ) {
            if ( Math.floor( cpuByRole[role] ) > 0 ) cpuReport = cpuReport + '  ' + role + ' ' + Math.floor( cpuByRole[role] );
        }
        console.log( cpuReport );
    }
    
    if ( Game.flags.repath ) Game.flags.repath.remove();
}

function houseCleaning() {
    for(var i in Memory.creeps) {
        if( !Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }    
    for(var i in Memory.flags) {
        if( !Game.flags[i]) {
            delete Memory.flags[i];
        }
    }    
    for(var i in Memory.rooms) {
        if( !Game.rooms[i]) {
            delete Memory.rooms[i];
        }
    }   
    Game.flags.houseCleaning.remove();
}

function rF() {
    cpuF = Game.getUsedCpu();
    for ( var flagname in Game.flags ) {
        var fl = Game.flags[flagname];

        if ( fl.room ) {
            if ( Game.time / 7 == Math.floor( Game.time / 7 ) ) {
                var ener = fl.pos.findInRange( FIND_DROPPED_ENERGY, 1 ), tot = 0;
                for ( var i = 0; i < ener.length; i++ ) { tot += ener[i].energy; }
                fl.memory.tot = tot;
                if ( fl.memory.dist > 350 ) fl.memory.dist = 50;
                if ( fl.memory.dist < fl.memory.tot / 50 ) fl.memory.dist = Math.floor( fl.memory.tot / 50 );
            }
        }
    }
    cpuF = Game.getUsedCpu() - cpuF;
}

function rR() {
    cpuR = Game.getUsedCpu();
    for ( var roomname in Game.rooms ) {
        var rm = Game.rooms[roomname], stored = 0;
        roomsexp += 1;
        
        // Reboot Path Caching
        if ( Game.flags.repath ) rm.memory.epath = null;
        if ( Game.flags.rr && Game.flags.rr.room == rm ) { rm.memory.epath = null; Game.flags.rr.remove(); }
        if ( !rm.memory.repath || Game.time > rm.memory.repath ) {
            if ( Math.floor( Math.random() * 500 ) == 50 && Game.cpuLimit > 499 ) {
                rm.memory.repath = Game.time + 125000 + Math.floor( Math.random() * 5000 );
                rm.memory.epath = null;
                console.log( 'Repathing ' + rm.name );
            }
        }
        
        // Self Growing Defensive Structures
        if ( !rm.memory.lastGrowth ) rm.memory.lastGrowth = 0;
        var sites = rm.find( FIND_CONSTRUCTION_SITES ).length;
        if ( sites > 0 && Game.time / 300 == Math.floor( Game.time / 300 ) ) console.log( rm.name + ' ' + sites + ' sites' );
        if ( rm.memory.lastGrowth + 300 < Game.time && sites < growthRate && Game.getUsedCpu() < 50 ) {
            console.log( 'Processing room structure natural growth...' );
            rm.memory.lastGrowth = Game.time + Math.floor( Math.random() * 1200 );
            
            // Structure Ramparts
            var stru = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_SPAWN || object.structureType == STRUCTURE_STORAGE; } } );
            for ( var i = 0; i < stru.length && sites < growthRate; i++ ) {
                var str = stru[i];
                if ( !rampa( rm, str.pos.x - 1, str.pos.y - 1 ) && rm.createConstructionSite( str.pos.x - 1, str.pos.y - 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                if ( !rampa( rm, str.pos.x,     str.pos.y - 1 ) && rm.createConstructionSite( str.pos.x    , str.pos.y - 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                if ( !rampa( rm, str.pos.x + 1, str.pos.y - 1 ) && rm.createConstructionSite( str.pos.x + 1, str.pos.y - 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                if ( !rampa( rm, str.pos.x - 1, str.pos.y     ) && rm.createConstructionSite( str.pos.x - 1, str.pos.y    , STRUCTURE_RAMPART ) == 0 ) { sites++; }
                if ( !rampa( rm, str.pos.x,     str.pos.y     ) && rm.createConstructionSite( str.pos.x    , str.pos.y    , STRUCTURE_RAMPART ) == 0 ) { sites++; }
                if ( !rampa( rm, str.pos.x + 1, str.pos.y     ) && rm.createConstructionSite( str.pos.x + 1, str.pos.y    , STRUCTURE_RAMPART ) == 0 ) { sites++; }
                if ( !rampa( rm, str.pos.x - 1, str.pos.y + 1 ) && rm.createConstructionSite( str.pos.x - 1, str.pos.y + 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                if ( !rampa( rm, str.pos.x,     str.pos.y + 1 ) && rm.createConstructionSite( str.pos.x    , str.pos.y + 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                if ( !rampa( rm, str.pos.x + 1, str.pos.y + 1 ) && rm.createConstructionSite( str.pos.x + 1, str.pos.y + 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
            }
            var stru = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_LINK; } } );
            for ( var i = 0; i < stru.length && sites < growthRate; i++ ) {
                var str = stru[i];
                if ( !rampa( rm, str.pos.x,     str.pos.y     ) && rm.createConstructionSite( str.pos.x    , str.pos.y    , STRUCTURE_RAMPART ) == 0 ) { sites++; }
            }

            /*
            // Room Ramparts
            var ramparts = rm.find( FIND_STRUCTURES, { filter: function(object) { return ( object.structureType == STRUCTURE_RAMPART || object.structureType == STRUCTURE_WALL ) && ( object.pos.x == 2 || object.pos.x == 47 || object.pos.y == 2 || object.pos.y == 47 ); } } );
            for ( var i = 0; i < ramparts.length && sites < growthRate; i++ ) {
                var ram = ramparts[i];
                if ( ram.pos.x == 2 || ram.pos.x == 47 ) {
                    if ( !rampa( rm, ram.pos.x, ram.pos.y - 1 ) && rm.createConstructionSite( ram.pos.x, ram.pos.y - 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                    if ( !rampa( rm, ram.pos.x, ram.pos.y + 1 ) && rm.createConstructionSite( ram.pos.x, ram.pos.y + 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                }
                if ( ram.pos.y == 2 || ram.pos.y == 47 ) {
                    if ( !rampa( rm, ram.pos.x - 1, ram.pos.y ) && rm.createConstructionSite( ram.pos.x - 1, ram.pos.y, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                    if ( !rampa( rm, ram.pos.x + 1, ram.pos.y ) && rm.createConstructionSite( ram.pos.x + 1, ram.pos.y, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                }
            }
            */

            // Extension Roads
            var extensions = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_EXTENSION || object.structureType == STRUCTURE_LINK; } } );
            for ( var i = 0; i < extensions.length && sites < growthRate; i++ ) {
                var ram = extensions[i];
                if ( !roa( rm, ram.pos.x, ram.pos.y - 1 ) && rm.createConstructionSite( ram.pos.x, ram.pos.y - 1, STRUCTURE_ROAD ) == 0 ) { sites++; }
                if ( !roa( rm, ram.pos.x, ram.pos.y + 1 ) && rm.createConstructionSite( ram.pos.x, ram.pos.y + 1, STRUCTURE_ROAD ) == 0 ) { sites++; }
                if ( !roa( rm, ram.pos.x - 1, ram.pos.y ) && rm.createConstructionSite( ram.pos.x - 1, ram.pos.y, STRUCTURE_ROAD ) == 0 ) { sites++; }
                if ( !roa( rm, ram.pos.x + 1, ram.pos.y ) && rm.createConstructionSite( ram.pos.x + 1, ram.pos.y, STRUCTURE_ROAD ) == 0 ) { sites++; }
            }
            
        }

        if ( rm.controller ) var rampartlevel = rm.controller.level * rm.controller.level * rampartMult; else var rampartlevel = 5000;
        if ( rampartlevel < 5000 ) rampartlevel = 5000;
        rm.memory.sites = sites;        
        // if ( !rm.memory.nextLookEnergy || Game.time > rm.memory.nextLookEnergy ) {
            rm.memory.nextLookEnergy = Game.time + 10 + Math.floor( Math.random() * 10 );
            rm.memory.availEnergy = rm.find( FIND_DROPPED_ENERGY, { filter: function(object) { var lookCreep = object.pos.lookFor('creep'); return !( lookCreep.length > 0 && lookCreep[0].owner.username == 'Vision' && lookCreep[0].memory.role == 'storage' && !lookCreep[0].memory.linked ); } } );
            rm.memory.storedEnergy = rm.find( FIND_DROPPED_ENERGY, { filter: function(object) { var lookCreep = object.pos.lookFor('creep'); return (lookCreep.length > 0 && lookCreep[0].owner.username == 'Vision' && lookCreep[0].memory.role == 'storage' && !lookCreep[0].memory.linked ); } } );
            rm.memory.allEnergy = rm.find( FIND_DROPPED_ENERGY );
        // }

        for ( var i = 0; i < rm.memory.allEnergy.length; i++ ) {
            var thisE = rm.memory.allEnergy[i], aD = allDrop.length;
            if ( thisE.pos !== undefined ) {
                if ( thisE.pos.lookFor('creep').length > 0 && thisE.pos.lookFor('creep')[0].owner.username == 'Vision' && thisE.pos.lookFor('creep')[0].memory.role == 'storage' ) thisE.storage = 1; else thisE.storage = 0;
                
                allDrop[aD] = rm.memory.allEnergy[i];
                allDrop[aD].enc = 0;
    
                for ( var name in Game.creeps ) { var creep = Game.creeps[name]; if ( creep.memory.loot && creep.memory.loot == allDrop[aD].id ) allDrop[aD].enc += ( creep.carryCapacity - creep.carry.energy ); }
                encumbered += allDrop[aD].enc;
            }
        }

        // Manage Source Maintenance
        if ( !rm.memory.so ) {
            var src = rm.find( FIND_SOURCES ); 
            rm.memory.so = [];
            for ( var i = 0; i < src.length; i++ ) {
                rm.memory.so[i] = src[i].id;
            }
        }

        // Manage Extension Maintenance
        var ext = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_EXTENSION && object.energy < 50; } } ); 
        rm.memory.ex = [];
        for ( var i = 0; i < ext.length; i++ ) {
            rm.memory.ex[i] = ext[i].id;
        }

        if ( Game.time / roomDiv == Math.floor( Game.time / roomDiv ) ) {
            // Detect Room Objects for Creeps
        	rm.memory.lairs = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_KEEPER_LAIR; } } ).length;
        	rm.memory.links = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_LINK; } } ).length;
            rm.memory.extensions = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_EXTENSION; } } ).length;
            rm.memory.sources = rm.find( FIND_SOURCES ).length;
            
            // Manage Link Maintenance
            var links = rm.find( FIND_MY_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_LINK; } } );
            rm.memory.li = [];
            for ( var i = 0; i < links.length; i++ ) {
                rm.memory.li[i] = links[i].id;
            }

        }

        // Manage Repair Maintenance
        var repa = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.hits < object.hitsMax * .75 && object.hits < rampartlevel * .75; } } );
        rm.memory.re = [];
        rm.memory.hre = [];
        rm.memory.hpre = [];
        for ( var i = 0; i < repa.length; i++ ) {
            rm.memory.re[i] = repa[i].id;
            if ( repa[i].hits < repa[i].hitsMax / 2 && repa[i].hits < rampartlevel / 2 && repa[i].structureType != STRUCTURE_ROAD ) { rm.memory.hre[ rm.memory.hre.length ] = repa[i].id; allHre[ allHre.length ] = repa[i].id; }
            if ( repa[i].hits < repa[i].hitsMax / 10 && repa[i].hits < rampartlevel / 10 && repa[i].structureType == STRUCTURE_ROAD ) { rm.memory.hre[ rm.memory.hre.length ] = repa[i].id; allHre[ allHre.length ] = repa[i].id; }
            if ( repa[i].hits < repa[i].hitsMax / 10 && repa[i].hits < rampartlevel / 10 && repa[i].structureType != STRUCTURE_ROAD ) rm.memory.hpre[ rm.memory.hpre.length ] = repa[i].id;
        }
            
        // Manage Construction Maintenance
        var cons = rm.find( FIND_MY_CONSTRUCTION_SITES );
        rm.memory.co = [];
        for ( var i = 0; i < cons.length; i++ ) {
            rm.memory.co[i] = cons[i].id;
            allCo[allCo.length] = cons[i].id;
        }

        // Manage Workers
        var work = rm.find( FIND_MY_CREEPS, { filter: function(object) { return object.getActiveBodyparts( WORK ) > 0; } } );
        rm.memory.wo = [];
        for ( var i = 0; i < work.length; i++ ) {
            rm.memory.wo[i] = work[i].id;
        }

        // Who needs energy?
        rm.memory.ne = [];
        var lk = rm.find( FIND_MY_SPAWNS );
        for ( var i = 0; i < lk.length; i++ ) {
            if ( lk[i].energy < 300 ) rm.memory.ne[ rm.memory.ne.length ] = lk[i].id;
        }
        if ( rm.storage ) rm.memory.ne[ rm.memory.ne.length ] = rm.storage.id;
        var lk = rm.find( FIND_MY_CREEPS );
        for ( var i = 0; i < lk.length; i++ ) {
            if ( lk[i].memory.role == 'storage' && lk[i].carry.energy < lk[i].carryCapacity && ( Math.abs(lk[i].memory.storedEnergy) < rm.memory.tempStorageLimit || !rm.storage ) && !lk[i].memory.linked ) rm.memory.ne[ rm.memory.ne.length ] = lk[i].id;
            if ( lk[i].carry.energy < lk[i].carryCapacity /*- lk[i].getActiveBodyparts( WORK ) - 1*/ && ( lk[i].memory.role == 'sup' || lk[i].getActiveBodyparts( WORK ) > 0 ) && lk[i].memory.wantEnergy && lk[i].memory.role != 'harv' && ( lk[i].memory.role != 'miner' || ( lk[i].memory.role == 'miner' && lk[i].memory.accum ) ) ) rm.memory.ne[ rm.memory.ne.length ] = lk[i].id;
        }

        totalSources = totalSources + rm.memory.sources;

        var totEnergy = 0;
        for ( var i = 0; i < rm.memory.availEnergy.length; i++ ) { 
            avail += rm.memory.availEnergy[i].energy;
            totEnergy += rm.memory.availEnergy[i].energy;
            if ( rm.memory.availEnergy[i].pos.lookFor('creep').length > 0 && rm.memory.availEnergy[i].pos.lookFor('creep')[0].owner.username == 'Vision' ) rm.memory.availEnergy[i].pos.lookFor('creep')[0].memory.storedEnergy = rm.memory.availEnergy[i].energy * -1;
            if ( rm.memory.availEnergy[i].energy > lootAmount ) { lootAmount = rm.memory.availEnergy[i].energy; loot = rm.memory.availEnergy[i]; lootroom = rm.name; }
        }
        for ( var i = 0; i < rm.memory.storedEnergy.length; i++ ) { stored += rm.memory.storedEnergy[i].energy; rm.memory.storedEnergy[i].pos.lookFor('creep')[0].memory.storedEnergy = rm.memory.storedEnergy[i].energy * -1; }
        if ( rm.storage && rm.storage.owner.username == 'Vision' ) stored += rm.storage.store.energy;
        
        if ( Game.time / 10 == Math.floor( Game.time / 10 ) && totEnergy > 5000 ) console.log( 'Energy glut ' + rm.name + ' ' + totEnergy );

        var hos = rm.find( FIND_HOSTILE_CREEPS, { filter: function(object) { return object.hitsMax < maxHostile && allies.indexOf( object.owner.username ) < 0; } } );
        for ( var i = 0; i < hos.length; i++ ) {
            if ( hos[i].hitsMax < 4500 && allies.indexOf( hos[i].owner.username ) < 0 ) {
                if ( hos[i].getActiveBodyparts(ATTACK) > 0 ) { hostility += hos[i].getActiveBodyparts(ATTACK); hostileName = hos[i].owner.username; hostileRoom = hos[i].room.name; }
                if ( hos[i].getActiveBodyparts(RANGED_ATTACK) > 0 ) { hostility += hos[i].getActiveBodyparts(RANGED_ATTACK); hostileName = hos[i].owner.username; hostileRoom = hos[i].room.name; }
                if ( hos[i].getActiveBodyparts(HEAL) > 0 ) { hostility += hos[i].getActiveBodyparts(HEAL); hostileName = hos[i].owner.username; hostileRoom = hos[i].room.name; }
            }
        }
        rm.memory.totalEnergy = totEnergy;
        rm.memory.storedEnergy = stored;
        rm.memory.iGotTheExt = 0;
        rm.memory.hos = hos;
        rm.memory.linkBeam = false;
        rm.memory.gridlockBreaker = true;

        // Report previous cpu trouble spots
        if ( rm.memory.cpuUse && rm.memory.cpuUse > 50 ) console.log( Game.time + ': ' + rm.name + ' used ' + Math.floor( rm.memory.cpuUse ) );
        rm.memory.cpuUse = 0;
        if ( rm.storage ) rm.memory.tempStorageLimit = 600; else rm.memory.tempStorageLimit = tempStorageLimit;
        if ( Game.time / 3 == Math.floor( Game.time / 3) ) rm.memory.noExtNeed = false;
        if ( Game.time / roomDiv == Math.floor( Game.time / roomDiv) ) rm.memory.mil = 0;
        totalStored += stored;
    }
    cpuR = Game.getUsedCpu() - cpuR;
}

function rS() {
    cpuS = Game.getUsedCpu();
    for( var spawnername in Game.spawns ) {
        var spawner = Game.spawns[spawnername];
        if ( Game.time / spawnerDiv == Math.floor( Game.time / spawnerDiv ) ) spawner.memory.ready = true;
        if ( Game.getUsedCpu() > Game.cpuLimit - 25 ) { console.log( 'Skipping spawner '+spawner.name+' for cpu ' + Game.time + ': ' + Math.floor( Game.getUsedCpu() ) ); continue; }

        if ( !spawner.spawning && processSpawner && spawner.memory.ready ) {
            spawner.memory.ready = false;
            processSpawner = false;
            
            // Map energy storage support
            var stor = spawner.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role == 'storage'; } } );
            if ( !stor && spawner.room.storage && spawner.room.storage.pos.inRangeTo( spawner, 1 ) && spawner.energy < 300 ) { spawner.room.storage.transferEnergy( spawner );  }
    	    var link = spawner.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.pos.inRangeTo( spawner, 1 ) && object.structureType == STRUCTURE_LINK; } } );
    	    if ( link && link.energy < 500 ) spawner.room.storage.transferEnergy( link );
    	    var emptyLink = spawner.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.pos.inRangeTo( spawner, 1 ) && object.energy == 0 && object.structureType == STRUCTURE_LINK && !object.pos.inRangeTo( spawner.room.storage, 2 ); } } );
    	    if ( emptyLink && link && link.energy > 0 && link.cooldown == 0 && !spawner.room.memory.linkBeam ) { link.transferEnergy( emptyLink ); spawner.room.memory.linkBeam = true; }
            
            var suf = spawner.name;

            var ex = spawner.room.find( FIND_STRUCTURES, { filter: function( object ) { return object.energyCapacity == 50; } } ).length;
            var exe = Math.floor( ( spawner.room.energyAvailable - 300 ) / 50 );
            if ( exe < 0 ) exe = 0;
            var enemies = spawner.room.find( FIND_HOSTILE_CREEPS, { filter: function( object ) { return ( object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 ) && object.hitsMax < maxHostile && allies.indexOf( object.owner.username ) < 0; } } );
            var friends = spawner.room.find( FIND_MY_CREEPS );
            // if ( exe < ex / 2 && friends.length > 4 ) { console.log( spawner.name + ' ' + exe + '/' + ex ); continue; }
            var sites = spawner.room.find( FIND_CONSTRUCTION_SITES );
            var rampartlevel = spawner.room.controller.level * spawner.room.controller.level * rampartMult;
            if ( rampartlevel < 5000 ) rampartlevel = 5000;
    	    var repairSites = spawner.room.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.hits < object.hitsMax / 2 && object.hits < rampartlevel / 2; } } );
    	    var infrastructureSupport = false;
    	    for ( var i = 0; !infrastructureSupport && i < allCo.length; i++ ) { if ( Game.getObjectById( allCo[i] ) && orange( spawner, Game.getObjectById( allCo[i] ) ) < 128 ) infrastructureSupport = true; }
    	    for ( var i = 0; !infrastructureSupport && i < allHre.length; i++ ) { if ( Game.getObjectById( allHre[i] ) && orange( spawner, Game.getObjectById( allHre[i] ) ) < 128 ) infrastructureSupport = true; }

            spawner.memory.friends = 0;
            spawner.memory.military = 0;
            spawner.memory.artillery = 0;
            spawner.memory.healers = 0;
            spawner.memory.parts = 0;
            spawner.memory.sick = 0;
            spawner.memory.carriers = 0;
            spawner.memory.ex = ex;
            spawner.memory.exe = exe;
            for ( var sc in Game.creeps ) {
            	var creep = Game.creeps[sc];
                
                if ( creep.memory.spawn == spawner.name ) {
                    if ( creep.getActiveBodyparts( ATTACK ) > 0 ) spawner.memory.military = spawner.memory.military + creep.getActiveBodyparts( ATTACK );
                    if ( creep.getActiveBodyparts( RANGED_ATTACK ) > 0 && creep.getActiveBodyparts( MOVE ) > 1 ) spawner.memory.artillery = spawner.memory.artillery + creep.getActiveBodyparts( RANGED_ATTACK );
                    if ( creep.getActiveBodyparts( HEAL ) > 0 ) spawner.memory.healers = spawner.memory.healers + creep.getActiveBodyparts( HEAL );
                    if ( creep.getActiveBodyparts( CARRY ) > 0 && creep.memory.role == 'harv' ) spawner.memory.carriers = spawner.memory.carriers + creep.getActiveBodyparts( CARRY );
                    spawner.memory.parts = spawner.memory.parts + Math.floor( creep.hitsMax / 100 );
                    spawner.memory.friends = spawner.memory.friends + 1;
                    if ( creep.ticksToLive < 300 ) spawner.memory.sick = spawner.memory.sick + Math.floor( creep.hitsMax / 100 );
                    if ( creep.hits < creep.hitsMax ) notHurt = false;
                }
            }
            
            // Are my miners operational?
            var minersGood = true;

            // Try for big but adjust if needed
            var eex = ex;
            if ( spawner.memory.spawnLag > 5 || friends < 3 ) eex = exe;
    
            // Econ Units
            var m = [];  if ( eex < 10 ) { addPart(m,WORK,2);  addPart(m, CARRY, 1 ); addPart(m,MOVE,1); if ( eex > 4 ) { addPart(m,WORK,1); addPart(m,MOVE,2); } } else { addPart(m,WORK,5); addPart(m,MOVE,5); } 
            var lm = []; if ( eex < 10 ) { addPart(lm,WORK,2);  addPart(lm, CARRY, 1 ); addPart(lm,MOVE,1); if ( eex > 4 ) { addPart(lm,WORK,2); } } else { addPart(lm,WORK,5); addPart(lm,MOVE,3); }
            var rr = []; addPart(rr,WORK,17); addPart(rr,MOVE,18); addPart(rr,HEAL,1); 
            var rrh = []; addPart(rrh,WORK,32); addPart(rrh,MOVE,17); addPart(rrh,HEAL,1); 
            var w = [];  if ( ex < 91 ) { addPart(w,WORK,2+Math.floor(ex/2)-Math.floor(ex/5)); addPart(w,CARRY,1+Math.floor(ex/24)); addPart(w,MOVE,1+Math.floor(ex/21)); } else { addPart(w,WORK,44); addPart(w,CARRY,3); addPart(w,MOVE,3); }  
            var hw = []; if ( ex < 60 ) { addPart(hw,WORK,1+Math.floor(ex/8)); addPart(hw,CARRY,3+Math.floor(ex/2)); addPart(hw,MOVE,1+Math.floor(ex/4)); } else { addPart(hw,WORK,20); addPart(hw,CARRY,20); addPart(hw,MOVE,10); }
            var sw = []; if ( ex < 60 ) { addPart(sw,WORK,1+Math.floor(ex/4)); addPart(sw,CARRY,1+Math.floor(ex/4)); addPart(sw,MOVE,1+Math.floor(ex/4)); } else { addPart(sw,WORK,16); addPart(sw,CARRY,16); addPart(sw,MOVE,16); }
            var rw = []; if ( ex < 50 ) { addPart(rw,WORK,1+Math.floor(ex/3)); addPart(rw,CARRY,1); addPart(rw,MOVE,2+Math.floor(ex/3)); } else { addPart(rw,WORK,22); addPart(rw,CARRY,3); addPart(rw,MOVE,25); }
            var c = [];  if ( ex < 45 ) { addPart(c,CARRY,3+Math.floor(ex/2)); addPart(c,MOVE,3+Math.floor(ex/2)); } else { addPart(c,CARRY,25); addPart(c,MOVE,25); }
            var cc = []; if ( exe < 45 ) { addPart(cc,CARRY,4+Math.floor(exe/3)*2); addPart(cc,MOVE,2+Math.floor(exe/3)); } else { addPart(cc,CARRY,33); addPart(cc,MOVE,17); }
            var cch = []; if ( exe < 45 ) { addPart(cch,CARRY,4+Math.floor(exe/3)*2); addPart(cch,MOVE,2+Math.floor(exe/3)); } else { addPart(cch,CARRY,32); addPart(cch,MOVE,17); addPart(cch,HEAL,1); }
            var wc = []; if ( exe < 45 ) { addPart(wc,CARRY,4+Math.floor(exe/3)*2); addPart(wc,MOVE,2+Math.floor(exe/3)); } else { addPart(wc,CARRY,32); addPart(wc,MOVE,16); }
            var lc = []; if ( exe < 45 ) { addPart(lc,CARRY,2+Math.floor(Math.floor(exe/2))); addPart(lc,MOVE,2+Math.floor(exe/2)); } else { addPart(lc,CARRY,25); addPart(lc,MOVE,25);  }
            var s = [];  addPart(s,CARRY,5); addPart(s,MOVE,1); if ( eex > 4 ) addPart(s,CARRY,5); if ( eex > 9 ) addPart(s,CARRY,5); if ( eex > 14 ) addPart(s,CARRY,5); if ( eex > 19 ) addPart(s,CARRY,5); if ( eex > 24 ) addPart(s,CARRY,5);
            var o = [MOVE,CARRY];
            var l = [MOVE,CARRY,CARRY];
            var lcs = [MOVE,CARRY,CARRY];
            var lw = [CARRY,WORK,WORK,MOVE];
            var lg = [MOVE,ATTACK];
            var lh = [MOVE,HEAL];
            var la = [MOVE,RANGED_ATTACK];
            var giver = []; addPart(giver,CARRY,10); addPart(giver,MOVE,5);
    
            // Elite Military, Keeper Hunters
            var gx = []; addPart(gx,CARRY,6); addPart(gx,MOVE,12); addPart(gx,ATTACK,12); 
            var ax = []; addPart(ax,CARRY,2); addPart(ax,MOVE,10); addPart(ax,RANGED_ATTACK,10); addPart(ax,MOVE,2); addPart(ax,HEAL,2);
            var alx = []; addPart(alx,CARRY,4); addPart(alx,MOVE,7); addPart(alx,RANGED_ATTACK,7); addPart(alx,MOVE,2); addPart(alx,HEAL,2);
            var ahx = []; addPart(ahx,TOUGH,10); addPart(ahx,MOVE,8); addPart(ahx,RANGED_ATTACK,9); addPart(ahx,MOVE,2); addPart(ahx,HEAL,1);
            var hx = []; addPart(hx,CARRY,6); addPart(hx,MOVE,4); addPart(hx,HEAL,7); addPart(hx,MOVE,4);  addPart(hx,HEAL,1);
            var hwx = []; addPart(hwx,CARRY,15); addPart(hwx,WORK,10); addPart(hwx,MOVE,25);

            // Elite Light Military    
            var gxl = []; addPart(gxl,CARRY,2); addPart(gxl,MOVE,4); addPart(gxl,ATTACK,4); 
            var axl = []; addPart(axl,CARRY,2); addPart(axl,MOVE,4); addPart(axl,RANGED_ATTACK,4); addPart(axl,MOVE,1); addPart(axl,HEAL,1);
            var hxl = []; addPart(hxl,CARRY,8); addPart(hxl,MOVE,4); addPart(hxl,HEAL,4); 
            
            // The Most Elite Military
            var axh = []; addPart(axh,MOVE,24); addPart(axh,RANGED_ATTACK,20); addPart(axh,HEAL,5); addPart(axh,MOVE,1); 
            var hxh = []; addPart(hxh,MOVE,15); addPart(hxh,HEAL,15); 
            
            // Anti-Seeker
            var axhh = []; addPart(axhh,MOVE,12); addPart(axhh,RANGED_ATTACK,18); addPart(axhh,HEAL,8); addPart(axhh,MOVE,1);
            
            // Base Military Units
            var g = []; if ( exe < 15 ) { addPart(g,TOUGH,4+Math.floor(exe/3)*2); addPart(g,ATTACK,2+Math.floor(exe/3)); addPart(g,MOVE,2+Math.floor(exe/3)); }
            else if ( exe < 30 ) { addPart(g,CARRY,3+Math.floor(exe/4)); addPart(g,ATTACK,1+Math.floor(exe/4)); addPart(g,MOVE,1+Math.floor(exe/4)); }
            var a = []; if ( eex < 57 ) { addPart(a,RANGED_ATTACK,1+Math.floor(eex/4)); addPart(a,MOVE,1+Math.floor(eex/4)); } else { addPart(a,RANGED_ATTACK,15); addPart(a,MOVE,15); };
            var h = []; if ( eex < 90 ) { addPart(h,HEAL,1+Math.floor(eex/6)); addPart(h,MOVE,1+Math.floor(eex/6)); } else { addPart(h,HEAL,15); addPart(h,MOVE,15); }
            
            // Advanced Military Units
            var t = [];  addPart(t,ATTACK,3+Math.floor(ex/2));  addPart(t,MOVE,1);
            var b = [];  if ( ex < 100 ) { addPart(b,MOVE,1+Math.floor(eex/10)); addPart(b,RANGED_ATTACK,1+Math.floor(eex/3)); } else { addPart(b,MOVE,10); addPart(b,RANGED_ATTACK,40); }
            var x = [];  addPart(x,MOVE,24); addPart(x,ATTACK,25); addPart(x,MOVE,1); 
            var xh = []; if ( ex < 60 ) { addPart(xh,MOVE,1+Math.floor( ex / 6 )); addPart(xh,ATTACK,3+Math.floor( ex / 2 )); } else { addPart(xh,MOVE,9); addPart(xh,ATTACK,40); addPart(xh,MOVE,1); }
            var xr = []; addPart(xr,RANGED_ATTACK,25); addPart(xr,MOVE,25);
            var z = [];  addPart(z,MOVE,1); 

            if ( !spawner.memory.spawnLag ) spawner.memory.spawnLag = 0;
            if ( spawner.energy == 300 ) spawner.memory.spawnLag = spawner.memory.spawnLag + 1; else spawner.memory.spawnLag = 0;
    
            // Military Calculations
            var firepower = spawner.memory.military + spawner.memory.artillery + spawner.memory.healers;

            // Economic Creeps
            if ( minersGood && enemies.length == 0 ) {
                for ( var i = 0; i < 12; i++ ) {
                    if ( Game.flags['m'+i+suf] && !Game.flags['m'+i+suf].memory.dist ) Game.flags['m'+i+suf].memory.dist = 15;
                    if ( Game.flags['m'+i+suf] && ( Game.creeps['m'+i+suf] !== undefined || Game.creeps['m'+i+suf+'bu'] !== undefined ) && Game.flags['m'+i+suf].memory.dist )  {
                        if ( spawner.room == Game.flags['m'+i+suf].room ) sameRoom = true;
                        var mineDist = Game.flags['m'+i+suf].memory.dist;
                        var maxCarry = Math.floor( ex / 2 + 3 );
                        if ( maxCarry > 32 ) maxCarry = 32;
                        var needCarry = Math.floor( mineDist / 2.2 );
                        var helpers = Math.floor( needCarry / maxCarry ) + 1;
                        if ( helpers > maxHelpers ) helpers = maxHelpers;
                        var eachCarry = Math.floor( needCarry / helpers );
                        if ( eachCarry > maxCarry ) eachCarry = maxCarry;
                        if ( eachCarry < 4 ) eachCarry = 4;
                        var eachMove = Math.floor( ( eachCarry + 1 ) / 2 );
                        if ( Math.random() < .001 ) {
                            var vc = [];  addPart(vc,WORK,1);  addPart(vc,CARRY,eachCarry);  addPart(vc,MOVE,eachMove+1);  // Create just the right bot for the mine...
                        } else {
                            var vc = [];  addPart(vc,CARRY,eachCarry);  addPart(vc,MOVE,eachMove);  // Create just the right bot for the mine...
                        }
                        if ( mineDist < 5 ) helpers = 0;
                        for ( var aid = helpers - 1; aid > -1; aid-- ) {
                            if ( Game.time / ( aid * 3 + 1 ) == Math.floor( Game.time / ( aid * 3 + 1 ) ) ) {
                                if ( aid > 0 ) {
                                    var ref = aid-1;
                                    if ( Game.creeps['m'+i+suf+'c'+ref] !== undefined && Game.creeps['m'+i+suf+'c'+aid] === undefined && spawner.createCreep( vc, 'm'+i+suf+'c'+aid, { role: 'harv', target: 'm'+i+suf } ) === 0 ) continue;
                                } else {
                                    if ( Game.creeps['m'+i+suf+'c'+aid] === undefined && Game.creeps['m'+i+suf+'c'+aid] === undefined && spawner.createCreep( vc, 'm'+i+suf+'c'+aid, { role: 'harv', target: 'm'+i+suf } ) === 0 ) continue;
                                }
                            }
                        }
                    }
                    
                    if ( ( Game.flags['c'+i+suf]   || Game.flags['oc'+i+suf] )   && Game.creeps['c'+i+suf] === undefined ) { if ( spawner.createCreep( c, 'c'+i+suf, { role: 'harv' } ) === 0 ) continue; }
                    if ( ( Game.flags['cs'+i+suf]  || Game.flags['ocs'+i+suf] )  && Game.creeps['cs'+i+suf]  === undefined )  { if ( spawner.createCreep( c, 'cs'+i+suf, { role: 'sup' } ) === 0 ) continue; }
                    if ( ( Game.flags['wc'+i+suf]  || Game.flags['owc'+i+suf] )  && Game.creeps['wc'+i+suf]  === undefined )  { if ( spawner.createCreep( wc, 'wc'+i+suf, { role: 'sup', noExt: true } ) === 0 ) continue; }
                    
                    if ( ( Game.flags['hw'+i+suf]  || Game.flags['ohw'+i+suf] || ( i < Math.floor( spawner.room.memory.storedEnergy / 2500 ) && i < 0 && ( sites.length > 12 || repairSites.length > 24 ) && spawner.room.memory.storedEnergy > 10000 ) ) ) {
                        if ( Game.creeps['chw'+i+suf] === undefined && spawner.createCreep( cc, 'chw'+i+suf, { role: 'sup', target: 'hw'+i+suf } ) === 0 ) continue;
                        if ( Game.creeps['hw'+i+suf] === undefined && spawner.createCreep( hw, 'hw'+i+suf, { role: 'sup' } ) === 0 ) continue;
                    }
                    if ( ( Game.flags['hwx'+i]  || Game.flags['ohwx'+i] ) && Game.creeps['hwx'+i] === undefined ) if ( spawner.createCreep( hwx, 'hwx'+i, { role: 'sup', rally: 'hwx'+i } ) === 0 ) continue;
                    if ( ( Game.flags['rw'+i+suf]  || Game.flags['orw'+i+suf] ) && Game.creeps['rw'+i+suf] === undefined ) if ( spawner.createCreep( rw, 'rw'+i+suf, { role: 'worker' } ) === 0 ) continue;
                    if ( ( Game.flags['wl'+i+suf]  || Game.flags['owl'+i+suf] ) && Game.creeps['wl'+i+suf] === undefined ) if ( spawner.createCreep( w, 'wl'+i+suf, { role: 'worker' } ) === 0 ) continue;
                    if ( ( Game.flags['rm'+i+suf]  || Game.flags['orm'+i+suf] ) && Game.creeps['rm'+i+suf] === undefined ) if ( spawner.createCreep( m, 'rm'+i+suf, { role: 'miner' } ) === 0 ) continue;
                    
                    if ( ( Game.flags['z'+i+suf]  || Game.flags['oz'+i+suf] ) && ( Game.creeps['z'+i+suf] === undefined || Game.creeps['z'+i+suf+'bu'] === undefined ) ) {
                        if ( Game.creeps['z'+i+suf+'bu'] === undefined || Game.creeps['z'+i+suf+'bu'].ticksToLive < 100 ) if ( Game.creeps['z'+i+suf] === undefined ) spawner.createCreep( z, 'z'+i+suf, { rally: 'z'+i+suf, role: 'watcher' } ); 
                        if ( Game.creeps['z'+i+suf] && Game.creeps['z'+i+suf].ticksToLive < 100 ) if ( Game.creeps['z'+i+suf+'bu'] === undefined ) spawner.createCreep( z, 'z'+i+suf+'bu', { rally: 'z'+i+suf, role: 'watcher' } ); 
                    }
                    
                    if ( ( Game.flags['rr'+i]  || Game.flags['orr'+i] || i < Math.floor( unEncSources / 300 ) ) && spawner.room.memory.storedEnergy > minBuild && ( Game.creeps['rr'+i] === undefined || Game.creeps['rr'+i+'bu'] === undefined ) ) {
                        if ( Game.creeps['rr'+i+'bu'] === undefined || Game.creeps['rr'+i+'bu'].ticksToLive < 450 ) if ( Game.creeps['rr'+i] === undefined ) spawner.createCreep( rr, 'rr'+i, { rally: 'rr'+i, role: 'miner' } ); 
                        if ( Game.creeps['rr'+i] && Game.creeps['rr'+i].ticksToLive < 450 ) if ( Game.creeps['rr'+i+'bu'] === undefined ) spawner.createCreep( rr, 'rr'+i+'bu', { rally: 'rr'+i, role: 'miner' } ); 
                    }
                }  
            }
            
            if ( spawner.room.memory.storedEnergy > 2000 || enemies.length > 0 ) {  
                // Minor Siege
                if ( Game.flags.ms && orange( spawner, Game.flags.ms) < 250 ) {
                    if ( Game.creeps.ms1 === undefined && spawner.createCreep( x, 'ms1', { rally: 'ms', rx: 0, ry: 0 } ) === 0 ) continue;
                    if ( Game.creeps.ms2 === undefined && spawner.createCreep( x, 'ms2', { rally: 'ms', rx: 1,  ry: 0 } ) === 0 ) continue;
                    if ( Game.creeps.ms3 === undefined && spawner.createCreep( x, 'ms3', { rally: 'ms', rx: 2,  ry: 0 } ) === 0 ) continue;
                    
                    if ( Game.creeps.ms4 === undefined && spawner.createCreep( axh, 'ms4', { rally: 'ms', rx: 0, ry: 1 } ) === 0 ) continue;
                    if ( Game.creeps.ms5 === undefined && spawner.createCreep( hxh, 'ms5', { rally: 'ms', rx: 1,  ry: 1 } ) === 0 ) continue;
                    if ( Game.creeps.ms6 === undefined && spawner.createCreep( axh, 'ms6', { rally: 'ms', rx: 2,  ry: 1 } ) === 0 ) continue;
                    
                    if ( Game.creeps.ms7 === undefined && spawner.createCreep( xr, 'ms7', { rally: 'ms', rx: 0, ry: 2 } ) === 0 ) continue;
                    if ( Game.creeps.ms8 === undefined && spawner.createCreep( xr, 'ms7', { rally: 'ms', rx: 1,  ry: 2 } ) === 0 ) continue;
                    if ( Game.creeps.ms9 === undefined && spawner.createCreep( xr, 'ms7', { rally: 'ms', rx: 2,  ry: 2 } ) === 0 ) continue;
                }
                     
                // Siege Squad
                if ( Game.flags.siege ) {
                    if ( Game.creeps.g1 === undefined && spawner.createCreep( x, 'g1', { rally: 'siege', rx: 2, ry: -2 } ) === 0 ) continue;
                    if ( Game.creeps.g2 === undefined && spawner.createCreep( x, 'g2', { rally: 'siege', rx: 3, ry: -2 } ) === 0 ) continue;
                    if ( Game.creeps.g3 === undefined && spawner.createCreep( x, 'g3', { rally: 'siege', rx: 4, ry: -2 } ) === 0 ) continue;
                    
                    if ( Game.creeps.h1 === undefined && spawner.createCreep( axh, 'h1', { rally: 'siege', rx: 1, ry: -1 } ) === 0 ) continue;
                    if ( Game.creeps.h2 === undefined && spawner.createCreep( axh, 'h2', { rally: 'siege', rx: 2, ry: -1 } ) === 0 ) continue;
                    if ( Game.creeps.h3 === undefined && spawner.createCreep( hxh, 'h3', { rally: 'siege', rx: 3, ry: -1 } ) === 0 ) continue;
                    if ( Game.creeps.h4 === undefined && spawner.createCreep( axh, 'h4', { rally: 'siege', rx: 4, ry: -1 } ) === 0 ) continue;
                    if ( Game.creeps.h5 === undefined && spawner.createCreep( axh, 'h5', { rally: 'siege', rx: 5, ry: -1 } ) === 0 ) continue;

                    if ( Game.creeps.r1 === undefined && spawner.createCreep( xr, 'r1', { rally: 'siege', rx: 0, ry: 0 } ) === 0 ) continue;
                    if ( Game.creeps.r2 === undefined && spawner.createCreep( xr, 'r2', { rally: 'siege', rx: 1, ry: 0 } ) === 0 ) continue;
                    if ( Game.creeps.r3 === undefined && spawner.createCreep( xr, 'r3', { rally: 'siege', rx: 2, ry: 0 } ) === 0 ) continue;
                    if ( Game.creeps.r4 === undefined && spawner.createCreep( xr, 'r4', { rally: 'siege', rx: 3, ry: 0 } ) === 0 ) continue;
                    if ( Game.creeps.r5 === undefined && spawner.createCreep( xr, 'r5', { rally: 'siege', rx: 4, ry: 0 } ) === 0 ) continue;
                    if ( Game.creeps.r6 === undefined && spawner.createCreep( xr, 'r6', { rally: 'siege', rx: 5, ry: 0 } ) === 0 ) continue;
                    if ( Game.creeps.r7 === undefined && spawner.createCreep( xr, 'r7', { rally: 'siege', rx: 6, ry: 0 } ) === 0 ) continue;
                }
                     
                // Military Creeps
                for ( var i = 0; i < 16; i++ ) {
                    // Clear a source of energy, cost 15,000 per 1,500s
                    if ( ( spawner.room.memory.storedEnergy > minBuild && ex > 100 ) && ( Game.flags['qm'+i] || Game.flags['oqm'+i] ) && Game.flags['qm'+i+'x'] === undefined && orange( spawner, Game.flags['oqm'+i] ) < 80 ) {  
                        var targetRoom = null;
                        if ( Game.flags['qm'+i] ) targetRoom = Game.flags['qm'+i].room;
                        if ( !targetRoom && Game.flags['oqm'+i] ) targetRoom = Game.flags['oqm'+i].room;
                        if ( targetRoom && targetRoom.memory.mil > 0 ) {
                            for ( var ii = 2 + Math.floor( targetRoom ? targetRoom.memory.totalEnergy / 7500 : 0 ); ii > -1; ii-- ) { if ( targetRoom && targetRoom.memory.totalEnergy > 2000 && Game.creeps['c'+i+'qmc'+ii] === undefined && spawner.createCreep( cch, 'c'+i+'qmc'+ii, { rally: 'qm'+i, role: 'harv' } ) === 0 ) continue; }
                            for ( var ii = 0; ii < 1; ii++ ) {
                                if ( Game.creeps['rr'+i+'qm'+ii+'bu'] === undefined || Game.creeps['rr'+i+'qm'+ii+'bu'].ticksToLive < 250 ) if ( Game.creeps['rr'+i+'qm'+ii] === undefined ) spawner.createCreep( rrh, 'rr'+i+'qm'+ii, { rally: 'qm'+i, role: 'miner' } ); 
                                if ( Game.creeps['rr'+i+'qm'+ii] && Game.creeps['rr'+i+'qm'+ii].ticksToLive < 250 ) if ( Game.creeps['rr'+i+'qm'+ii+'bu'] === undefined ) spawner.createCreep( rrh, 'rr'+i+'qm'+ii+'bu', { rally: 'qm'+i, role: 'miner' } ); 
                            }
                        }
                        if ( Game.creeps['a'+i+'qm1'] === undefined || Game.creeps['a'+i+'qm1'].ticksToLive < 300 ) {
                            if ( Game.creeps['a'+i+'qm0'] === undefined ) if ( spawner.createCreep( axhh, 'a'+i+'qm0',  { rally: 'qm'+i } ) === 0 ) continue;
                        }
                        if ( Game.creeps['a'+i+'qm0'] !== undefined && Game.creeps['a'+i+'qm0'].ticksToLive < 300 ) {
                            if ( Game.creeps['a'+i+'qm1'] === undefined ) if ( spawner.createCreep( axhh, 'a'+i+'qm1', { rally: 'qm'+i } ) === 0 ) continue;
                        }
                    }
    
                    if ( ( Game.flags['qc'+i] || Game.flags['oqc'+i] ) && Game.flags['qc'+i+'x'] === undefined ) {  
                        for ( var ii = 0; ii < i + 1; ii++ ) { if ( Game.creeps['c'+i+'qc'+ii] === undefined ) if ( spawner.createCreep( c, 'c'+i+'qc'+ii, { rally: 'qc'+i, role: 'harv' } ) === 0 ) continue; }
                    }

                    if ( ( Game.flags['t'+i+suf] || Game.flags['ot'+i+suf] ) && Game.flags['t'+i+suf+'x'] === undefined && spawner.room.storage.store.energy > 75000 ) {  
                        for ( var ii = 0; ii < i + 1; ii++ ) { if ( Game.creeps['t'+i+'c'+ii+suf] === undefined ) if ( spawner.createCreep( c, 't'+i+'c'+ii+suf, { rally: 't'+i+suf, role: 'trans' } ) === 0 ) continue; }
                    }
    
                    // Attack Squad
                    if ( Game.flags['q'+i] || Game.flags['oq'+i] ) {  
                        if ( Game.creeps['a'+i+'q0b'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'q0b', { escort: 'a'+i+'q0', rally: 'q'+i } ) === 0 ) continue;
                        if ( Game.creeps['a'+i+'q0a'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'q0a', { escort: 'a'+i+'q0', rally: 'q'+i } ) === 0 ) continue;
                        if ( Game.creeps['a'+i+'q0'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'q0',  { rally: 'q'+i } ) === 0 ) continue;
                        if ( Game.creeps['a'+i+'q0'] && Game.creeps['a'+i+'q0'].ticksToLive < 450 ) {
                            if ( Game.creeps['a'+i+'q1b'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'q1b', { escort: 'a'+i+'q1', rally: 'q'+i } ) === 0 ) continue;
                            if ( Game.creeps['a'+i+'q1a'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'q1a', { escort: 'a'+i+'q1', rally: 'q'+i } ) === 0 ) continue;
                            if ( Game.creeps['a'+i+'q1'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'q1', { rally: 'q'+i } ) === 0 ) continue;
                        }
                    }
                    
                    // Light Attack Squad
                    if ( Game.flags['ql'+i] || Game.flags['oql'+i] ) {  
                        if ( Game.creeps['a'+i+'ql0b'] === undefined ) if ( spawner.createCreep( hxl, 'a'+i+'ql0b', { escort: 'a'+i+'ql0', rally: 'ql'+i } ) === 0 ) continue;
                        if ( Game.creeps['a'+i+'ql0a'] === undefined ) if ( spawner.createCreep( axl, 'a'+i+'ql0a', { escort: 'a'+i+'ql0', rally: 'ql'+i } ) === 0 ) continue;
                        if ( Game.creeps['a'+i+'ql0'] === undefined ) if ( spawner.createCreep( gxl, 'a'+i+'ql0',  { rally: 'ql'+i } ) === 0 ) continue;
                        if ( Game.creeps['a'+i+'ql0'] && Game.creeps['a'+i+'ql0'].ticksToLive < 450 ) {
                            if ( Game.creeps['a'+i+'ql1b'] === undefined ) if ( spawner.createCreep( hxl, 'a'+i+'ql1b', { escort: 'a'+i+'ql1', rally: 'ql'+i } ) === 0 ) continue;
                            if ( Game.creeps['a'+i+'ql1a'] === undefined ) if ( spawner.createCreep( axl, 'a'+i+'ql1a', { escort: 'a'+i+'ql1', rally: 'ql'+i } ) === 0 ) continue;
                            if ( Game.creeps['a'+i+'ql1'] === undefined ) if ( spawner.createCreep( gxl, 'a'+i+'ql1', { rally: 'ql'+i } ) === 0 ) continue;
                        }
                    }
                    
                    if ( Game.flags['xx'+i] || Game.flags['oxx'+i] ) {  
                        if ( spawner.createCreep( x, 'xx'+i+'x0', { rally: 'xx'+i } ) === 0 ) continue;
                        if ( spawner.createCreep( x, 'xx'+i+'x1', { rally: 'xx'+i } ) === 0 ) continue;
                        if ( spawner.createCreep( x, 'xx'+i+'x2', { rally: 'xx'+i } ) === 0 ) continue;
                        if ( spawner.createCreep( x, 'xx'+i+'x3', { rally: 'xx'+i } ) === 0 ) continue;
                        if ( spawner.createCreep( x, 'xx'+i+'x4', { rally: 'xx'+i } ) === 0 ) continue;
                    }
                    
                    if ( ( Game.flags['axh'+i]  || Game.flags['oaxh'+i] ) && Game.creeps['axh'+i]  === undefined )  { if ( spawner.createCreep( axh, 'axh'+i ) === 0 ) continue; }
                    if ( ( Game.flags['hxh'+i]  || Game.flags['ohxh'+i] ) && Game.creeps['hxh'+i]  === undefined )  { if ( spawner.createCreep( hxh, 'hxh'+i ) === 0 ) continue; }
                    if ( ( Game.flags['x'+i+suf]  || Game.flags['ox'+i+suf] ) && Game.creeps['x'+i+suf]  === undefined && spawner.room.memory.storedEnergy > minBuild )  { if ( spawner.createCreep( x, 'x'+i+suf ) === 0 ) continue; }
                    if ( ( Game.flags['y'+i+suf]  || Game.flags['oy'+i+suf] ) && Game.creeps['y'+i+suf]  === undefined && spawner.room.memory.storedEnergy > minBuild )  { if ( spawner.createCreep( axh, 'y'+i+suf ) === 0 ) continue; }
                    if ( ( Game.flags['xh'+i+suf]  || Game.flags['oxh'+i+suf] ) && Game.creeps['xh'+i+suf]  === undefined )  { if ( spawner.createCreep( xh, 'xh'+i+suf ) === 0 ) continue; }
                    if ( ( Game.flags['xr'+i+suf]  || Game.flags['oxr'+i+suf] ) && Game.creeps['xr'+i+suf]  === undefined )  { if ( spawner.createCreep( xr, 'xr'+i+suf ) === 0 ) continue; }
                    if ( ( Game.flags['g'+i+suf]  || Game.flags['og'+i+suf] ) && Game.creeps['g'+i+suf]  === undefined )  { if ( spawner.createCreep( g, 'g'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['h'+i+suf]  || Game.flags['oh'+i+suf] ) && Game.creeps['h'+i+suf]  === undefined )  { if ( spawner.createCreep( h, 'h'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['a'+i+suf]  || Game.flags['oa'+i+suf] ) && Game.creeps['a'+i+suf]  === undefined )  { if ( spawner.createCreep( a, 'a'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['gl'+i+suf]  || Game.flags['ogl'+i+suf] ) && Game.creeps['gl'+i+suf]  === undefined )  { if ( spawner.createCreep( gxl, 'gl'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['hxl'+i+suf]  || Game.flags['ohxl'+i+suf] ) && Game.creeps['hxl'+i+suf]  === undefined )  { if ( spawner.createCreep( hxl, 'hxl'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['al'+i+suf]  || Game.flags['oal'+i+suf] ) && Game.creeps['al'+i+suf]  === undefined )  { if ( spawner.createCreep( axl, 'al'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    
                    if ( Game.flags['t'+i+suf] && Game.creeps['t'+i+suf] === undefined ) { if ( spawner.createCreep( t, 't'+i+suf ) === 0 ) continue; }
                    if ( Game.flags['b'+i+suf] && Game.creeps['b'+i+suf] === undefined || ( firepower < hostility / 2 && i < 3 && hostility > 5 && i < enemies.length / 2 ) ) { if ( spawner.createCreep( b, 'b'+i+suf ) === 0 ) continue; }
                }  
            }
            
            // Pipeline Creeps
            for ( var i = 0; i < 24; i++ ) {
                if ( Game.flags['p'+i+suf] && Game.creeps['p'+i+suf] === undefined ) { if ( spawner.createCreep( l, 'p'+i+suf, { role: 'sup', lift: i+1 } ) === 0 ) continue; }
                if ( Game.flags['l'+i+suf] && Game.creeps['l'+i+suf] === undefined ) { if ( spawner.createCreep( l, 'l'+i+suf, { role: 'sup', lift: i+1 } ) === 0 ) continue; }
                if ( Game.flags['o'+i+suf] && Game.creeps['o'+i+suf] === undefined ) { if ( spawner.createCreep( o, 'o'+i+suf, { share: i+1 } ) === 0 ) continue; }
            }

            // High Priority Creeps
            var hwrole = 'sup';
            if ( !minersGood ) hwrole = 'harv';
            if ( spawner.memory.friends > 4 && infrastructureSupport ) {
                if ( Game.creeps['chw'+spawner.room.name] === undefined && spawner.createCreep( cc, 'chw'+spawner.room.name, { role: 'sup', target: 'hw'+spawner.room.name } ) === 0 ) continue;
                if ( Game.creeps['hw'+spawner.room.name] === undefined && spawner.createCreep( sw, 'hw'+spawner.room.name, { role: hwrole } ) === 0 ) continue;
            }
            if ( ( Game.flags['hw'+suf] || spawner.room.memory.hre.length > 36 || spawner.room.memory.co.length > 24 ) && totalStored > 2000000 && 1 == 2 ) {
                if ( Game.creeps['chw'+suf] === undefined && spawner.createCreep( cc, 'chw'+suf, { role: 'sup', target: 'hw'+suf } ) === 0 ) continue;
                if ( Game.creeps['hw'+suf] === undefined && spawner.createCreep( hw, 'hw'+suf, { role: hwrole } ) === 0 ) continue;
            }
            for ( var i = 0; i < 60; i ++ ) {
                // Roving Haulers
                if ( Game.creeps['c'+i] === undefined && spawner.room.memory.storedEnergy > minBuild && avail > i * 20000 + 70000 ) { if ( spawner.createCreep( c, 'c'+i, { role: 'harv' } ) === 0 ) continue; }
            }
            for ( var i = 0; i < 12; i++ ) {
                if ( ( Game.flags['w'+i+suf] || Game.flags['ow'+i+suf] ) && Game.creeps['w'+i+suf]  === undefined ) if ( spawner.createCreep( w, 'w'+i+suf, { role: 'worker' } ) === 0 ) continue;
                if ( Game.flags['osw'+i+suf] && Game.creeps['sw'+i+suf]  === undefined && ( Game.flags['osw'+i+suf].room.memory.hre.length > 0 || Game.flags['osw'+i+suf].room.memory.co.length > 0 ) ) if ( spawner.createCreep( sw, 'sw'+i+suf, { role: 'worker', rally: 'sw'+i+suf } ) === 0 ) continue;
                if ( ( Game.flags['v'+i+suf] || Game.flags['ov'+i+suf] ) && Game.creeps['v'+i+suf]  === undefined && spawner.room.memory.storedEnergy > 750000 + i * 50000 ) if ( spawner.createCreep( w, 'v'+i+suf, { role: 'worker' } ) === 0 ) continue;
                if ( Game.flags['ovc'+i+suf] && Game.creeps['v'+i+suf] && Game.creeps['vc'+i+suf] === undefined ) if ( spawner.createCreep( cc, 'vc'+i+suf, { role: 'sup', noExt: true } ) === 0 ) continue;
                if ( Game.flags['lw'+i+suf]  || Game.flags['olw'+i+suf] ) if ( spawner.createCreep( lw, 'lw'+i+suf, { role: 'worker' } ) === 0 ) continue;
                if ( Game.flags['lh'+i+suf]  || Game.flags['olh'+i+suf] ) if ( spawner.createCreep( lh, 'lh'+i+suf ) === 0 ) continue;
                if ( Game.flags['lg'+i+suf]  || Game.flags['olg'+i+suf] ) if ( spawner.createCreep( lg, 'lg'+i+suf ) === 0 ) continue;
                if ( Game.flags['gg'+i+suf]  || Game.flags['ogg'+i+suf] ) if ( spawner.createCreep( giver, 'gg'+i+suf, { role: 'trans' } ) === 0 ) continue;
                if ( Game.flags['lcs'+i+suf]  || Game.flags['olcs'+i+suf] ) if ( spawner.createCreep( lcs, 'lcs'+i+suf, { role: 'sup' } ) === 0 ) continue;
                if ( Game.flags['la'+i+suf]  || Game.flags['ola'+i+suf] ) if ( spawner.createCreep( la, 'la'+i+suf ) === 0 ) continue;
                if ( Game.flags['s'+i+suf] && Game.creeps['s'+i+suf] === undefined ) if ( spawner.createCreep( s, 's'+i+suf, { role: 'storage' } ) === 0 ) continue;
                if ( ( Game.flags['m'+i+suf] ) && enemies.length == 0 ) {
                    // console.log( spawner.name + ' ' + 'm'+i+suf);
                    var whatminer = m;
                    if ( spawner.room == Game.flags['m'+i+suf].room ) whatminer = lm;
                    
                    // Miners with backup bots
                    var dist = 50;
                    if ( Game.flags['m'+i+suf] && Game.flags['m'+i+suf].memory.dist !== undefined ) dist = Game.flags['m'+i+suf].memory.dist;
                    if ( Game.creeps['m'+i+suf] === undefined && ( Game.creeps['m'+i+suf+'bu'] === undefined || Game.creeps['m'+i+suf+'bu'].ticksToLive < dist * 1.2 + 40 ) ) if ( spawner.createCreep( whatminer, 'm'+i+suf, { role: 'miner', accum: 1 } ) === 0 ) continue;
                    if ( Game.creeps['m'+i+suf+'bu'] === undefined && ( Game.creeps['m'+i+suf] !== undefined && Game.creeps['m'+i+suf].ticksToLive < dist * 1.2 + 40 ) ) if ( spawner.createCreep( whatminer, 'm'+i+suf+'bu', { role: 'miner', accum: 1, rally: 'm'+i+suf } ) === 0 ) continue;
                }
                if ( ( Game.flags['b'+i+suf] || ( enemies.length > 0 && i < 1 ) ) && Game.creeps['b'+i+suf] === undefined ) { if ( spawner.createCreep( b, 'b'+i+suf ) === 0 ) continue; }
                if ( ( Game.flags['lc'+i+suf] || Game.flags['olc'+i+suf] ) && Game.creeps['lc'+i+suf] === undefined ) { if ( spawner.createCreep( lc, 'lc'+i+suf, { role: 'harv' } ) === 0 ) continue; }
                if ( ( Game.flags['cs'+i+suf] && Game.creeps['cs'+i+suf] === undefined ) || ( i < 1 && i < eex / 20 && spawner.memory.friends > 4 ) ) if ( spawner.createCreep( wc, 'cs'+i+suf, { role: 'sup' } ) === 0 ) continue;
                if ( ( Game.flags['cs'+i+suf] && Game.creeps['cs'+i+suf] === undefined ) || ( i < 1 && ex > 20 && spawner.memory.friends < 5 ) ) if ( spawner.createCreep( lcs, 'cs'+i+suf, { role: 'sup' } ) === 0 ) continue;
            }
            if ( ( Game.flags['s'+suf] && Game.creeps['s'+suf] === undefined ) || ( spawner.memory.friends > 2 && !spawner.room.storage ) ) if ( spawner.createCreep( s, 's'+suf, { role: 'storage' } ) === 0 ) continue;
        } else spawner.memory.spawnLag = 0; 
    }
    cpuS = Game.getUsedCpu() - cpuS;
    if ( cpuS > 75 ) console.log( 'Spawners took ' + cpuS );
}

function rSlow( title ) {
    if ( !Memory.rSlow || Memory.rSlow > Game.getUsedCpu() ) { Memory.rSlow = 0; Memory.prevTitle = 'Beginning'; }
    
    var dif = Game.getUsedCpu() - Memory.rSlow;
    
    if ( dif > rLevel && Memory.prevTitle.substring(0,9) != 'Beginning' ) { console.log( Memory.prevTitle + ' ' + Math.floor( dif * 100 ) / 100 ); }
    
    var saveTitle = Memory.prevTitle.substring(Memory.prevTitle.indexOf(' ')+1,Memory.prevTitle.length);

    if ( !Memory.cpuByRSlow[saveTitle] ) Memory.cpuByRSlow[saveTitle] = 0;
    Memory.cpuByRSlow[saveTitle] += dif; 

    Memory.rSlow = Game.getUsedCpu();
    Memory.prevTitle = title;
}

function rC() {
    cpuC = Game.getUsedCpu();
    for(var name in Game.creeps) {
    	var creep = Game.creeps[name];
    	var rm = creep.room.memory;
    	
    	startCpu = Game.getUsedCpu();
    	rSlow( creep.name + ' Start' );
    	
    	// Fast Mode Processing
    	if ( creep.memory.mine !== undefined && creep.memory.role != 'harv' && creep.pos.inRangeTo( Game.getObjectById( creep.memory.mine ), 1 ) ) { creep.harvest( Game.getObjectById( creep.memory.mine ) ); logCpu( creep ); continue; } else creep.memory.mine = undefined;

        // Identify Military Units
    	if ( creep.getActiveBodyparts( ATTACK ) || creep.getActiveBodyparts( RANGED_ATTACK ) || creep.getActiveBodyparts( HEAL ) > 1 ) { creep.memory.mil = true; creep.room.memory.mil = 1; } else creep.memory.mil = false;
    	
        // Skips bots under constructions, report military creeps
    	if ( creep.spawning ) {
    	    if ( Game.time / 12 == Math.floor( Game.time /12 ) && creep.memory.mil ) console.log( creep.name + ' being built!');
    	    continue;
    	}
    	
    	// Kill extraneous creeps
    	if ( creep.name.substring(0,1) == 'l' && creep.memory.lift && creep.carry.energy == 0 ) creep.suicide();
    	if ( Game.flags.kill && creep.pos.inRangeTo( Game.flags.kill, 0 ) ) { creep.suicide(); Game.flags.kill.remove(); }

    	// Skip bots if necessary to save cpu, hopefully never
    	if ( !creep.memory.mil && creep.getActiveBodyparts( WORK ) < 5 && Game.getUsedCpu() > Game.cpuLimit - skipCpuLevel ) { Memory.skips = Memory.skips + 1; logCpu( creep ); continue; } 
        if ( !creep.memory.mil && Game.cpuLimit < 500 ) { Memory.skips = Memory.skips + 1; logCpu( creep ); continue; } 
        if ( creep.memory.role == 'sup' && Game.getUsedCpu() > Game.cpuLimit - supStop ) { Memory.skips = Memory.skips + 1; logCpu( creep ); continue; } 
        if ( creep.memory.role == 'harv' && Game.getUsedCpu() > Game.cpuLimit - harvStop ) { Memory.skips = Memory.skips + 1; logCpu( creep ); continue; } 
    	if ( !creep.memory.mil && creep.getActiveBodyparts( WORK ) < 2 && creep.fatigue > 0 ) { logCpu( creep ); continue; } 
    	
    	// Do I want to pick up energy?
    	creep.memory.wantEnergy = true;
    	if ( creep.memory.role == 'trans' && Game.flags['o'+creep.memory.rally] && Game.flags['o'+creep.memory.rally].room == creep.room ) creep.memory.wantEnergy = false;
    	if ( creep.memory.role == 'worker' && Game.flags['o'+creep.name] && Game.flags['o'+creep.name].room != creep.room ) creep.memory.wantEnergy = false;

        // if ( ( creep.pos.x == 49 || creep.pos.x == 0 || creep.pos.y == 49 || creep.pos.y == 0 ) && creep.pos.findInRange( FIND_MY_CREEPS, 1 ).length > 1 ) {
            // if ( creep.room.memory.gridlockBeaker ) creep.room.memory.gridlockBreaker = false; else m( creep, creep );
        // }

    	rSlow( creep.name + ' Hostile calcs' );
        // Hostile Creeps
        if ( creep.room.memory.hos.length > 0 ) {
            var hos = creep.room.memory.hos;
            var hostiles = hos.length;    	
            if ( creep.memory.mil ) var hspawns = creep.room.find( FIND_HOSTILE_SPAWNS ); else var hspawns = null;
        } else { var hos = [], hostiles = 0, hspawns = null; }
        
    	rSlow( creep.name + ' Energy calcs' );
        // Energy calculations
        creep.memory.storedEnergy = creep.memory.storedEnergy < 0 ? creep.memory.storedEnergy * -1 : 0;
    	if ( creep.room.storage && orange( creep, creep.room.storage ) < 2 ) creep.memory.storedEnergy = creep.memory.storedEnergy + Math.floor( creep.room.storage.store.energy / 10 );

    	rSlow( creep.name + ' Base calcs' );
    	
    	// Base Calculations
    	if ( !creep.memory.saveBase || !Game.getObjectById( creep.memory.saveBase ) ) {
    	    var base = null;
        	if ( creep.room.storage !== undefined && creep.room.storage.owner.username == 'Vision' && creep.room.storage.store.energy < storageLevel ) { base = creep.room.storage;  }
        	// if ( !base ) base = creep.pos.findClosestByRange( FIND_MY_SPAWNS );
    	    if ( !base ) base = whatBase( creep );
    	    if ( !base ) base = Game.spawns[creep.memory.spawn];
    	    if ( !base ) base = Game.spawns.g;
    	    creep.memory.saveBase = base.id;
    	} else base = Game.getObjectById( creep.memory.saveBase );
        var suf = '';
        suf = base.name;

        // Determine my point of origin
        if ( !creep.memory.spawn && creep.pos.findClosestByRange( FIND_MY_SPAWNS ) ) creep.memory.spawn = creep.pos.findClosestByRange( FIND_MY_SPAWNS ).name;
        if ( !creep.memory.dist ) creep.memory.dist = 1;
        var ex = 0;
        if ( Game.spawns[creep.memory.spawn]  ) ex = Game.spawns[creep.memory.spawn].memory.ex;
        
        var rampartlevel = 5000;
        if ( base.room ) rampartlevel = base.room.controller.level * base.room.controller.level * rampartMult;
        if ( rampartlevel < 5000 ) rampartlevel = 5000;

    	rSlow( creep.name + ' Unit calcs' );
        // Unit Calculations
        var interval = creep.memory.spr - 2;
        if ( interval > 50 ) interval = 50;
        if ( interval < 4 ) interval = 4;
        if ( creep.memory.spr < 4 || creep.ticksToLive / interval == Math.floor( creep.ticksToLive / interval ) ) {
    	    var nearestSpawner = creep.pos.findClosestByRange( FIND_MY_SPAWNS );
    	    if ( nearestSpawner ) creep.memory.spr = range( creep.pos.x, creep.pos.y, nearestSpawner.pos.x, nearestSpawner.pos.y ); else creep.memory.spr = 99;
        }
    	
    	if ( hostiles > 0 ) var nearestEnemy = creep.pos.findClosestByRange( FIND_HOSTILE_CREEPS, { filter: function(object) { return object.hitsMax < maxHostile && ( object.getActiveBodyparts( ATTACK ) || object.getActiveBodyparts( RANGED_ATTACK ) ) && allies.indexOf( object.owner.username ) < 0;  } } ); else var nearestEnemy = null;
    	if ( nearestEnemy ) creep.memory.er = range( creep.pos.x, creep.pos.y, nearestEnemy.pos.x, nearestEnemy.pos.y ); else creep.memory.er = 99;
    	
        if ( creep.room.memory.li && creep.room.memory.li.length > 0 ) {
            var link = null, maxR = 99;
            for ( var i = 0; i < creep.room.memory.li.length; i++ ) { if ( creep.pos.inRangeTo( Game.getObjectById( creep.room.memory.li[i] ), 1 ) && Game.getObjectById( creep.room.memory.li[i] ).energy > 0 ) { link = Game.getObjectById( creep.room.memory.li[i] ); break; } }
        } else link = null;
	    if ( link ) creep.memory.linked = true; else creep.memory.linked = false;

        if ( creep.room.memory.lairs > 0 ) {
        	var lair = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_KEEPER_LAIR && object.ticksToSpawn < 10; } } );
        	var attlair = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_KEEPER_LAIR && object.ticksToSpawn < 60; } } );
        	if ( lair && orange( creep, lair ) < creep.memory.er ) { creep.memory.er = orange( creep, lair ); nearestEnemy = lair; }
        	if ( attlair && orange( creep, attlair ) < creep.memory.er && creep.memory.mil ) { creep.memory.er = orange( creep, attlair ); nearestEnemy = attlair; }
        } else { var lair = null, attlair = null; }

        if ( !creep.memory.noNotice && nearestEnemy && nearestEnemy.hitsMax > 4500 ) { creep.notifyWhenAttacked( false ); creep.memory.noNotice = true; }

        if ( creep.memory.stayHere && creep.memory.stayHere > 0 ) if ( creep.carry.energy == 0 ) creep.memory.stayHere = 0; else  creep.memory.stayHere = creep.memory.stayHere - 1;
    	creep.memory.moveOrder = 0;
    	if ( creep.memory.lastpos === undefined ) creep.memory.lastpos = creep.pos;
    	if ( creep.memory.returnToBase === undefined || creep.carry.energy == 0 || ( creep.room != base.room && creep.carry.energy < creep.carryCapacity / 2 ) ) creep.memory.returnToBase = false;

    	rSlow( creep.name + ' Fire Con' );
        // Fire if possible
    	var target = null, creepFiring = false, creepAttacking = false, closeRange = false;
        if ( creep.getActiveBodyparts(RANGED_ATTACK) > 0 ) {
            var select = -1, targetNeed = -1, need = 0, target = null;
            for( var i=0; i < hostiles; i++ ) {
                if ( hos[i].pos.inRangeTo( creep, 3 ) ) {
                    need = hos[i].hitsMax - hos[i].hits + hos[i].getActiveBodyparts( ATTACK ) * 50 + hos[i].getActiveBodyparts( HEAL ) * 100 + hos[i].getActiveBodyparts( RANGED_ATTACK ) * 25;
                    if ( hos[i].pos.inRangeTo( creep, 1) ) closeRange = true;
                    if ( need > targetNeed ) { targetNeed = need; select = i; }
                }
            }
            if ( select > -1 ) target = hos[select];
            
            if ( !target && creep.pos.findInRange( FIND_HOSTILE_SPAWNS, 3 ).length > 0 ) { target = creep.pos.findClosestByRange( FIND_HOSTILE_SPAWNS ); if ( target.pos.inRangeTo( creep, 1 ) ) closeRange = true; }

            // Attack weakest nearby structure
            if ( creep.pos.findInRange( FIND_MY_SPAWNS, 99 ).length == 0 ) {
                var targets = creep.pos.findInRange( FIND_STRUCTURES, 3, { filter: function(object) { return object.structureType != STRUCTURE_ROAD; } } );
                var select = -1, targetNeed = 99999999;
                
                for( var i=0; i<targets.length; i++ ) {
                    if ( targets[i].pos.inRangeTo( creep, 1 ) && targets[i].structureType != STRUCTURE_WALL && targets[i].structureType != STRUCTURE_KEEPER_LAIR && targets[i].structureType != STRUCTURE_ROAD ) closeRange = true;
                    if ( targets[i].hits && targets[i].hits < targetNeed ) { targetNeed = targets[i].hits; select = i; }
                }
                if ( !target && select > -1 ) target = targets[select];
            }
            
            // Attack weakest nearby structure
            if ( creep.pos.findInRange( FIND_MY_SPAWNS, 99 ).length == 0 ) {
                var targets = creep.pos.findInRange( FIND_STRUCTURES, 3, { filter: function(object) { return object.structureType != STRUCTURE_KEEPER_LAIR && object.structureType != STRUCTURE_ROAD && object.structureType != STRUCTURE_WALL; } } );
                var select = -1, targetNeed = 99999999;
                
                for( var i=0; i<targets.length; i++ ) {
                    if ( targets[i].pos.inRangeTo( creep, 1 ) && targets[i].structureType != STRUCTURE_WALL ) closeRange = true;
                    if ( targets[i].hits && targets[i].hits < targetNeed ) { targetNeed = targets[i].hits; select = i; }
                }
                if ( !target && select > -1 ) target = targets[select];
            }
            
            if ( target ) {
                if ( target.owner && allies.indexOf( target.owner.username ) > -1 ) {
                    creep.say( 'ignoring' );
                } else {
                    creepFiring = true;
                    if ( closeRange ) creep.rangedMassAttack(); else creep.rangedAttack( target );
                }
            }
        }
        
        // Attack if possible
        if ( creep.getActiveBodyparts(ATTACK) > 0 ) {
            var select = -1, targetNeed = -1, need = 0, target = null;
            for( var i=0; i<hostiles; i++ ) {
                if ( hos[i].pos.inRangeTo( creep, 1 ) ) {
                    need = hos[i].hitsMax - hos[i].hits + hos[i].getActiveBodyparts( ATTACK ) * 50 + hos[i].getActiveBodyparts( HEAL ) * 100 + hos[i].getActiveBodyparts( RANGED_ATTACK ) * 25;
                    if ( need > targetNeed ) { targetNeed = need; select = i; }
                }
            }
            if ( select > -1 ) target = hos[select];

            if ( !target && creep.pos.findInRange( FIND_HOSTILE_SPAWNS, 1 ).length > 0 ) target = creep.pos.findClosestByRange( FIND_HOSTILE_SPAWNS );
            
            // Attack weakest nearby structure
            if ( !target && creep.pos.findInRange( FIND_MY_SPAWNS, 99 ).length == 0 ) {
                var targets = creep.pos.findInRange( FIND_HOSTILE_STRUCTURES, 1 );
                var select = -1, targetNeed = 99999999, target = null;
                
                for( var i=0; i<targets.length; i++ ) {
                    if ( targets[i].hits && targets[i].hits < targetNeed ) { targetNeed = targets[i].hits; select = i; }
                }
                if ( select > -1 ) target = targets[select];
            }
            
            // Attack weakest nearby structure
            if ( !target && creep.pos.findInRange( FIND_MY_SPAWNS, 99 ).length == 0 ) {
                var targets = creep.pos.findInRange( FIND_STRUCTURES, 1, { filter: function(object) { return object.structureType != STRUCTURE_ROAD; } } );
                var select = -1, targetNeed = 99999999, target = null;
                
                for( var i=0; i<targets.length; i++ ) {
                    if ( targets[i].hits && targets[i].hits < targetNeed ) { targetNeed = targets[i].hits; select = i; }
                }
                if ( select > -1 ) target = targets[select];
            }
            
            // Attack weakest nearby enemy construction site
            if ( !target ) {
                var targets = creep.pos.findInRange( FIND_CONSTRUCTION_SITES, 1, { filter: function(object) { return object.owner != creep.owner; } } );
                var select = -1, targetNeed = 99999999, target = null;
                
                for( var i=0; i<targets.length; i++ ) {
                    if ( targets[i].progress && targets[i].progress < targetNeed ) { targetNeed = targets[i].progress; select = i; }
                }
                if ( select > -1 ) target = targets[select];
            }
            
            if ( target ) {
                if ( target.owner && allies.indexOf( target.owner.username ) > -1 ) {
                    creep.say( 'ignoring' );
                } else {
                    creepAttacking = true;
                    creep.attack( target );
                }
            }
        }
        
    	rSlow( creep.name + ' Work calcs' );
        // Work if possible
        if ( creep.getActiveBodyparts(WORK) > 0 ) {
            var source = null;
            if ( creep.memory.role != 'harv' ) {
                // Cache
                if ( creep.memory.sourceCache && orange( creep, Game.getObjectById( creep.memory.sourceCache ) ) < 2 ) source = Game.getObjectById( creep.memory.sourceCache ); else {
                    creep.memory.sourceCache = null;
                    for ( var i = 0; i < rm.so.length; i++ ) {
                        var src = Game.getObjectById( rm.so[i] );
                        if ( orange( creep, src ) < 2 ) { source = src; creep.memory.sourceCache = source.id; break; }
                    } 
                }
            }
            if ( source && source.energy > 0 && creep.memory.role != 'harv' ) { 
                creep.harvest( source ); 
                creep.memory.gridlock = 0; 
        	    if ( creep.getActiveBodyparts( WORK ) < 8 && ( Game.flags[creep.name] && Game.flags[creep.name].pos.inRangeTo(creep,0) || Game.flags[creep.memory.rally] && Game.flags[creep.memory.rally].pos.inRangeTo(creep,0) ) ) creep.memory.mine = source.id; else creep.memory.mine = undefined;
            } else {
                if ( creep.carry.energy > 0 ) {
                    if ( creep.memory.role != 'harv' && creep.carry.energy > creep.getActiveBodyparts( WORK ) * 1.5 ) {
                        // May I help another worker with some energy?
                        var helpee = null;
                        for ( var i = 0; i < rm.wo.length; i++ ) { var worker = Game.getObjectById( rm.wo[i] ); if ( orange( creep, worker ) < 2 && worker.memory.role != 'harv' && worker.carry.energy < creep.getActiveBodyparts( WORK ) ) helpee = worker; }
                        // var helpee = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.carry.energy < creep.getActiveBodyparts( WORK ) && object.getActiveBodyparts( WORK ) > 0 && object.pos.inRangeTo( creep, 1); } } );
                        if ( helpee ) creep.transferEnergy( helpee, creep.carry.energy / 2 );
                    }

                    // Construct?
                    var target = null;
                    if ( creep.memory.buildCache && Game.getObjectById( creep.memory.buildCache ) && orange( creep, Game.getObjectById( creep.memory.buildCache ) ) < 2 ) target = Game.getObjectById( creep.memory.buildCache ); else {
                        creep.memory.buildCache = null;
                        if ( rm.co.length > 0 ) for( var i = 0; i < rm.co.length; i++ ) { if ( creep.pos.inRangeTo( Game.getObjectById( rm.co[i] ), 1 ) && ( Game.getObjectById( rm.co[i] ).structureType == STRUCTURE_ROAD || creep.memory.role != 'harv' ) ) { target = Game.getObjectById( rm.co[i] ); creep.memory.buildCache = rm.co[i]; break; } } else target = null;
                    }
            	    if( target && ( !creep.pos.inRangeTo( target, 0 ) || target.structureType == STRUCTURE_ROAD ) ) { 
            	        creep.memory.buildCache = target.id;
            	        creep.build( target );
            	        if ( creep.hits == creep.hitsMax && ( creep.getActiveBodyparts( WORK ) > 1 || creep.pos.findInRange( FIND_MY_CREEPS, 2, { filter: function(object) { return object.memory.role != 'miner'; } } ).length < 2 ) ) m( creep, creep ); 
            	        creep.memory.gridlock = 0;
            	   } else {
                	    // Repair?
                        if ( rm.re.length > 0 ) {
                            if ( creep.memory.repairCache &&
                                 Game.getObjectById( creep.memory.repairCache ) && 
                                 orange( creep, Game.getObjectById( creep.memory.repairCache ) ) < 2 && 
                                 Game.getObjectById( creep.memory.repairCache ).hits < Game.getObjectById( creep.memory.repairCache ).hitsMax && 
                                 Game.getObjectById( creep.memory.repairCache ).hits < rampartlevel * 1.2 && 
                                 creep.ticksToLive / 36 != Math.floor( creep.ticksToLive / 36 ) )
                            {
                                target = Game.getObjectById( creep.memory.repairCache );
                            }
                            else
                            {
                                creep.memory.repairCache = null;
            	                var wellOff = rampartlevel * 1.2;
                                for( var i = 0; i < rm.re.length; i++ ) {
                                    var rep = Game.getObjectById( rm.re[i] );
                                    if ( rep && creep.pos.inRangeTo( rep, 1 ) && rep.hits < wellOff && ( rep.structureType == STRUCTURE_ROAD || creep.memory.role != 'harv' ) ) { target = rep; creep.memory.repairCache = target.id; wellOff = rep.hits; }
                                } 
                            }
                        }
            	    	if ( target && ( creep.getActiveBodyparts( WORK ) > 1 || target.structureType == STRUCTURE_ROAD ) && target.hits < rampartlevel * 1.2 && target.hits < target.hitsMax ) { m( creep, creep ); creep.memory.gridlock = 0; } 
        	            if ( target ) {
        	                creep.repair( target );
        	                creep.memory.gridlock = 0;
        	            } else {
                	        // Upgrade Controller?
                	        target = creep.room.controller;
                    	    if( target && creep.pos.inRangeTo( target, 1 ) ) { creep.upgradeController( target ); creep.memory.gridlock = 0; if ( creep.getActiveBodyparts( WORK ) > creep.getActiveBodyparts( CARRY ) ) m( creep, creep ); }
                	    }
            	    }
                } 
            }
        }
        
    	rSlow( creep.name + ' Heal calcs' );
        // Heal if possible
        // Injured Creeps
        if ( creep.getActiveBodyparts(HEAL) > 0 && !creepAttacking ) {
            var inj = creep.room.find( FIND_MY_CREEPS, { filter: function(object) { return object.hits < object.hitsMax; } } );
            var select = -1, targetNeed = -1, need = 0, target = null;
            for ( var i=0;i<inj.length;i++ ) {
                if ( inj[i].pos.inRangeTo( creep, 3 ) ) {
                    need = inj[i].hitsMax - inj[i].hits + inj[i].getActiveBodyparts( ATTACK ) * 50 + inj[i].getActiveBodyparts( HEAL ) * 100 + inj[i].getActiveBodyparts( RANGED_ATTACK ) * 25;
                    if ( inj[i].pos.inRangeTo( creep, 1) ) need = need * 2;
                    if ( inj[i].hits < inj[i].hitsMax *.25 ) need = need * 3;
                    if ( hostiles == 0 && inj[i].hits > inj[i].hitsMax *.85 ) need = need + 5000;
                    if ( need > targetNeed ) { targetNeed = need; select = i; }
                }
            }
            if ( select > -1 ) target = inj[select];
            
            if ( target ) {
                if ( creep.pos.inRangeTo( target, 1 ) && !creepAttacking ) creep.heal( target ); else if ( creep.pos.inRangeTo( target, 3 ) && !creepFiring ) creep.rangedHeal( target );
            }
        }
        
    	rSlow( creep.name + ' Pick up energy calcs' );
        // Pick up energy if I can and should
    	if ( creep.carry.energy < creep.carryCapacity && !creep.memory.mil && ( creep.memory.role != 'miner' || creep.memory.accum ) && creep.memory.wantEnergy ) {  
    	    var source = null;
            var select = -1, want = 0;
            for ( var i = 0; i < creep.room.memory.allEnergy.length; i++ ) {
                var thisE = creep.room.memory.allEnergy[i];
                if ( orange( thisE, creep ) < 2 && thisE.energy > want && ( !thisE.storage || creep.memory.role == 'worker' || creep.memory.role == 'sup' ) ) { want = thisE.energy; select = i; }
            }
            if ( want > -1 ) { source = creep.room.memory.allEnergy[select]; if ( source ) source.energy = source.energy - ( creep.carryCapacity - creep.carry.energy ); };

    	    if ( creep.memory.role == 'storage' ) source = null;
    	    if ( creep.memory.accum ) source = creep.pos.findClosestByRange( FIND_DROPPED_ENERGY, {  filter: function(object) { return orange( object, creep ) == 1; } } );
    	    
    	    if ( source && source.pos.inRangeTo( creep, 1) ) creep.pickup( source ); else if ( creep.room.storage && creep.memory.role != 'storage' && !creep.memory.share && creep.memory.role != 'harv' && ( creep.memory.role != 'trans' || base.room == creep.room ) && creep.memory.role && creep.room.storage.pos.inRangeTo( creep, 1 ) && creep.carry.energy < creep.carryCapacity - 30 && ( creep.carryCapacity > Math.random()*200 || !creep.room.memory.noExtNeed ) ) { creep.room.storage.transferEnergy( creep ); }
            if ( link && creep.memory.role != 'storage' && creep.memory.noExt === undefined && !creep.memory.share && creep.memory.role != 'harv' && creep.memory.role && link.pos.inRangeTo( creep, 1 ) && creep.carry.energy < creep.carryCapacity * harvFull ) { link.transferEnergy( creep ); }    	    
    	}
    	
    	rSlow( creep.name + ' Transfer energy calcs' );
    	// Transfer energy if I can and should
    	if ( creep.carry.energy > 0 ) { 
            var source = null;
            if ( creep.room.memory.extensions > 0 ) {
                for ( var i = 0; i < creep.room.memory.ex.length; i++ ) {
                    if ( Game.getObjectById(creep.room.memory.ex[i]).pos.inRangeTo( creep , 1 ) ) { source = Game.getObjectById(creep.room.memory.ex[i]); break; }
                }
            }

            if ( !source ) {
        	    if ( creep.memory.role == 'miner' || creep.memory.role == 'harv' || ( creep.memory.role == 'trans' && Game.flags['o'+creep.memory.rally] && Game.flags['o'+creep.memory.rally].room == creep.room ) || !creep.memory.role || creep.memory.tt ) { 
        	        if ( creep.memory.spr < 2 ) source = creep.pos.findClosestByRange( FIND_MY_SPAWNS, { filter: function(object) { return object.energy < 300 && object.pos.inRangeTo( creep, 1 ); } } ); else source = null;
        	        if ( !source && creep.room.storage && creep.pos.inRangeTo( creep.room.storage, 1) ) source = creep.room.storage;
        	        /*
        	        if ( typeof adjCreeps === 'undefined' ) {
        	            adjCreeps = creep.pos.findInRange( FIND_MY_CREEPS, 1 );
        	        }
        	        if ( adjCreeps && adjCreeps.length > 0 ) {
            	        for ( var i = 0; i < adjCreeps.length; i++ ) {
            	            var adj = adjCreeps[i];
            	            if ( adj.id ) {
                	            if ( adj.memory.role == 'storage' && ( Math.abs( adj.memory.storedEnergy ) < creep.room.memory.tempStorageLimit || !creep.room.storage ) && !link ) { source = adj; break; }
                	            if ( ( ( adj.memory.target && adj.memory.target == creep.name ) || adj.memory.role == 'sup' || adj.getActiveBodyparts( WORK ) > 0 ) && creep.memory.wantEnergy && adj.memory.role != 'harv' && ( adj.memory.role != 'miner' || ( creep.memory.role == 'miner' && adj.memory.accum ) )  ) { source = adj; break; }
                	            if ( creep.memory.role != 'harv' && adj.carry.energy < object.carryCapacity && adj.memory.share !== undefined && !adj.memory.endpoint ) { source = adj; break; }
            	            }
            	        }
        	        }
        	        */
        	        if ( !source ) source = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role == 'storage' && ( Math.abs(object.memory.storedEnergy) < creep.room.memory.tempStorageLimit || !creep.room.storage ) && object.pos.inRangeTo( creep, 1) && object != creep && !link; } } );
        	        if ( !source ) source = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return ( ( object.memory.target && object.memory.target == creep.name ) || object.memory.role == 'sup' || object.getActiveBodyparts( WORK ) > 0 ) && object.pos.inRangeTo( creep, 1) && object != creep && creep.memory.wantEnergy && object.memory.role != 'harv' && ( object.memory.role != 'miner' || ( creep.memory.role == 'miner' && object.memory.accum ) ) ; } } );
        	        if ( !source ) {
        	            var slider = null;
            	        if ( creep.memory.role != 'harv' ) slider = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.pos.inRangeTo( creep, 1) && object.carry.energy < object.carryCapacity && object.memory.share !== undefined && !object.memory.endpoint; } } );
            	        if ( slider ) source = slider;
        	        }
        	    }
        	    if ( creep.memory.role == 'sup' && creep.getActiveBodyparts( WORK ) == 0 ) {
        	        sources = creep.pos.findInRange( FIND_MY_CREEPS, 1, { filter: function(object) { return ( object.getActiveBodyparts( WORK ) > 0 || ( creep.memory.lift && object.memory.lift && creep.memory.lift < object.memory.lift ) ) && object.pos.inRangeTo( creep, 1) && ( object.carry.energy < object.carryCapacity - 25 || object.memory.lift ) && object != creep && object.memory.role != 'miner' && object.memory.role != 'harv'; } } ); 
                    if ( sources ) {
                        var select = -1, need = 99999;
                        for ( var i = 0; i < sources.length; i++ ) {
                            if ( sources[i].carry.energy < need ) { need = sources[i].carry.energy; source = sources[i]; }
                        }
                    }
        	    } 
        	    
            }
            
    	    if ( source && source.pos && source.pos.inRangeTo( creep, 1 ) ) { 
    	        creep.transferEnergy( source );
    	    }  
    	} 

    	rSlow( creep.name + ' Mass storage calcs' );
        // Manage massive energy storage..
        if ( creep.memory.role == 'storage' ) {
            var spawner = creep.pos.findClosestByRange( FIND_MY_SPAWNS, { filter: function(object) { return object.energy < 300; } } );
            var heavyBuilder = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return ( ( object.memory.role == 'worker' && object.memory.wantEnergy && object.getActiveBodyparts(WORK) > 3 ) || object.memory.role == 'sup' || object.memory.lift ) && object.pos.inRangeTo( creep, 1 ); } } )
    	    var source = creep.pos.findClosestByRange( FIND_DROPPED_ENERGY, { filter: function(object) { return orange( creep, object ) < 2; } } );
    	    var emptyLink = creep.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_LINK && object.energy == 0 && !object.pos.inRangeTo( creep.room.storage, 2 ); } } );
    	    var link = creep.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_LINK && object.pos.inRangeTo( creep, 1 ); } } );
    	    var beamLink = creep.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_LINK && object.pos.inRangeTo( creep, 1 ) && object.cooldown == 0 && object.energy > 0 && object.pos.inRangeTo( creep.room.storage, 2 ); } } );
    	    var eLink = creep.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_LINK && object.pos.inRangeTo( creep, 1 ) && object.energy < object.energyCapacity && object.pos.inRangeTo( creep.room.storage, 2 ); } } );
    	    
            var reserve = 0;
            if ( heavyBuilder ) reserve = 100;
            if ( creep.room.storage && !creep.pos.inRangeTo( creep.room.storage, 1 ) ) {
                reserve = 300;
                if ( link && link.energy > 0 && creep.carry.energy < creep.carryCapacity ) link.transferEnergy( creep ); 
            }
            if ( creep.memory.linked ) reserve = 3000;
            if ( spawner && spawner.pos.inRangeTo( creep, 1) && spawner.energy < 300 ) {
                // Pickup energy and transfer to spawner
    	        if ( creep.carry.energy < creep.carryCapacity ) { if ( source ) creep.pickup( source ); else if ( creep.room.storage && creep.room.storage.pos.inRangeTo( creep ,1 ) ) creep.room.storage.transferEnergy( creep ); else if ( link ) link.transferEnergy( creep ); }
    	        creep.transferEnergy( spawner );
            } else {
                // Create an energy stash when we have excess energy
                if ( creep.carry.energy > reserve ) {
                    if ( creep.room.storage && creep.room.storage.pos.inRangeTo( creep ,1 ) ) creep.transferEnergy( creep.room.storage, creep.carry.energy - reserve ); else if ( creep.carry.energy > reserve && !creep.room.storage ) creep.dropEnergy( creep.carry.energy - reserve );
                }
            }
            
            if ( eLink ) {
    	        if ( source ) creep.pickup( source ); else if ( creep.room.storage && creep.room.storage.pos.inRangeTo( creep ,1 ) ) creep.room.storage.transferEnergy( creep ); 
    	        creep.transferEnergy( eLink );
            }
            
            if ( heavyBuilder && heavyBuilder.carry.energy < heavyBuilder.carryCapacity - 30 ) {
    	        if ( creep.carry.energy < reserve ) if ( source ) creep.pickup( source, reserve - creep.carry.energy ); else if ( creep.room.storage ) creep.room.storage.transferEnergy( creep, reserve - creep.carry.energy );
    	        creep.transferEnergy( heavyBuilder );
            } 
            
            if ( Math.abs(creep.memory.storedEnergy) > 0 && !Game.flags[creep.name] ) m( creep, creep );
            
            if ( beamLink && emptyLink && !creep.room.memory.linkBeam ) { beamLink.transferEnergy( emptyLink ); creep.room.memory.linkBeam = true; }
        } 

    	rSlow( creep.name + ' Share energy calcs' );
        // Shall I share my energy?
        if ( creep.memory.share !== undefined ) {
            var lower = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.share !== undefined && object.memory.share < creep.memory.share && object.pos.inRangeTo( creep, 1); } } );
            var higher = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.share !== undefined && object.memory.share > creep.memory.share && object.pos.inRangeTo( creep, 1); } } );
            
            // If I am the highest, pick up energy to begin the slide
            if ( !higher ) {
                var source = creep.pos.findClosestByRange( FIND_DROPPED_ENERGY, { filter: function(object) { return object.pos.inRangeTo( creep, 1 ); } } );
                if ( source ) creep.pickup( source );
                creep.memory.endpoint = null;
            }
            // Send it down the chute, if at the bottom, drop it
            if ( lower ) { creep.transferEnergy( lower ); creep.memory.endpoint = null; } else {
                // Give to workers, storage, harvester carriers or drop
                var needy = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.pos.inRangeTo( creep, 1 ) && object.carry.energy < object.carryCapacity && ( object.memory.role != 'miner' || object.memory.accum ) && ( object.getActiveBodyparts( WORK > 0 ) || object.memory.role == 'harv' || object.memory.role == 'storage' ); } } );
                if ( needy ) creep.transferEnergy( needy ); else creep.dropEnergy();
                creep.memory.endpoint = 1;
            }
        } 
        
    	if ( creep.memory.accum || ( creep.memory.role == 'storage' && Game.flags[creep.name] !== undefined && !creep.pos.inRangeTo( Game.flags[creep.name], 0 ) ) ) { creep.dropEnergy(); }
    	if ( !creep.memory.wantEnergy && creep.memory.role == 'worker' ) creep.dropEnergy();
    	
        // Movement Rules

    	rSlow( creep.name + ' Basic movement' );
        creep.memory.usedCpu1 = Math.floor( ( Game.getUsedCpu() - startCpu ) * 100 ) / 100;
        // Default to moving to a flagged position
        if ( creep.fatigue > -1 ) {
            if ( creep.memory.tt ) if ( !Game.getObjectById( creep.memory.tt ) || orange( creep, Game.getObjectById( creep.memory.tt ) ) < 2 ) creep.memory.tt = undefined; else m( creep, Game.getObjectById( creep.memory.tt ) );
            if ( creep.memory.stayHere && creep.memory.stayHere > 2 && creep.memory.er > 6 ) m( creep, creep );
            if ( creep.memory.er < 10 && Game.flags['e'+creep.name] ) m( creep, Game.flags['e'+creep.name], 1 );
            if ( Game.flags[creep.name] ) { 
                if ( !(creep.memory.role && creep.memory.role == 'trans' && creep.carry.energy == 0) ) m( creep, Game.flags[creep.name], 1 );
                if ( creep.pos.inRangeTo( Game.flags[creep.name], 1 ) && creep.memory.dist > 3 ) Game.flags[creep.name].memory.dist = creep.memory.dist; 
                if ( creep.pos.inRangeTo( Game.flags[creep.name], 1 ) && creep.name.substring(0,3) == 'hwx' ) Game.flags[creep.name].remove();
            }
            var evasion = 4;
            if ( creep.hits < creep.hitsMax ) evasion = 5;
            if ( Game.flags[creep.room.name] !== undefined ) evasion = 2;
            if ( ( !creep.memory.mil || creep.hits < creep.hitsMax * .6 ) && creep.memory.er < evasion ) { if ( creep.memory.er == 4 && ( creep.memory.gridlock > 0 || nearestEnemy.hitsMax > 4500 ) ) { m( creep, creep ); creep.memory.gridlock = 0; } else evade( creep, nearestEnemy ); }
            if ( creep.memory.rally && Game.flags[creep.memory.rally] && Game.flags[creep.memory.rally+'stage'] && creep.room != Game.flags[creep.memory.rally+'stage'].room && creep.room != Game.flags[creep.memory.rally].room && creep.carry.energy == 0 ) m( creep, Game.flags[creep.memory.rally+'stage'], 1 );
            if ( creep.memory.rally && Game.flags[creep.memory.rally] && Game.flags[creep.memory.rally].pos != creep.pos ) { 
                if ( !(creep.memory.role == 'trans' && creep.carry.energy < creep.carryCapacity * harvFull) ) m( creep, Game.flags[creep.memory.rally], 1 ); 
                if ( creep.pos.inRangeTo( Game.flags[creep.memory.rally], 0 ) ) Game.flags[creep.memory.rally].memory.dist = creep.memory.dist;
            }
            if ( creep.memory.escort && Game.creeps[creep.memory.escort] !== undefined && creep.room == Game.creeps[creep.memory.escort].room && creep.memory.er > 7 && !creep.pos.inRangeTo( Game.creeps[creep.memory.escort], 2 ) ) { m( creep, Game.creeps[creep.memory.escort], 1 ); }
            if ( creep.memory.rally && Game.flags['o'+creep.memory.rally] && Game.flags[creep.memory.rally+'stage'] && creep.room != Game.flags[creep.memory.rally+'stage'].room && creep.room != Game.flags['o'+creep.memory.rally].room && creep.carry.energy == 0 ) m( creep, Game.flags[creep.memory.rally+'stage'], 1 );
            if ( creep.memory.rally && Game.flags['o'+creep.memory.rally] && ( creep.room != Game.flags['o'+creep.memory.rally].room || ( creep.room == Game.flags['o'+creep.memory.rally].room && ( creep.pos.x == 49 || creep.pos.x == 0 || creep.pos.y == 49 || creep.pos.y == 0 ) ) ) && creep.carry.energy == 0 ) m( creep, Game.flags['o'+creep.memory.rally], 1 );
            if ( creep.memory.noExt && Game.flags['o'+creep.name] && creep.carry.energy > 0 ) m( creep, Game.flags['o'+creep.name], 1 );
            if ( creep.memory.role == 'worker' && Game.flags['o'+creep.name] && creep.room != Game.flags['o'+creep.name].room && creep.carry.energy == 0 ) m( creep, Game.flags['o'+creep.name], 1 );
            if ( creep.memory.role == 'sup' && Game.flags['o'+creep.name] && creep.carry.energy > 0 && ( creep.room != Game.flags['o'+creep.name].room || creep.pos.x == 49 || creep.pos.x == 0 || creep.pos.y == 49 || creep.pos.y == 0 ) ) m( creep, Game.flags['o'+creep.name], 1 );
            if ( creep.memory.role == 'trans' && creep.carry.energy < creep.carryCapacity * harvFull ) creep.memory.moveOrder = 0;
        }
        
    	rSlow( creep.name + ' Miner Movement' );
    	// Miners
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && ( creep.memory.role == 'miner' || ( creep.memory.role == 'harv' && creep.carry.energy == 0 && creep.getActiveBodyparts( WORK ) > 1 ) ) && !creep.memory.accum ) {
        	var nearestMil = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.mil && creep.hitsMax > 1000 && creep != object;  } } );
    	    var source = null;
    	    if ( creep.getActiveBodyparts( WORK ) < 12 ) source = creep.pos.findClosestByRange( FIND_SOURCES ); else {
            	var nearestMiner = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role == 'miner' && creep != object;  } } );
    	        source = creep.pos.findClosestByRange( FIND_SOURCES, { filter: function( object ) { return object.energy > 0 && object.pos.findInRange(FIND_HOSTILE_CREEPS,6,{filter:function(object){return object.hitsMax>4500;}}).length == 0 && ( orange( object, lair ) > 6 || orange( object, nearestMil ) < 8 ) && orange( object, creep ) <= orange( object, nearestMiner ); } } ); 
    	    }
    	    if ( !source && nearestMil ) source = nearestMil;
    	    if ( !source && creep.memory.rally && Game.flags['o'+creep.memory.rally] && creep.room != Game.flags['o'+creep.memory.rally].room ) source = Game.flags['o'+creep.memory.rally];
    	    if ( source && creep.pos.inRangeTo( source, 1) && creep.hits == creep.hitsMax ) m( creep, creep ); else if ( source ) if ( creep.memory.er > 4 ) if ( source != nearestMil || ( source == nearestMil && !source.pos.inRangeTo( creep, 3 ) ) ) m( creep, source ); 

            // May I help another miner with some energy?
            if ( !creep.memory.accum ) {
                var helper = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.pos.inRangeTo( creep, 1) && ( object.memory.accum || object.memory.share !== undefined ); } } );
                if ( helper ) creep.transferEnergy( helper );
            }
    	}
    	
    	rSlow( creep.name + ' Builder Movement' );
    	// Builders
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && creep.getActiveBodyparts( WORK ) > 0 && creep.memory.role != 'harv' && creep.getActiveBodyparts( CARRY ) > 0 ) { 
    	    var myCenter = null, myCenterRange = 99;
    	    if ( !myCenter && Game.flags[creep.memory.spawn] ) { myCenter = Game.flags[creep.memory.spawn]; myCenterRange = 25; }
    	    if ( !myCenter ) myCenter = Game.spawns[creep.memory.spawn];
    	    if ( myCenter.room != creep.room ) myCenter = creep;
    	    if ( !creep.memory.lookRange ) creep.memory.lookRange = 8;

            var source = null, maxR = creep.memory.lookRange;
            if ( rm.hpre.length > 0 ) {
                for( var i = 0; i < rm.hpre.length; i++ ) { if ( orange( creep, Game.getObjectById( rm.hpre[i] ) ) < maxR && orange( creep, Game.getObjectById( rm.hpre[i] ) ) < myCenterRange ) { source = Game.getObjectById( rm.hpre[i] ); maxR = orange( creep, Game.getObjectById( rm.hpre[i] ) ); } } 
            }
            if ( rm.co.length > 0 ) {
                for( var i = 0; i < rm.co.length; i++ ) { if ( orange( creep, Game.getObjectById( rm.co[i] ) ) < maxR && orange( creep, Game.getObjectById( rm.co[i] ) ) < myCenterRange ) { source = Game.getObjectById( rm.co[i] ); maxR = orange( creep, Game.getObjectById( rm.co[i] ) ); } } 
            }
            if ( !source && rm.hre.length > 0 ) {
                maxR = creep.memory.lookRange;
                for( var i = 0; i < rm.hre.length; i++ ) { if ( orange( creep, Game.getObjectById( rm.hre[i] ) ) < maxR && orange( creep, Game.getObjectById( rm.hre[i] ) ) < myCenterRange ) { source = Game.getObjectById( rm.hre[i] ); maxR = orange( creep, Game.getObjectById( rm.hre[i] ) ); } } 
            }
            if ( maxR + 1 < creep.memory.lookRange ) creep.memory.lookRange = maxR + 1;
            if ( creep.memory.lookRange < 8 ) creep.memory.lookRange = 8;
    	    if ( !source ) {
    	        if ( creep.memory.lookRange < 128 ) creep.memory.lookRange = creep.memory.lookRange + 8;
    	        maxR = creep.memory.lookRange;
                for ( var i = 0; i < creep.room.memory.ex.length; i++ ) {
                    var thisExt = Game.getObjectById(creep.room.memory.ex[i]);
                    if ( orange( creep, thisExt ) < maxR && orange( creep, thisExt ) < myCenterRange ) { maxR = orange( creep, thisExt ); source = thisExt; }
                }
    	    }
    	    if ( creep.memory.lookRange > 50 ) {
    	        if ( creep.memory.rememberTarget && Game.getObjectById( creep.memory.rememberTarget ) && creep.ticksToLive / 30 != Math.floor( creep.ticksToLive / 30 ) && orange( creep, Game.getObjectById( creep.memory.rememberTarget ) ) > 5 ) source = Game.getObjectById( creep.memory.rememberTarget ); else {
    	            creep.memory.rememberTarget = null;
        	        maxR = creep.memory.lookRange;
                    for ( var i = 0; i < allCo.length; i++ ) {
                        var rep = Game.getObjectById( allCo[i] );
                        if ( orange( creep, rep ) < maxR ) { maxR = orange( creep, rep ); source = rep; }
                    }
                    for ( var i = 0; i < allHre.length; i++ ) {
                        var rep = Game.getObjectById( allHre[i] );
                        if ( orange( creep, rep ) < maxR ) { maxR = orange( creep, rep ); source = rep; }
                    }
                    if ( source ) creep.memory.rememberTarget = source.id;
    	        }
    	    }
    	    if ( !source ) {
                if ( rm.re.length > 0 ) {
                    var maxR = creep.memory.lookRange, rep = Game.getObjectById( rm.re[i] );
                    for( var i = 0; i < rm.re.length; i++ ) { if ( rep && orange( creep, rep ) < maxR && rep.hits < rep.hitsMax * .9 && rep.hits < rampartlevel * .9 ) { source = rep; maxR = orange( creep, rep ); } } 
                }
    	    }
    	    if ( !source && Game.spawns[ creep.memory.spawn ] && Game.spawns[ creep.memory.spawn ].room != creep.room ) source = Game.spawns[ creep.memory.spawn ];

    	    if ( source && creep.memory.er > 4 && ( creep.carry.energy > 0 || creep.memory.role != 'sup' ) ) {
    	        if ( creep.pos.inRangeTo( source , 1 ) && creep.hits == creep.hitsMax && creep.memory.role != 'harv' ) { m( creep, creep); if ( !creep.memory.stayHere || creep.memory.stayHere == 0 ) creep.memory.stayHere = 6; } else m( creep, source );
    	    }
    	    
    	    // Request more energy, if needed
    	    if ( creep.carry.energy < creep.carryCapacity / 4 && creep.memory.spr > 20 && Game.time / 5 == Math.floor( Game.time / 5 ) ) {
    	        var helper = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.carry.energy > creep.carryCapacity / 3 && ( object.memory.role == 'harv' || object.memory.role == 'trans' ); } } );
    	        if ( helper ) helper.memory.tt = creep.id;
    	    }
    	}

        creep.memory.usedCpu2 = Math.floor( ( Game.getUsedCpu() - startCpu ) * 100 ) / 100;
        // Build roads for better deliveries!
        if ( creep.memory.role == 'harv' && allCo.length < 60 && !roa( creep.room, creep.pos.x, creep.pos.y ) && creep.carry.energy > 300 ) creep.room.createConstructionSite( creep.pos.x, creep.pos.y, STRUCTURE_ROAD );
                
        // Delivery   
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && !creep.memory.mil ) { 
        	rSlow( creep.name + ' Delivery Calcs' );
    	    if ( !creep.memory.dest || hostiles > 0 || orange( creep, Game.getObjectById( creep.memory.dest ) ) < 2 || creep.ticksToLive / 36 == Math.floor( creep.ticksToLive / 36 ) ) {
    	        var supplyLink = null, maxR = 99;
    	        if ( rm.li !== undefined ) {
        	        for( var i = 0; i < rm.li.length; i++ ) {
        	            var sl = Game.getObjectById( rm.li[i] );
        	            if ( sl.energy > 0 && !sl.pos.inRangeTo( creep.room.storage, 2 ) && orange( creep, sl ) < maxR && sl.pos.findInRange( FIND_MY_CREEPS, 1, { filter: function(object) { return object.getActiveBodyparts( WORK ) > 0; } } ).length == 0 ) { supplyLink = sl; maxR = orange( creep, sl ); }
        	        }
    	        }
                var source = null;
                if ( creep.memory.target && Game.flags[creep.memory.target] ) { source = Game.flags[creep.memory.target]; if ( creep.memory.role == 'sup' && creep.carry.energy == 0 ) source = null; }
                if ( !source && creep.memory.target && creep.memory.role == 'sup' && Game.creeps[creep.memory.target] ) { source = Game.creeps[creep.memory.target]; if ( creep.memory.role == 'sup' && creep.carry.energy == 0 ) source = null; }
                if ( !source && creep.memory.rally && Game.flags['o'+creep.memory.rally] && Game.flags['o'+creep.memory.rally].room != creep.room ) source = Game.flags['o'+creep.memory.rally]; 
                if ( !source && Game.flags['o'+creep.name] && Game.flags['o'+creep.name].room != creep.room ) source = Game.flags['o'+creep.name]; 
                
                // Looting
                if ( creep.carry.energy >= creep.carryCapacity * harvFull ) creep.memory.loot = null;
                if ( !source && creep.memory.loot !== null && !creep.memory.rally && creep.carry.energy < creep.carryCapacity * harvFull ) {
                    if ( Game.getObjectById( creep.memory.loot ) !== null && Game.getObjectById( creep.memory.loot ).energy > 100 && orange( creep, Game.getObjectById( creep.memory.loot ) ) < roaming ) { 
                        source = Game.getObjectById( creep.memory.loot ); 
                    } else creep.memory.loot = null;
                }

                var eMod = 0;
                if ( creep.memory.spr < 8 && creep.memory.spr > 0 ) eMod = ( creep.carryCapacity * .75 ) / creep.memory.spr;

                if ( !source && creep.memory.role == 'sup' && creep.carry.energy > eMod ) {
                    var maxR = 99, eLevel = 0;
                    for ( var i = 0; i < rm.wo.length; i++ ) {
                        var worker = Game.getObjectById( rm.wo[i] );
                        if ( worker.carry.energy < worker.carryCapacity && ( orange( creep, worker ) < maxR || ( orange( creep, worker ) == maxR && worker.carry.energy < eLevel ) && worker.memory.role != 'miner' && ( creep.memory.noExt === undefined || worker.getActiveBodyparts( WORK ) > 9 ) ) ) { source = worker; maxR = orange( creep, worker ); eLevel = worker.carry.energy; }
                    }
                }

                // Determine where to return to to get or give energy
                if ( creep.memory.role == 'harv' && Game.flags[creep.room.name] !== undefined ) base = Game.flags[creep.room.name];
                var altSource = base, saveAlt = base; 
                if ( creep.room.find( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role == 'storage' && Math.abs(object.memory.storedEnergy) < creep.room.memory.tempStorageLimit; } } ).length > 0 && ( altSource.energy == 300 || altSource.room != creep.room ) && !creep.room.storage ) {
                    var sel = -1, targs = creep.room.find( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role == 'storage' && Math.abs(object.memory.storedEnergy) < creep.room.memory.tempStorageLimit && object.carry.energy < object.carryCapacity; } } ), targNeed = 99999;
                    for ( var i = 0; i < targs.length; i++ ) {
                        if ( Math.abs( targs[i].memory.storedEnergy ) + orange( creep, targs[i] ) * 200 < targNeed ) { targNeed = Math.abs( targs[i].memory.storedEnergy ) + orange( creep, targs[i] ) * 200; sel = i; }
                    }
                    if ( sel > -1 ) { altSource = targs[sel]; saveAlt = altSource; }
                } 
    
                // Should I return to base?
                if ( creep.memory.role == 'harv' && !source && creep.carry.energy >= creep.carryCapacity * harvFull ) creep.memory.returnToBase = true;
                if ( creep.memory.role == 'harv' && source && ( ( creep.carry.energy >= creep.carryCapacity * harvFull && orange( creep, source ) > 1 ) || ( creep.carry.energy == creep.carryCapacity && orange( creep, source ) < 2 ) ) ) creep.memory.returnToBase = true;
                if ( creep.memory.role == 'harv' && creep.memory.returnToBase ) source = altSource;
                if ( creep.memory.role == 'trans' && creep.carry.energy < creep.carryCapacity * harvFull ) source = Game.spawns[creep.memory.spawn]; 
                if ( creep.memory.role == 'trans' && creep.carry.energy >= creep.carryCapacity * harvFull && Game.flags['o'+creep.memory.rally] && Game.flags['o'+creep.memory.rally].room == creep.room && creep.room.storage ) source = creep.room.storage; 
    
                if ( ( !source || ( ( creep.memory.rally === undefined ) && ( creep.memory.target === undefined || creep.memory.role == 'sup' ) ) || ( source.room == creep.room && !creep.pos.inRangeTo( source, 1 ) && creep.memory.role == 'harv' && !( creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49 ) ) ) && creep.carry.energy < creep.carryCapacity * harvFull && !creep.memory.returnToBase && !creep.memory.loot ) {
                    if ( creep.memory.role == 'sup' && creep.carry.energy == 0 ) {
                        var energyChunk = creep.pos.findClosestByRange( creep.room.memory.allEnergy, { filter: function(object) { return object.energy > creep.carryCapacity / 3; } } );
                        if ( creep.room.storage ) source = creep.room.storage;
            	        if ( !source || ( supplyLink && range( creep, supplyLink ) + 3 < range( creep, source ) ) ) source = supplyLink;
                        if ( !source || ( energyChunk && range( creep, energyChunk ) < range( creep, source ) ) ) source = energyChunk;
                    }
                    if ( creep.memory.role == 'harv' ) {
                        var ehits = 9999;
                        
                        var select = -1, want = -9999;
                        for ( var i = 0; i < creep.room.memory.allEnergy.length; i++ ) {
                            var thisE = creep.room.memory.allEnergy[i];
                            var enem = thisE.pos.findClosestByRange( FIND_HOSTILE_CREEPS, { filter: function( object ) { return object.hitsMax < ehits && ( object.getActiveBodyparts( ATTACK ) > 0 || object.getActiveBodyparts( RANGED_ATTACK ) > 0 ); } } );
                            if ( thisE.energy / ( orange( thisE, creep ) * 1 + 1 ) > want && !thisE.storage && thisE.energy > orange( thisE, creep ) && thisE.energy > 0 && ( thisE.energy > 1000 || creep.memory.target !== undefined || creep.memory.rally !== undefined ) && ( thisE.energy > 2000 || !creep.memory.loot ) && !( enem && thisE.pos.inRangeTo( enem, 6 ) ) && !( lair && thisE.pos.inRangeTo( lair, 6 ) ) ) { want = thisE.energy / ( orange( thisE, creep ) * 1 + 1 ); select = i; }
                        }
                        if ( want > -9999 ) { source = creep.room.memory.allEnergy[select]; creep.memory.loot = null; }
                        
                        if ( !source && ( !creep.memory.target || !Game.flags[creep.memory.target] ) && !creep.memory.rally && !creep.memory.loot ) {
                            var bounty = roaming, bountySel = -1;
                            for ( var i = 0; i < allDrop.length; i++ ) {
                                if ( allDrop[i].energy - allDrop[i].enc - orange( creep, allDrop[i] ) * 5 > creep.carryCapacity / 2 && orange( creep, allDrop[i] ) < bounty && !allDrop[i].pos.findInRange( FIND_HOSTILE_CREEPS, 6 ).length && !( lair && allDrop[i].pos.inRangeTo( lair, 6 ) ) ) {
                                    bounty = orange( creep, allDrop[i] );
                                    bountySel = i;
                                }
                            }
                            if ( bountySel > -1 ) { 
                                source = allDrop[bountySel]; 
                                allDrop[bountySel].enc += ( creep.carryCapacity - creep.carry.energy ); 
                                creep.memory.loot = allDrop[bountySel].id; 
                                break;
                            }
                        }
                    }
                }
    
                if ( creep.memory.noExt !== undefined && creep.room.storage ) if ( creep.carry.energy < creep.carryCapacity && creep.pos.inRangeTo( creep.room.storage, 1 ) ) creep.room.memory.noExtNeed = true;
    
                if ( creep.memory.spr < 60 && creep.carry.energy > 0 && creep.memory.noExt === undefined && creep.memory.role != 'trans' && ( !creep.memory.target || !Game.creeps[creep.memory.target] ) && creep.getActiveBodyparts( WORK ) == 0 ) {
                    var erange = 8 - creep.room.memory.iGotTheExt * 2;
                    if ( creep.memory.role == 'sup' && creep.room.memory.iGotTheExt < 4 ) erange = erange * 6;
                    if ( creep.memory.role == 'sup' && erange < 6 ) if ( !source ) erange = 60; else erange = 6;

        	        var cext = null, maxR = erange + 1;
                    for ( var i = 0; i < creep.room.memory.ex.length; i++ ) {
                        if ( orange( creep, Game.getObjectById(creep.room.memory.ex[i]) ) < maxR ) { maxR = orange( creep, Game.getObjectById(creep.room.memory.ex[i]) ); cext = Game.getObjectById(creep.room.memory.ex[i]); }
                    }

                    // var cext = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.energyCapacity==50 && object.energy < 50 && object.pos.inRangeTo( creep, erange ); } } );
                    if ( cext ) { source = cext; creep.room.memory.iGotTheExt = creep.room.memory.iGotTheExt + 1; }
                }
    
                if ( !source && creep.carry.energy >= creep.carryCapacity * harvFull && creep.memory.role != 'sup' ) source = altSource;
                
                // if ( creep.memory.role == 'harv' ) console.log( creep.name + ' ' + source.name );
                if ( ( source && source.structureType && source.structureType == 'spawn' && source.room == creep.room ) || ( source && source.memory && source.memory.role == 'storage' ) ) {
                    if ( creep.room.storage && creep.room.storage.owner.username == 'Vision' && creep.room.storage.store.energy < storageLevel ) source = creep.room.storage; else {
            	        var storage = altSource;
            	        if ( !storage && creep.room.storage && creep.room.storage.owner.username == 'Vision' && creep.room.storage.store.energy < storageLevel ) storage = creep.room.storage;
            	        if ( source.energy == 300 && storage ) source = storage;
                    }
                }
    
        	    if ( source ) {
        	        if ( source.pos.inRangeTo( creep, 1 ) && creep.memory.role == 'harv' ) {
        	            if ( creep.carry.energy < creep.carryCapacity * harvFull ) m( creep, creep ); else if ( altSource ) { source = altSource; creep.memory.gridlock = 0; }
        	        }
        	        if ( creep.memory.role == 'harv' && creep.pos.inRangeTo( source, 1 ) && creep.carry.energy < creep.carryCapacity * harvFull && creep.hits == creep.hitsMax ) m( creep, creep ); 
            	    if ( ( creep.memory.er > 4 || Game.flags[creep.room.name] !== undefined ) && ( creep.hits == creep.hitsMax || creep.room.find( FIND_MY_CREEPS, { filter: function( object ) { return object.getActiveBodyparts( HEAL ) > object.hitsMax / 700; } } ).length == 0 ) ) m( creep, source ); 
            	    creep.memory.dest = source.id;
        	    } else creep.memory.dest = null;
    	    } else {
            	rSlow( creep.name + ' Delivery Expedited Movement' );
        	    if ( Game.getObjectById( creep.memory.dest ) ) m( creep, Game.getObjectById( creep.memory.dest ) ); 
    	    }
    	}
        creep.memory.usedCpu3 = Math.floor( ( Game.getUsedCpu() - startCpu ) * 100 ) / 100;

    	rSlow( creep.name + ' Healer Movement' );
        // Healers
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && creep.getActiveBodyparts( HEAL ) > creep.hitsMax / 300 || ( creep.getActiveBodyparts( HEAL ) > 0 && creep.getActiveBodyparts( RANGED_ATTACK ) == 0 && creep.hitsMax < 2000 ) ) {  
            if ( creep.getActiveBodyparts( HEAL ) > Memory.healerHeal && creep.getActiveBodyparts(HEAL) > creep.hitsMax / 700 ) { Memory.healerHeal = creep.getActiveBodyparts( HEAL ); Memory.healer = creep.id; }
    	    var safedistance = 3;
            var target = -1, targetNeed = 0, need = 0;
            for ( var i=0;i<inj.length;i++ ) {
                if ( inj[i] != creep ) {
                    need = inj[i].hitsMax - inj[i].hits + inj[i].getActiveBodyparts( ATTACK ) * 50 + inj[i].getActiveBodyparts( HEAL ) * 100 + inj[i].getActiveBodyparts( RANGED_ATTACK ) * 25;
                    var mult = 7 - orange( inj[i], creep )/3;
                    if ( mult < 1 ) mult = 1;
                    need = need * mult;
                    if ( need > targetNeed ) { targetNeed = need; target = i; }
                }    
            }
            if ( target > -1 ) {
        	    if ( creep.hits < creep.hitsMax * .95 || orange( inj[target], creep ) > 3 ) safedistance = 4;
        	    source = inj[target];
            }
            else {
                if ( nearestEnemy ) safedistance = 5;
                source = nearestEnemy;
            }
            if ( creep.memory.er > safedistance ) if ( source && orange( creep, source ) == 1 ) m( creep, creep ); else if ( source ) m( creep, source ); 
    	}
    	
    	rSlow( creep.name + ' Melee Movement' );
    	// Melee
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && creep.getActiveBodyparts( ATTACK ) > 0 ) {
    	    var en = creep.pos.findInRange( FIND_HOSTILE_CREEPS, 5 ), es = 0, es2 = 0, myStr = creep.getActiveBodyparts( TOUGH ) / 2 + creep.getActiveBodyparts( ATTACK )+.6;
    	    var ally = creep.pos.findInRange( FIND_MY_CREEPS, 2 );
    	    for(var e=0;e<ally.length;e++) { myStr += ( ally[e].getActiveBodyparts(ATTACK)/5+ally[e].getActiveBodyparts(HEAL)/3 ); }
            for(var e=0;e<en.length;e++) {
                if ( en[e].pos.inRangeTo( creep, 4 ) ) es += (en[e].getActiveBodyparts( ATTACK ) );
                if ( en[e].pos.inRangeTo( creep, 5 ) ) es2 += (en[e].getActiveBodyparts( ATTACK ) );
                if ( en[e].pos.inRangeTo( creep, 4 ) ) es += (en[e].getActiveBodyparts( RANGED_ATTACK ) / 2 );
                if ( en[e].pos.inRangeTo( creep, 5 ) ) es2 += (en[e].getActiveBodyparts( RANGED_ATTACK ) / 2 ); 
                
            } 
    	    var source = creep.pos.findClosestByRange( hos, { filter: function(object) { return object.getActiveBodyparts( ATTACK ) < creep.getActiveBodyparts( ATTACK )*2 && object.hits < object.hitsMax * .3 && object.pos.inRangeTo( creep, 2 ); } } );
    	    if ( !source ) source = creep.pos.findClosestByRange( hos, { filter: function(object) { return object.getActiveBodyparts( ATTACK ) < creep.getActiveBodyparts( ATTACK )*2 && object.getActiveBodyparts( HEAL ) > 0 && object.pos.inRangeTo( creep, 2 ); } } );
    	    if ( !source ) source = creep.pos.findClosestByRange( hos, { filter: function(object) { return object.getActiveBodyparts( ATTACK ) < creep.getActiveBodyparts( ATTACK )*2 && object.getActiveBodyparts( RANGED_ATTACK ) > 1 && object.pos.inRangeTo( creep, 2 ); } } );
    	    if ( !source ) source = creep.pos.findClosestByPath( hos, { filter: function(object) { return object.getActiveBodyparts( ATTACK ) < creep.getActiveBodyparts( ATTACK )*2; } } );
    	    if ( !source && creep.memory.spr < 5 ) source = creep.pos.findClosestByPath( hos );
            if ( source ) {
                var ramp = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_RAMPART && object.owner.username == 'Vision' && object.pos.inRangeTo( source, 1 ) && ( object.pos.lookFor('creep').length == 0 || object.pos.lookFor('creep')[0] == creep ); } } );
                if ( ramp ) { m( creep, ramp ); } else {
            	    if ( creep.hits > creep.hitsMax * (.5+es*.03) && es < myStr ) if ( creep.memory.er == 1 ) m( creep, creep ); else if ( es2 < myStr ) m( creep, source ); else m( creep, creep );
                }
            }

            if ( !source ) {
                target = creep.pos.findClosestByRange( FIND_HOSTILE_SPAWNS );
                if ( target ) m( creep, target );
            }
    	}
    	
    	rSlow( creep.name + ' Ranged Movement' );
    	// Ranged
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && creep.getActiveBodyparts( RANGED_ATTACK ) > 0 ) {
    	    var source = creep.pos.findClosestByRange( hos ); 
    	    if ( !source || orange( creep, source ) > orange( creep, attlair ) ) source = attlair;
    	    if ( source && creep.hits > creep.hitsMax * .6 ) {
    	        var r = range(source.pos.x,source.pos.y,creep.pos.x,creep.pos.y);
                var ramp = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_RAMPART && object.owner.username == 'Vision' && object.pos.inRangeTo( source, 3 ) && ( object.pos.lookFor('creep').length == 0 || object.pos.lookFor('creep')[0] == creep ); } } );
                if ( ramp ) { m( creep, ramp ); } else {
        	        if ( r > 3 ) m( creep, source );
        	        if ( r == 3 ) { m( creep, creep ); }
                }
    	    } 
    	}
    	
    	rSlow( creep.name + ' Evasion Movement' );
        // Evade if needed
        if ( creep.fatigue == 0 && creep.memory.moveOrder === 0 && creep.memory.spr > 3 ) {
            var r = 5;
            if ( creep.memory.mil ) r = 4;
            if ( creep.memory.er <= r ) evade( creep, nearestEnemy );
        }

    	rSlow( creep.name + ' Moveto Healer Movement' );
        // Move to a healer if needed
        if ( creep.fatigue == 0 && creep.hits < creep.hitsMax && ( !creep.memory.mil || creep.hits < creep.hitsMax * .6 ) && creep.memory.tt != Memory.healer ) {
            target = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function(object) { return object.getActiveBodyparts(HEAL) > object.hitsMax / 700; } } );
            if ( !target && Memory.healer && creep.hits < creep.hitsMax * .9 ) creep.memory.tt = Memory.healer;
	        if ( target ) { creep.memory.moveOrder = 0; m( creep, target, 1 ); }
        }     

    	rSlow( creep.name + ' Final Movement' );
        // Warriors report to the army position, if it exists
        if ( Game.flags['o'+creep.name] ) m( creep, Game.flags['o'+creep.name], 1 );
        if ( creep.memory.rally && Game.flags['o'+creep.memory.rally] ) m( creep, Game.flags['o'+creep.memory.rally], 1 );
        if ( Game.flags.army && ( creep.getActiveBodyparts( ATTACK ) > 0 || creep.getActiveBodyparts(RANGED_ATTACK ) > 0 || creep.getActiveBodyparts( HEAL ) > creep.hitsMax / 500 ) ) m( creep, Game.flags.army, 1 );

        logCpu( creep );
    	rSlow( creep.name + ' End' );
    }
    cpuC = Game.getUsedCpu() - cpuC;
}

function logCpu( creep ) {
    creep.memory.usedCpu = Math.floor( ( Game.getUsedCpu() - startCpu ) * 100 ) / 100;
    creep.room.memory.cpuUse = creep.room.memory.cpuUse + creep.memory.usedCpu;
    if ( Game.flags.diag && creep.memory.usedCpu > .5 ) creep.say( creep.memory.usedCpu );
    if ( creep.memory.usedCpu > topUserAmount ) { topUserAmount = creep.memory.usedCpu; topUser = creep; }
    if ( creep.memory.usedCpu > rLevel + 1 ) console.log( creep.name + ' ' + creep.memory.usedCpu + '.' + creep.memory.epathed + '.' + creep.memory.mapping + ' ' + creep.memory.lastMove + '  ER: ' + creep.memory.er + '  SPR: ' + creep.memory.spr + '  Grid: ' + creep.memory.gridlock + '  Hits: ' + creep.hits + '/' + creep.hitsMax );
    if ( creep.memory.role ) {
        if ( !cpuByRole.none ) cpuByRole.none = 0;
        if ( !cpuByRole.noneCount ) cpuByRole.noneCount = 0;
        if ( creep.memory.role && !cpuByRole[creep.memory.role] ) cpuByRole[creep.memory.role] = 0;
        if ( creep.memory.role && !cpuByRole[creep.memory.role+'Count'] ) cpuByRole[creep.memory.role+'Count'] = 0;
        if ( creep.memory.role ) { cpuByRole[creep.memory.role] += creep.memory.usedCpu; cpuByRole[creep.memory.role+'Count'] += 1; } else { cpuByRole['none'] += creep.memory.usedCpu; cpuByRole['noneCount'] += 1; }
    }
}

function whatBase( creep ) {
    if ( creep.carry.energy == 0 ) creep.memory.base = null;
    var whichBase = null, whichRange = distRange;
    if ( !creep.memory.base ) {
        for( var spawnername in Game.spawns ) {
            var spawner = Game.spawns[spawnername];
            
            if ( spawner.room.memory.storedEnergy < storageLevel - 50000 ) {
                var ra = orange( creep, spawner ) + spawner.room.memory.storedEnergy / 10000;
                
                if ( ra < whichRange ) { whichBase = spawner; whichRange = ra; }
                // if ( ra < distRange && spawner.room.memory.storedEnergy < 200000 && spawner.room.memory.storedEnergy / 10000 < whichRange ) { whichBase = spawner; whichRange = spawner.room.memory.storedEnergy / 10000; }
            }
        }
        if ( whichBase ) creep.memory.base = whichBase.name; else creep.memory.base = null;
    } else {
        var spawner = null;
        if ( Game.spawns[creep.memory.base] ) spawner = Game.spawns[creep.memory.base];
        
        if ( spawner && spawner.room.memory.storedEnergy > storageLevel ) creep.memory.base = null; else whichBase = spawner;
    }
    return whichBase;
}

function addPart( body, part, n ) {
    var bl = body.length;
    if ( !body || body === undefined ) body = [];
    for ( var i = bl; i < bl + n && i < 50; i++ ) {
        body[i] = part;
    }
}

function evade( creep, enemy ) {
    cpuE = Game.getUsedCpu();
    creep.memory.moveOrder = 1;
    if ( creep.pos.findClosestByRange( FIND_STRUCTURES ) && creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_ROAD; } } ).pos.inRangeTo( creep, 0 ) && creep.getActiveBodyparts( HEAL ) < creep.hitsMax / 500 ) return;
    
    var tx = creep.pos.x;
    var ty = creep.pos.y;
    var avo = [];
    if ( creep.pos.inRangeTo( enemy, 4 ) && !creep.pos.inRangeTo( enemy, 1 ) ) avo = avoidMap( creep, enemy );

    for ( var e = 0; e < 12; e++ ) {
        if ( creep.pos.x < enemy.pos.x || creep.pos.x > 43 ) tx = Math.floor( Math.random() * 6 ) + 1;
        if ( creep.pos.x > enemy.pos.x || creep.pos.x < 7 ) tx =  Math.floor( Math.random() * 6 ) + 44;
        if ( creep.pos.y < enemy.pos.y || creep.pos.y > 43 ) ty = Math.floor( Math.random() * 6 ) + 1;
        if ( creep.pos.y > enemy.pos.y || creep.pos.y < 7 ) ty =  Math.floor( Math.random() * 6 ) + 44;
        
        if ( !collision( creep, tx, ty ) ) break;
    }

    if ( creep.hits < creep.hitsMax ) {
        var healer = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function(object) { return object.getActiveBodyparts(HEAL) > object.hitsMax / 500; }, ignoreCreeps: true } );
        if ( healer ) {
            var safeRange = 1;
            if ( creep.hits < creep.hitsMax * .4 ) safeRange = 4;
            if ( creep.pos.inRangeTo( healer ) < 5 && Game.getUsedCpu() < Game.cpuLimit - 50 ) {
                var pathToHealer = creep.pos.findPathTo( healer, { maxOps: maxNodes } );
                if ( pathToHealer.length > 0 && range( pathToHealer[0].x, pathToHealer[0].y, enemy.pos.x, enemy.pos.y ) > range( creep.pos.x, creep.pos.y, enemy.pos.x, enemy.pos.y ) && !creep.pos.inRangeTo( enemy, safeRange ) ) { tx = healer.pos.x; ty = healer.pos.y; }
            }
        }
    }

    var quickMove = {};
    quickMove.pos = creep.room.getPositionAt( tx, ty );

    if ( !collision( creep, tx, ty ) && !creep.pos.inRangeTo( enemy, mappingRange ) ) {
        emov( creep, quickMove );
    } else {
        if ( ( bypassCode || Game.flags['b'+creep.room.name] ) && creep.pos.x > 2 && creep.pos.x < 47 && creep.pos.y > 2 && creep.pos.y < 47 ) {
            if ( !creep.memory.mil ) bypass( creep, quickMove ); else creep.moveTo( creep.room.getPositionAt( tx, ty ), { avoid: avo, reusePath: 0 } );
        } else {
            creep.moveTo( creep.room.getPositionAt( tx, ty ), { avoid: avo, reusePath: 5, maxOps: maxNodes } ); 
        }
    }
    cpuE = Game.getUsedCpu() - cpuE;
    totEvadeCpu += cpuE;
}

function avoidMap( creep, hostile ) {
    var map = [];
    if ( !creep || !hostile ) return map;
    if ( hostile ) {
        var r = range( creep.pos.x, creep.pos.y, hostile.pos.x, hostile.pos.y );
        if ( r > 2 ) r = 2;
        if ( r < 1 ) r = 1;
        for ( var x = hostile.pos.x - r; x <= hostile.pos.x + r; x++ ) {
            for ( var y = hostile.pos.y - r; y <= hostile.pos.y + r; y++ ) {
                if ( hostile.room.getPositionAt( x, y ) ) if ( hostile.room.getPositionAt( x, y ) != creep.pos ) map[map.length] = hostile.room.getPositionAt( x, y );
            }
        }
    }
    return map;
}

function m( creep, dest, dodge ) {
    if ( dest && dest.pos ) creep.memory.lastMove = creep.pos + ' ' + dest.pos + ' R' + orange( creep, dest ); else creep.memory.lastMove = creep.pos + ' No Dest Info';
    if ( creep == dest || creep.fatigue > 0 || ( dest && dest.energyCapacity && dest.energyCapacity == 3000 && creep.pos.inRangeTo( dest, 1 ) ) || creep.getActiveBodyparts( MOVE ) == 0 || ( dest && dest.pos && creep.pos.x == dest.pos.x && creep.pos.y == dest.pos.y && creep.room == dest.room ) ) { creep.memory.moveOrder = 1; creep.memory.gridlock = 0; return; }
    
    if ( !creep.memory.moveOrder && creep.fatigue === 0 ) {
        var avo = [];
        // if ( dodge == 1 ) {
        //    var enemy = creep.pos.findClosestByRange( FIND_HOSTILE_CREEPS );
        //    if ( enemy && creep.pos.inRangeTo( enemy, 2 ) ) avo = avoidMap( creep, enemy );
        // } 
        var ig = true;
        if ( !creep.memory.gridlock ) creep.memory.gridlock = 0;
        if ( creep.memory.x1 == creep.memory.x3 && creep.memory.y1 == creep.memory.y3 && !creep.pos.inRangeTo( dest, 1 ) ) creep.memory.gridlock = creep.memory.gridlock + 1; else creep.memory.gridlock = 0;
        if ( creep.memory.gridlock > 3 || creep.memory.er < 2 || ( creep.memory.mil && creep.memory.gridlock > 0 ) ) ig = false;
        if ( creep.memory.gridlock > 2 && Math.random() < .4 ) { creep.memory.moveOrder = 1; return; }

        mov( creep, dest, avo, ig );
    }
}

function mov( creep, dest, avo, ig ) {
    var timeMove = Game.getUsedCpu();
    creep.memory.moveOrder = 1;
    creep.memory.epathed = false;
    creep.memory.mapping = false;

    // Store Distance Travelled
    if ( creep.memory.x1 != creep.pos.x || creep.memory.y1 != creep.pos.y ) if ( swamp( creep, creep.pos.x, creep.pos.y ) ) creep.memory.dist = creep.memory.dist + 8; else creep.memory.dist = creep.memory.dist + 1;

	// Save Movement Information
	creep.memory.x3 = creep.memory.x2;
	creep.memory.x2 = creep.memory.x1;
	creep.memory.x1 = creep.pos.x;
	creep.memory.y3 = creep.memory.y2;
	creep.memory.y2 = creep.memory.y1;
	creep.memory.y1 = creep.pos.y;

    var ru = 20;
    if ( creep.memory.mil || creep.memory.gridlock > 4 ) ru = 0;
    if ( !creep.memory.spr ) creep.memory.spr = 99;
    if ( creep.memory.spr < 4 && dest && orange( creep, dest ) < 4 ) ig = false;
    if ( !creep.memory.rx ) creep.memory.rx = 0;
    if ( !creep.memory.ry ) creep.memory.ry = 0;
    if ( creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49 ) ig = true;
    if ( creep.memory.rally && dest && dest.room == creep.room && ( ( dest.name && creep.memory.rally == dest.name ) && ( dest.pos.x !== undefined || dest.pos.y !== undefined ) && ( creep.memory.rx || creep.memory.ry ) ) ) {
        creep.memory.lastMove = creep.memory.lastMove + ' using rally code...  avo: ' + avo.length;
        if ( Game.getUsedCpu() < Game.cpuLimit - 50 ) creep.moveTo( dest.pos.x + creep.memory.rx, dest.pos.y + creep.memory.ry, { avoid: avo, reusePath: ru, ignoreCreeps: false, maxOps: maxNodes } ); else console.log( creep.name + ' aborting move for cpu...' );
    }
    else {
        var aRoom = creep.room;
        if ( dest && dest.room !== undefined ) aRoom = dest.room;
        if ( Game.flags.opt && ig && dest && dest.pos && dest.pos.x !== undefined && dest.pos.y !== undefined && aRoom.name !== undefined && orange( creep, dest ) > mappingRange && !Game.flags[ creep.room.name ] ) emov( creep, dest ); else {
            if ( !creep.memory.mil && orange( creep, dest ) < 40 && ( bypassCode || Game.flags['b'+creep.room.name] ) ) {
                creep.memory.lastMove = creep.memory.lastMove + ' using bypass code...  avo: ' + avo.length + '  Ig: ' + ig + '  dRange: ' + orange( creep, dest );
                bypass( creep, dest );
            } else {
                var tryQuick = reroute( creep, dest );
                if ( tryQuick != null ) aMoveTo( creep, tryQuick, avo, ru, ig, maxNodes ); else 
                    aMoveTo( creep, dest, avo, ru, ig, maxNodes ); 
            }
        }
    }
    creep.memory.lastMove = creep.memory.lastMove + ' MoveTime: ' + ( Math.floor( Game.getUsedCpu() - timeMove ) );
    creep.memory.mTime = Math.floor( ( Game.getUsedCpu() - timeMove ) * 100 ) / 100;
    Memory.mcpu += creep.memory.mTime;
} 

function aMoveTo( creep, dest, avo, ru, ig, maxNodes ) {
    if ( creep.memory.mil || Game.getUsedCpu() < Game.cpuLimit - pauseBot || creep.memory.er < 8 ) creep.moveTo( dest, { avoid: avo, reusePath: ru, ignoreCreeps: ig, maxOps: maxNodes } ); else Memory.pauseBots += 1;
}

function getDestTag( creep, dest ) {
    var aRoom = creep.room;
    if ( dest && dest.room !== undefined ) aRoom = dest.room;
    var destTag = aRoom.name;
    if ( creep.room == aRoom ) destTag = String.fromCharCode( Math.floor( dest.pos.x / mappingRange )+48, Math.floor( dest.pos.y / mappingRange )+48 ); else {
        var coo = mapCoord( destTag );
        destTag = String.fromCharCode( (97 + coo.x), (97 + coo.y) );
    }
    return destTag;    
}

function emov( creep, dest ) {
    if ( creep.room.memory.epath === undefined || !creep.room.memory.epath ) creep.room.memory.epath = {};
    var destTag = getDestTag( creep, dest );
    var curTag = String.fromCharCode( creep.pos.x+48, creep.pos.y+48 );
    if ( creep.room.memory.epath[curTag] === undefined ) creep.room.memory.epath[curTag] = {};
    if ( !creep.room.memory.epath[curTag][destTag] && Game.getUsedCpu() < Game.cpuLimit - 50 ) {
    	rSlow( creep.name + ' Mapping' );
        mapping++;
        creep.memory.mapping = true;
        var newPath = creep.pos.findPathTo( dest, { ignoreCreeps: true, maxOps: 4000 } ), newTag = null;
        // Store directions into map blocks
        for ( var i = 0; i < newPath.length; i++ ) {
            newTag = String.fromCharCode( newPath[i].x+48, newPath[i].y+48 );
            if ( creep.room.memory.epath[newTag] === undefined ) creep.room.memory.epath[newTag] = {};
            
            if ( i == 0 ) creep.room.memory.epath[curTag][destTag] = newPath[i].direction; 
            if ( i < newPath.length - 1 ) creep.room.memory.epath[newTag][destTag] = newPath[i+1].direction;
        }
    }
    if ( !creep.room.memory.epath[curTag][destTag] || creep.move( creep.room.memory.epath[curTag][destTag] ) ) {
        // console.log( creep.name + ' problem with epathing... ' + creep.room.name ); 
        bypass( creep, dest );
    }
    else {
        creep.memory.epathed = true;
    }
}

function reroute( creep, dest ) {
    var destTag = getDestTag( creep, dest );
    var lx = creep.pos.x, ly = creep.pos.y;
    for ( var i = 0; i < 7; i++ ) {
        if ( i == 0 || creep.room.lookForAt( 'creep', lx, ly ).length > 0 ) {
            var curTag = String.fromCharCode( lx+48, ly+48 );
            if ( creep.room.memory.ePath !== undefined && creep.room.memory.ePath[curTag] !== undefined && creep.room.memory.ePath[curTag][destTag] !== undefined ) {
                var dir = creep.room.memory.ePath[curTag][destTag];
                if ( dir == 1 ) { ly -= 1; }
                if ( dir == 2 ) { lx += 1; ly -= 1; }
                if ( dir == 3 ) { lx += 1; }
                if ( dir == 4 ) { lx += 1; ly += 1; }
                if ( dir == 5 ) { ly += 1; }
                if ( dir == 6 ) { lx -= 1; ly += 1; }
                if ( dir == 7 ) { lx -= 1; }
                if ( dir == 8 ) { lx -= 1; ly -= 1; }
            } else break;
        } else return creep.room.getPositionAt( lx, ly );
    }
    return null;
}

function bypass( creep, dest ) {
    if ( creep.room != dest.room || Game.flags[ creep.room.name ] ) { aMoveTo( creep, dest, [], 5, false, 2000 ); return; }
    if ( orange( creep, dest ) < 1 ) { creep.memory.moveOrder = 0; return; }
    var xMin = creep.pos.x - 1, xMax = creep.pos.x + 1, yMin = creep.pos.y - 1, yMax = creep.pos.y + 1, favX = creep.pos.x, favY = creep.pos.y, fav = -90, likeThis = 0;
    
    for ( var tx = xMin; tx < xMax + 1; tx++ ) {
        for ( var ty = yMin; ty < yMax + 1; ty++ ) {
            if ( tx > -1 && tx < 50 && ty > -1 && ty < 50 && !( tx == creep.pos.x && ty == creep.pos.y ) ) {
                var lk = creep.room.lookAt( tx, ty ), likeThis = 0, isCreep = false;
                for ( var i = 0; i < lk.length; i++ ) {
                    if ( lk[i].type == 'structure' && lk[i].structure.structureType == STRUCTURE_ROAD ) likeThis += 1; else if ( lk[i].type == 'terrain' && lk[i].terrain == 'swamp' ) likeThis -= 4;
                    if ( lk[i].type == 'creep' && !creep.memory.mil ) isCreep = true;
                    if ( lk[i].type == 'structure' && lk[i].structure.structureType != STRUCTURE_ROAD && lk[i].structure.structureType != STRUCTURE_RAMPART ) likeThis = -999;
                    if ( lk[i].type == 'terrain' && lk[i].terrain == 'wall' ) likeThis = -999;
                    if ( range( creep.pos.x, creep.pos.y, dest.pos.x, dest.pos.y ) > range( tx, ty, dest.pos.x, dest.pos.y ) ) likeThis += 7;
                    if ( range( creep.pos.x, creep.pos.y, dest.pos.x, dest.pos.y ) < range( tx, ty, dest.pos.x, dest.pos.y ) ) likeThis -= 7;
                    if ( tx == creep.memory.x2 && ty == creep.memory.y2 ) likeThis -= 10;
                }
                if ( isCreep && creep.memory.gridlock > 3 ) likeThis -= 50;
                if ( likeThis > fav ) { fav = likeThis; favX = tx; favY = ty; }
            }
        }
    }
    if ( fav > -90 ) { creep.move( creep.pos.getDirectionTo( favX, favY ) ); }
}

function rampa( rm, tx, ty ) {
    var lk = rm.lookAt( tx, ty );
    for ( var i = 0; i < lk.length; i++ ) {
        if ( lk[i].type == 'terrain' && lk[i].terrain == 'wall' ) return true;
        if ( lk[i].type == 'structure' && lk[i].structure.structureType == STRUCTURE_WALL ) return true;
        if ( lk[i].type == 'structure' && lk[i].structure.structureType == STRUCTURE_RAMPART ) return true;
    }
    
    return false;
}

function roa( rm, tx, ty ) {
    var lk = rm.lookAt( tx, ty );
    for ( var i = 0; i < lk.length; i++ ) {
        if ( lk[i].type == 'terrain' && lk[i].terrain == 'wall' ) return true;
        if ( lk[i].type == 'structure' && lk[i].structure.structureType == STRUCTURE_WALL ) return true;
        if ( lk[i].type == 'structure' && lk[i].structure.structureType == STRUCTURE_ROAD ) return true;
    }
    
    return false;
}

function wall( rm, tx, ty ) {
    var lk = rm.lookAt( tx, ty );
    for ( var i = 0; i < lk.length; i++ ) {
        if ( lk[i].type == 'terrain' && lk[i].terrain == 'wall' ) return true;
        if ( lk[i].type == 'structure' && lk[i].structure.structureType == STRUCTURE_WALL ) return true;
    }
    
    return false;
}

function collision( creep, tx, ty ) {
    var lk = creep.room.lookAt( tx, ty );
    for ( var i = 0; i < lk.length; i++ ) {
        if ( lk[i].type == 'terrain' && lk[i].terrain == 'wall' ) return true;
    }
    
    return false;
}
 
function swamp( creep, tx, ty ) {
    var lk = creep.room.lookAt( tx, ty );
    for ( var i = 0; i < lk.length; i++ ) {
        if ( lk[i].type == 'terrain' && lk[i].terrain == 'swamp' ) return true;
    }
    
    return false;
}
 
function range(x1,y1,x2,y2) {
    var d1 = Math.abs(x1-x2);
    if ( Math.abs(y2-y1) > d1 ) d1 = Math.abs(y2-y1);
    return d1;
}

function mapCoord( mn ) {
    var mx = mn.substring( 1, mn.indexOf( "N" ) );
    var my = mn.substring( mn.indexOf( "N" ) + 1, mn.length );
    var coo = { x: mx, y: my };
    return coo;
}

function orange(creep,target) {
    if ( !target ) return 99;
    var roomRange = 0;
    if ( creep.room != target.room && target.room && creep.room ) {
        var cmx = mapCoord( creep.room.name ).x, cmy = mapCoord( creep.room.name ).y, tmx = mapCoord( target.room.name ).x, tmy = mapCoord( target.room.name ).y;
        roomRange = ( Math.abs( cmx-tmx ) + Math.abs( cmy-tmy ) ) * 60;
    }
    return range( creep.pos.x, creep.pos.y, target.pos.x, target.pos.y ) + roomRange;
}
