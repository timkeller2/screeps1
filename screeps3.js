var avail = 0, encumbered = 0, hostility = 0, cpuR = 0, cpuC = 0, cpuS = 0, roomsexp = 0, loot = null, lootAmount = 0, lootroom = '', notHurt = true, tempStorageLimit = 3000, hostileName = '', hostileRoom = '', topUser = null, topUserAmount = 0, maxHostile = 9999, allDrop = [], harvFull = .75, mapping = 0, totalStored = 0, totalFriends = 0, totEvadeCpu = 0;
var maxNodes = 4000, allies = [ 'theAEmix', 'Waveofbabies', 'Vertigan', 'Rumatah' ], storageLevel = 900000, minBuild = 250000, skipCpuLevel = 75, distRange = 150, mappingRange = 5, bypassCode = false, rampartMult = 1500, growthRate = 10;

runScreeps();


function runScreeps() {
    rF();  // Run Flags
    rR();  // Run Rooms
    rC();  // Run Creeps
    if ( Game.getUsedCpu() < Game.cpuLimit - 25 || Game.time / 12 == Math.floor( Game.time / 12 ) ) rS(); else console.log( 'Skipping spawners for cpu ' + Game.time + ': ' + Math.floor( Game.getUsedCpu() ) );  // Run Spawners
    
    Memory.cpu = Memory.cpu + cpuR + cpuC + cpuS;
    Memory.lastcpu = cpuR + cpuC + cpuS;
    
    if( cpuR + cpuC + cpuS > 300 ) console.log( 'CPU: Rooms: '+ Math.floor( cpuR ) + '  Creeps: ' + Math.floor( cpuC ) + '  Spawners: ' + Math.floor( cpuS ) + '  Top User: ' + topUser.name + ' ' + topUser.pos + '  e: ' + topUser.memory.epathed +  '  CPU: ' + topUser.memory.usedCpu1 + ', ' + topUser.memory.usedCpu2 + ', ' + topUser.memory.usedCpu3 + ', Total: ' + topUser.memory.usedCpu + '  Creeps Mapping: ' + mapping );
    if ( totEvadeCpu > 50 ) console.log( 'Evasion Cpu: ' + totEvadeCpu );
    
    if ( Game.time / 10 == Math.floor( Game.time / 10 ) ) {
        if ( Game.flags.houseCleaning ) houseCleaning();
        console.log( ' ' );
        console.log( 'TURN ' + Game.time + '  -------------------------------------------------------------------------------------------------------------------------- ' );
        for( var ms in Game.spawns ) { 
            var sp = Game.spawns[ms];
            var creep = sp.spawning ? sp.spawning.name : '';
            console.log( sp.name + '  Rooms: ' + roomsexp + '  Bots: ' + sp.memory.friends + '  Mil: '+ sp.memory.military + '  Art: '+ sp.memory.artillery + '  Heal: '+ sp.memory.healers +'  Carry: ' + sp.memory.carriers + '  Builds: ' + sp.memory.parts*3 + '/1500  Dying: '+ sp.memory.sick + '% load   Stored: ' + sp.room.memory.storedEnergy + '  Spawning: ' + creep );
            totalFriends += sp.memory.friends;
        }
        console.log( 'Total Stored: ' + totalStored + '  Avail: ' + avail + ' - ' + encumbered + ' = ' + Math.floor( avail - encumbered ) + '   Hostility: ' + hostility + ' ' + hostileName + ' ' + hostileRoom + '  Loot: ' + lootAmount + ' in '+lootroom+'  AvCpu: ' + Math.floor(Memory.cpu/10) + '/' + Game.cpuLimit + '  Skipped Bots: ' + Math.floor( Memory.skips / 10 ) + '/' + totalFriends );
        Memory.cpu = 0;
        Memory.skips = 0;
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
            delete Memory.flags[i];
        }
    }   
    Game.flags.houseCleaning.remove();
}

function rF() {
    for ( var flagname in Game.flags ) {
        var fl = Game.flags[flagname];
        
        if ( fl.room ) {
            if ( Game.time / 7 == Math.floor( Game.time / 7 ) ) {
                var ener = fl.pos.findInRange( FIND_DROPPED_ENERGY, 2 ), tot = 0;
                for ( var i = 0; i < ener.length; i++ ) { tot += ener[i].energy; }
                fl.memory.tot = tot;
                if ( fl.memory.dist > 350 ) fl.memory.dist = 50;
                if ( fl.memory.dist < fl.memory.tot / 50 ) fl.memory.dist = Math.floor( fl.memory.tot / 50 );
            }
        }
    }
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
                rm.memory.repath = Game.time + 25000 + Math.floor( Math.random() * 5000 );
                rm.memory.epath = null;
                console.log( 'Repathing ' + rm.name );
            }
        }
        
        // Self Growing Defensive Structures
        var sites = rm.find( FIND_CONSTRUCTION_SITES ).length;
        if ( Game.time / 30 == Math.floor( Game.time / 30 ) && sites < growthRate ) {
            // Ramparts
            var ramparts = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_RAMPART && ( object.pos.x == 2 || object.pos.x == 47 || object.pos.y == 2 || object.pos.y == 47 ); } } );
            for ( var i = 0; i < ramparts.length && sites < growthRate; i++ ) {
                var ram = ramparts[i];
                if ( ram.pos.x == 2 || ram.pos.x == 47 ) {
                    if ( !wall( rm, ram.pos.x, ram.pos.y - 1 ) && rm.createConstructionSite( ram.pos.x, ram.pos.y - 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                    if ( !wall( rm, ram.pos.x, ram.pos.y + 1 ) && rm.createConstructionSite( ram.pos.x, ram.pos.y + 1, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                }
                if ( ram.pos.y == 2 || ram.pos.y == 47 ) {
                    if ( !wall( rm, ram.pos.x - 1, ram.pos.y ) && rm.createConstructionSite( ram.pos.x - 1, ram.pos.y, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                    if ( !wall( rm, ram.pos.x + 1, ram.pos.y ) && rm.createConstructionSite( ram.pos.x + 1, ram.pos.y, STRUCTURE_RAMPART ) == 0 ) { sites++; }
                }
            }
            
            var extensions = rm.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_EXTENSION; } } );
            for ( var i = 0; i < extensions.length && sites < growthRate; i++ ) {
                var ram = extensions[i];
                if ( !wall( rm, ram.pos.x, ram.pos.y - 1 ) && rm.createConstructionSite( ram.pos.x, ram.pos.y - 1, STRUCTURE_ROAD ) == 0 ) { sites++; }
                if ( !wall( rm, ram.pos.x, ram.pos.y + 1 ) && rm.createConstructionSite( ram.pos.x, ram.pos.y + 1, STRUCTURE_ROAD ) == 0 ) { sites++; }
                if ( !wall( rm, ram.pos.x - 1, ram.pos.y ) && rm.createConstructionSite( ram.pos.x - 1, ram.pos.y, STRUCTURE_ROAD ) == 0 ) { sites++; }
                if ( !wall( rm, ram.pos.x + 1, ram.pos.y ) && rm.createConstructionSite( ram.pos.x + 1, ram.pos.y, STRUCTURE_ROAD ) == 0 ) { sites++; }
            }
            
            if ( sites > 0 ) console.log( rm.name + ' ' + sites + ' sites' );
        }
        
        rm.memory.availEnergy = rm.find( FIND_DROPPED_ENERGY, { filter: function(object) { return !( object.pos.lookFor('creep').length > 0 && object.pos.lookFor('creep')[0].owner.username == 'Vision' && object.pos.lookFor('creep')[0].memory.role == 'storage' && !object.pos.lookFor('creep')[0].memory.linked ); } } );
        rm.memory.storedEnergy = rm.find( FIND_DROPPED_ENERGY, { filter: function(object) { return object.pos.lookFor('creep').length > 0 && object.pos.lookFor('creep')[0].owner.username == 'Vision' && object.pos.lookFor('creep')[0].memory.role == 'storage' && !object.pos.lookFor('creep')[0].memory.linked; } } );
        rm.memory.allEnergy = rm.find( FIND_DROPPED_ENERGY );

        for ( var i = 0; i < rm.memory.allEnergy.length; i++ ) {
            var thisE = rm.memory.allEnergy[i], aD = allDrop.length;
            if ( thisE.pos.lookFor('creep').length > 0 && thisE.pos.lookFor('creep')[0].owner.username == 'Vision' && thisE.pos.lookFor('creep')[0].memory.role == 'storage' ) thisE.storage = 1; else thisE.storage = 0;
            
            allDrop[aD] = rm.memory.allEnergy[i];
            allDrop[aD].enc = 0;
            
            for ( var name in Game.creeps ) { var creep = Game.creeps[name]; if ( creep.memory.loot && creep.memory.loot == allDrop[aD].id ) allDrop[aD].enc += ( creep.carryCapacity - creep.carry.energy ); }
            encumbered += allDrop[aD].enc;
        }

        var totEnergy = 0;
        for ( var i = 0; i < rm.memory.availEnergy.length; i++ ) { 
            avail += rm.memory.availEnergy[i].energy;
            totEnergy += rm.memory.availEnergy[i].energy;
            if ( rm.memory.availEnergy[i].pos.lookFor('creep').length > 0 && rm.memory.availEnergy[i].pos.lookFor('creep')[0].owner.username == 'Vision' ) rm.memory.availEnergy[i].pos.lookFor('creep')[0].memory.storedEnergy = rm.memory.availEnergy[i].energy * -1;
            if ( rm.memory.availEnergy[i].energy > lootAmount ) { lootAmount = rm.memory.availEnergy[i].energy; loot = rm.memory.availEnergy[i]; lootroom = rm.name; }
        }
        for ( var i = 0; i < rm.memory.storedEnergy.length; i++ ) { stored += rm.memory.storedEnergy[i].energy; rm.memory.storedEnergy[i].pos.lookFor('creep')[0].memory.storedEnergy = rm.memory.storedEnergy[i].energy * -1; }
        if ( rm.storage && rm.storage.owner.username == 'Vision' ) stored += rm.storage.store.energy;
        
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
        if ( rm.storage ) rm.memory.tempStorageLimit = 600; else rm.memory.tempStorageLimit = tempStorageLimit;
        if ( Game.time / 3 == Math.floor( Game.time / 3) ) rm.memory.noExtNeed = false;
        totalStored += stored;
    }
    cpuR = Game.getUsedCpu() - cpuR;
}

function rS() {
    cpuS = Game.getUsedCpu();
    for( var spawnername in Game.spawns ) {
        var spawner = Game.spawns[spawnername];
        if ( Game.getUsedCpu() > Game.cpuLimit - 25 ) { console.log( 'Skipping spawner '+spawner.name+' for cpu ' + Game.time + ': ' + Math.floor( Game.getUsedCpu() ) ); continue; }

        // Map energy storage support
        var stor = spawner.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role == 'storage'; } } );
        if ( !stor && spawner.room.storage && spawner.room.storage.pos.inRangeTo( spawner, 1 ) && spawner.energy < 300 ) { spawner.room.storage.transferEnergy( spawner );  }
	    var link = spawner.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.pos.inRangeTo( spawner, 1 ) && object.structureType == STRUCTURE_LINK; } } );
	    if ( link && link.energy < 500 ) spawner.room.storage.transferEnergy( link );
	    var emptyLink = spawner.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.pos.inRangeTo( spawner, 1 ) && object.energy == 0 && object.structureType == STRUCTURE_LINK && !object.pos.inRangeTo( spawner.room.storage, 2 ); } } );
	    if ( emptyLink && link && link.energy > 0 && link.cooldown == 0 && !spawner.room.memory.linkBeam ) { link.transferEnergy( emptyLink ); spawner.room.memory.linkBeam = true; }
            

        if ( !spawner.spawning ) {
            var suf = spawner.name;
    
            var ex = spawner.room.find( FIND_STRUCTURES, { filter: function( object ) { return object.energyCapacity == 50; } } ).length;
            var exe = Math.floor( ( spawner.room.energyAvailable - 300 ) / 50 );
            if ( exe < 0 ) exe = 0;
            var enemies = spawner.room.find( FIND_HOSTILE_CREEPS, { filter: function( object ) { return ( object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 ) && object.hitsMax < maxHostile && allies.indexOf( object.owner.username ) < 0; } } );
            var friends = spawner.room.find( FIND_MY_CREEPS );
            var sites = spawner.room.find( FIND_CONSTRUCTION_SITES );
            var rampartlevel = spawner.room.controller.level * spawner.room.controller.level * rampartMult;
    	    var repairSites = spawner.room.find( FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.hits < object.hitsMax / 2 && object.hits < rampartlevel / 2; } } );
            
            spawner.memory.friends = 0;
            spawner.memory.military = 0;
            spawner.memory.artillery = 0;
            spawner.memory.healers = 0;
            spawner.memory.parts = 0;
            spawner.memory.sick = 0;
            spawner.memory.carriers = 0;
            spawner.memory.ex = ex;
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
            for ( var i = 0; i < 12; i++ ) { if ( Game.flags['m'+i+suf] && Game.creeps['m'+i+suf] === undefined && Game.creeps['m'+i+suf+'bu'] === undefined ) minersGood = false; }
    
            // Try for big but adjust if needed
            var eex = ex;
            if ( spawner.memory.spawnLag > 30 || friends < 3 ) eex = exe;
    
            // Econ Units
            var m = [];  if ( eex < 10 ) { addPart(m,WORK,2);  addPart(m, CARRY, 1 ); addPart(m,MOVE,1); if ( eex > 4 ) { addPart(m,WORK,1); addPart(m,MOVE,2); } } else { addPart(m,WORK,5); addPart(m,MOVE,5); } 
            var lm = []; if ( eex < 10 ) { addPart(lm,WORK,2);  addPart(lm, CARRY, 1 ); addPart(lm,MOVE,1); if ( eex > 4 ) { addPart(lm,WORK,2); } } else { addPart(lm,WORK,5); addPart(lm,MOVE,3); }
            var rr = []; addPart(rr,WORK,17); addPart(rr,MOVE,18);  addPart(rr,HEAL,1);   // After roads: addPart(rr,WORK,31); addPart(rr,MOVE,17);  addPart(rr,HEAL,2);
            var w = [];  if ( ex < 80 ) { addPart(w,WORK,2+Math.floor(ex/2)-Math.floor(ex/7)); addPart(w,CARRY,1); addPart(w,MOVE,1+Math.floor(ex/15)); } else { addPart(w,WORK,44); addPart(w,CARRY,3); addPart(w,MOVE,3); }  
            var hw = []; if ( ex < 60 ) { addPart(hw,WORK,1+Math.floor(ex/8)); addPart(hw,CARRY,3+Math.floor(ex/2)); addPart(hw,MOVE,1+Math.floor(ex/8)); } else { addPart(hw,WORK,10); addPart(hw,CARRY,30); addPart(hw,MOVE,10); }
            var rw = []; if ( ex < 50 ) { addPart(rw,WORK,1+Math.floor(ex/3)); addPart(rw,CARRY,1); addPart(rw,MOVE,2+Math.floor(ex/3)); } else { addPart(rw,WORK,15); addPart(rw,CARRY,2); addPart(rw,MOVE,17); }
            var c = [];  if ( ex < 45 ) { addPart(c,CARRY,3+Math.floor(ex/2)); addPart(c,MOVE,3+Math.floor(ex/2)); } else { addPart(c,CARRY,25); addPart(c,MOVE,25); }
            var cc = []; if ( exe < 45 ) { addPart(cc,CARRY,4+Math.floor(exe/3)*2); addPart(cc,MOVE,2+Math.floor(exe/3)); } else { addPart(cc,CARRY,32); addPart(cc,MOVE,16); }
            var wc = []; if ( eex < 45 ) { addPart(wc,CARRY,4+Math.floor(exe/3)*2); addPart(wc,MOVE,2+Math.floor(exe/3)); } else { addPart(wc,CARRY,32); addPart(wc,MOVE,16); }
            var lc = []; if ( exe < 45 ) { addPart(lc,CARRY,2+Math.floor(Math.floor(exe/2))); addPart(lc,MOVE,2+Math.floor(exe/2)); } else { addPart(lc,CARRY,25); addPart(lc,MOVE,25);  }
            var s = [];  addPart(s,CARRY,5); addPart(s,MOVE,1); if ( eex > 4 ) addPart(s,CARRY,5); if ( eex > 9 ) addPart(s,CARRY,5); if ( eex > 14 ) addPart(s,CARRY,5); if ( eex > 19 ) addPart(s,CARRY,5); if ( eex > 24 ) addPart(s,CARRY,5);
            var o = [MOVE,CARRY];
            var l = [MOVE,CARRY,CARRY];
            var lw = [CARRY,WORK,MOVE];
            var lg = [MOVE,ATTACK];
            var lh = [MOVE,HEAL];
            var la = [MOVE,RANGED_ATTACK];
    
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
            var axh = []; addPart(axh,MOVE,24); addPart(axh,RANGED_ATTACK,17); addPart(axh,HEAL,8); addPart(axh,MOVE,1); 
            var hxh = []; addPart(hxh,MOVE,15); addPart(hxh,HEAL,15); 
            
            // Anti-Seeker
            var axhh = []; addPart(axhh,MOVE,12); addPart(axhh,RANGED_ATTACK,16); addPart(axhh,HEAL,8); addPart(axhh,MOVE,1);
            
            // Base Military Units
            var g = []; if ( exe < 15 ) { addPart(g,TOUGH,4+Math.floor(exe/3)*2); addPart(g,ATTACK,2+Math.floor(exe/3)); addPart(g,MOVE,2+Math.floor(exe/3)); }
            else if ( exe < 30 ) { addPart(g,CARRY,3+Math.floor(exe/4)); addPart(g,ATTACK,1+Math.floor(exe/4)); addPart(g,MOVE,1+Math.floor(exe/4)); }
            var a = []; if ( eex < 57 ) { addPart(a,RANGED_ATTACK,1+Math.floor(eex/4)); addPart(a,MOVE,1+Math.floor(eex/4)); } else { addPart(a,RANGED_ATTACK,15); addPart(a,MOVE,15); };
            var h = []; if ( eex < 90 ) { addPart(h,HEAL,1+Math.floor(eex/6)); addPart(h,MOVE,1+Math.floor(eex/6)); } else { addPart(h,HEAL,15); addPart(h,MOVE,15); }
            
            // Advanced Military Units
            var t = [];  addPart(t,ATTACK,3+Math.floor(ex/2));  addPart(t,MOVE,1);
            var b = [];  if ( eex < 30 ) { addPart(b,MOVE,1); addPart(b,RANGED_ATTACK,1+Math.floor(ex/3)); } else { var bstr = Math.floor(ex/3); if ( bstr > hostility + 10 ) bstr = hostility + 10; if ( bstr > 30 ) bstr = 30; addPart(b,MOVE,Math.floor(bstr/10)+1); addPart(b,RANGED_ATTACK,bstr); }
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
                        var sameRoom = false;
                        if ( spawner.room == Game.flags['m'+i+suf].room ) sameRoom = true;
                        var mineDist = Game.flags['m'+i+suf].memory.dist;
                        var maxCarry = Math.floor( ex / 2 + 3 );
                        // if ( maxCarry > 20 && sameRoom ) maxCarry = 20;
                        // if ( maxCarry > 15 && !sameRoom ) maxCarry = 15;
                        if ( maxCarry > 32 && sameRoom ) maxCarry = 32;
                        if ( maxCarry > 25 && !sameRoom ) maxCarry = 25;
                        var needCarry = Math.floor( mineDist / 2.2 );
                        var helpers = 1;
                        var eachCarry = needCarry;
                        if ( needCarry > maxCarry ) {
                            helpers = Math.floor( needCarry / maxCarry ) + 1;
                            eachCarry = Math.floor( needCarry / helpers );
                        }
                        if ( eachCarry < 3 ) eachCarry = 3;
                        if ( sameRoom && eachCarry < 4 ) eachCarry = 4;
                        var eachMove = eachCarry;
                        if ( sameRoom ) eachMove = Math.floor( ( eachCarry + 1 ) / 2 );
                        var vc = [];  addPart(vc,CARRY,eachCarry);  addPart(vc,MOVE,eachMove);  // Create just the right bot for the mine...
                        if ( helpers > 7 ) helpers = 7;
                        if ( mineDist < 5 ) helpers = 0;
                        for ( var aid = helpers - 1; aid > -1; aid-- ) {
                            if ( Game.time / ( aid * 3 ) == Math.floor( Game.time / ( aid * 3 ) ) ) {
                                if ( aid > 0 ) {
                                    var ref = aid-1;
                                    if ( Game.creeps['m'+i+suf+'c'+ref] !== undefined && Game.creeps['m'+i+suf+'c'+aid] === undefined && spawner.createCreep( vc, 'm'+i+suf+'c'+aid, { role: 'harv', target: 'm'+i+suf } ) === 0 ) continue;
                                } else {
                                    if ( Game.creeps['m'+i+suf+'c'+aid] === undefined && Game.creeps['m'+i+suf+'c'+aid] === undefined && spawner.createCreep( vc, 'm'+i+suf+'c'+aid, { role: 'harv', target: 'm'+i+suf } ) === 0 ) continue;
                                }
                            }
                        }
                    }
                    
                    // Roving Haulers
                    if ( avail - encumbered > 20000 + i * 20000 && i < 5 && Game.creeps['c'+i] === undefined && spawner.room.memory.storedEnergy > 25000 ) { if ( spawner.createCreep( c, 'c'+i, { role: 'harv' } ) === 0 ) continue; }
                    
                    if ( ( Game.flags['c'+i+suf]   || Game.flags['oc'+i+suf] )   && Game.creeps['c'+i+suf] === undefined ) { if ( spawner.createCreep( c, 'c'+i+suf, { role: 'harv' } ) === 0 ) continue; }
                    if ( ( Game.flags['cs'+i+suf]  || Game.flags['ocs'+i+suf] )  && Game.creeps['cs'+i+suf]  === undefined )  { if ( spawner.createCreep( c, 'cs'+i+suf, { role: 'sup' } ) === 0 ) continue; }
                    if ( ( Game.flags['wc'+i+suf]  || Game.flags['owc'+i+suf] )  && Game.creeps['wc'+i+suf]  === undefined )  { if ( spawner.createCreep( wc, 'wc'+i+suf, { role: 'sup', noExt: true } ) === 0 ) continue; }
                    
                    if ( ( Game.flags['hw'+i+suf]  || Game.flags['ohw'+i+suf] || ( i < Math.floor( spawner.room.memory.storedEnergy / 2500 ) && i < 1 && ( sites.length > 12 || repairSites.length > 24 ) && spawner.room.memory.storedEnergy > 10000 ) ) && Game.creeps['hw'+i+suf] === undefined ) if ( spawner.createCreep( hw, 'hw'+i+suf, { role: 'sup' } ) === 0 ) continue;
                    if ( ( Game.flags['hwx'+i]  || Game.flags['ohwx'+i] ) && Game.creeps['hwx'+i] === undefined ) if ( spawner.createCreep( hwx, 'hwx'+i, { role: 'sup', rally: 'hwx'+i } ) === 0 ) continue;
                    if ( ( Game.flags['rw'+i]  || Game.flags['orw'+i] ) && Game.creeps['rw'+i] === undefined ) if ( spawner.createCreep( rw, 'rw'+i, { role: 'worker' } ) === 0 ) continue;
                    if ( ( Game.flags['wl'+i+suf]  || Game.flags['owl'+i+suf] ) && Game.creeps['wl'+i+suf] === undefined ) if ( spawner.createCreep( w, 'wl'+i+suf, { role: 'worker' } ) === 0 ) continue;
                    if ( ( Game.flags['rm'+i+suf]  || Game.flags['orm'+i+suf] ) && Game.creeps['rm'+i+suf] === undefined ) if ( spawner.createCreep( m, 'rm'+i+suf, { role: 'miner' } ) === 0 ) continue;
                    
                    if ( ( Game.flags['rr'+i]  || Game.flags['orr'+i] ) && ( Game.creeps['rr'+i] === undefined ||  Game.creeps['rr'+i+'bu'] === undefined ) ) {
                        if ( Game.creeps['rr'+i+'bu'] === undefined || Game.creeps['rr'+i+'bu'].ticksToLive < 400 ) if ( Game.creeps['rr'+i] === undefined ) spawner.createCreep( rr, 'rr'+i, { rally: 'rr'+i, role: 'miner' } ); 
                        if ( Game.creeps['rr'+i] && Game.creeps['rr'+i].ticksToLive < 400 ) if ( Game.creeps['rr'+i+'bu'] === undefined ) spawner.createCreep( rr, 'rr'+i+'bu', { rally: 'rr'+i, role: 'miner' } ); 
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
                    if ( ( spawner.room.memory.storedEnergy > minBuild ) && ( Game.flags['qm'+i] || Game.flags['oqm'+i] ) && Game.flags['qm'+i+'x'] === undefined ) {  
                        var targetRoom = null;
                        if ( Game.flags['qm'+i] ) targetRoom = Game.flags['qm'+i].room;
                        if ( !targetRoom && Game.flags['oqm'+i] ) targetRoom = Game.flags['oqm'+i].room;
                        for ( var ii = 3 + Math.floor( targetRoom ? targetRoom.memory.totalEnergy / 5000 : 0 ); ii > -1; ii-- ) { if ( targetRoom && targetRoom.memory.totalEnergy > 2000 && Game.creeps['c'+i+'qmc'+ii] === undefined && spawner.createCreep( c, 'c'+i+'qmc'+ii, { rally: 'qm'+i, role: 'harv' } ) === 0 ) continue; }
                        for ( var ii = 0; ii < 2; ii++ ) {
                            if ( Game.creeps['rr'+i+'qm'+ii+'bu'] === undefined || Game.creeps['rr'+i+'qm'+ii+'bu'].ticksToLive < 400 ) if ( Game.creeps['rr'+i+'qm'+ii] === undefined ) spawner.createCreep( rr, 'rr'+i+'qm'+ii, { rally: 'qm'+i, role: 'miner' } ); 
                            if ( Game.creeps['rr'+i+'qm'+ii] && Game.creeps['rr'+i+'qm'+ii].ticksToLive < 400 ) if ( Game.creeps['rr'+i+'qm'+ii+'bu'] === undefined ) spawner.createCreep( rr, 'rr'+i+'qm'+ii+'bu', { rally: 'qm'+i, role: 'miner' } ); 
                        }
                        if ( Game.creeps['a'+i+'qm1'] === undefined || Game.creeps['a'+i+'qm1'].ticksToLive < 300 ) {
                            // if ( Game.creeps['a'+i+'qm0c'] === undefined ) if ( spawner.createCreep( alx, 'a'+i+'qm0c', { escort: 'a'+i+'qm0', rally: 'qm'+i } ) === 0 ) continue;
                            // if ( Game.creeps['a'+i+'qm0b'] === undefined ) if ( spawner.createCreep( hxl, 'a'+i+'qm0b', { escort: 'a'+i+'qm0', rally: 'qm'+i } ) === 0 ) continue;
                            // if ( Game.creeps['a'+i+'qm0a'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'qm0a', { escort: 'a'+i+'qm0', rally: 'qm'+i } ) === 0 ) continue;
                            if ( Game.creeps['a'+i+'qm0'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'qm0',  { rally: 'qm'+i } ) === 0 ) continue;
                        }
                        if ( Game.creeps['a'+i+'qm0'] !== undefined && Game.creeps['a'+i+'qm0'].ticksToLive < 300 ) {
                            // if ( Game.creeps['a'+i+'qm1c'] === undefined ) if ( spawner.createCreep( alx, 'a'+i+'qm1c', { escort: 'a'+i+'qm1', rally: 'qm'+i } ) === 0 ) continue;
                            // if ( Game.creeps['a'+i+'qm1b'] === undefined ) if ( spawner.createCreep( hxl, 'a'+i+'qm1b', { escort: 'a'+i+'qm1', rally: 'qm'+i } ) === 0 ) continue;
                            // if ( Game.creeps['a'+i+'qm1a'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'qm1a', { escort: 'a'+i+'qm1', rally: 'qm'+i } ) === 0 ) continue;
                            if ( Game.creeps['a'+i+'qm1'] === undefined ) if ( spawner.createCreep( axh, 'a'+i+'qm1', { rally: 'qm'+i } ) === 0 ) continue;
                        }
                    }
    
                    // Attempt at cheaper seeker clearance
                    if ( ( spawner.room.memory.storedEnergy > minBuild ) && ( Game.flags['qz'+i] || Game.flags['oqz'+i] ) && Game.flags['qz'+i+'x'] === undefined ) {  
                        var targetRoom = null;
                        if ( Game.flags['qz'+i] ) targetRoom = Game.flags['qz'+i].room;
                        if ( !targetRoom && Game.flags['oqz'+i] ) targetRoom = Game.flags['oqz'+i].room;
                        for ( var ii = 3 + Math.floor( targetRoom ? targetRoom.memory.totalEnergy / 3500 : 0 ); ii > -1; ii-- ) { if ( targetRoom && targetRoom.memory.totalEnergy > 2000 && Game.creeps['c'+i+'qzc'+ii] === undefined && spawner.createCreep( c, 'c'+i+'qzc'+ii, { rally: 'qz'+i, role: 'harv' } ) === 0 ) continue; }
                        for ( var ii = 0; ii < 1; ii++ ) {
                            if ( Game.creeps['rr'+i+'qz'+ii+'bu'] === undefined || Game.creeps['rr'+i+'qz'+ii+'bu'].ticksToLive < 400 ) if ( Game.creeps['rr'+i+'qz'+ii] === undefined ) spawner.createCreep( rr, 'rr'+i+'qz'+ii, { rally: 'qz'+i, role: 'miner' } ); 
                            if ( Game.creeps['rr'+i+'qz'+ii] && Game.creeps['rr'+i+'qz'+ii].ticksToLive < 400 ) if ( Game.creeps['rr'+i+'qz'+ii+'bu'] === undefined ) spawner.createCreep( rr, 'rr'+i+'qz'+ii+'bu', { rally: 'qz'+i, role: 'miner' } ); 
                        }
                        if ( Game.creeps['a'+i+'qz1'] === undefined || Game.creeps['a'+i+'qz1'].ticksToLive < 300 ) {
                            if ( Game.creeps['a'+i+'qz0'] === undefined ) if ( spawner.createCreep( axhh, 'a'+i+'qz0',  { rally: 'qz'+i } ) === 0 ) continue;
                        }
                        if ( Game.creeps['a'+i+'qz0'] !== undefined && Game.creeps['a'+i+'qz0'].ticksToLive < 300 ) {
                            if ( Game.creeps['a'+i+'qz1'] === undefined ) if ( spawner.createCreep( axhh, 'a'+i+'qz1', { rally: 'qz'+i } ) === 0 ) continue;
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
                    if ( ( Game.flags['x'+i]  || Game.flags['ox'+i] ) && Game.creeps['x'+i]  === undefined && spawner.room.memory.storedEnergy > minBuild )  { if ( spawner.createCreep( x, 'x'+i ) === 0 ) continue; }
                    if ( ( Game.flags['xh'+i+suf]  || Game.flags['oxh'+i+suf] ) && Game.creeps['xh'+i+suf]  === undefined )  { if ( spawner.createCreep( xh, 'xh'+i+suf ) === 0 ) continue; }
                    if ( ( Game.flags['xr'+i+suf]  || Game.flags['oxr'+i+suf] ) && Game.creeps['xr'+i+suf]  === undefined )  { if ( spawner.createCreep( xr, 'xr'+i+suf ) === 0 ) continue; }
                    if ( ( Game.flags['z'+i+suf]  || Game.flags['oz'+i+suf] ) && Game.creeps['z'+i+suf]  === undefined )  { if ( spawner.createCreep( z, 'z'+i+suf ) === 0 ) continue; }
                    if ( ( Game.flags['g'+i+suf]  || Game.flags['og'+i+suf] ) && Game.creeps['g'+i+suf]  === undefined )  { if ( spawner.createCreep( g, 'g'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['h'+i+suf]  || Game.flags['oh'+i+suf] ) && Game.creeps['h'+i+suf]  === undefined )  { if ( spawner.createCreep( h, 'h'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['a'+i+suf]  || Game.flags['oa'+i+suf] ) && Game.creeps['a'+i+suf]  === undefined )  { if ( spawner.createCreep( a, 'a'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['gl'+i+suf]  || Game.flags['ogl'+i+suf] ) && Game.creeps['gl'+i+suf]  === undefined )  { if ( spawner.createCreep( gxl, 'gl'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
                    if ( ( Game.flags['hxl'+i+suf]  || Game.flags['ohxl'+i+suf] ) && Game.creeps['hxl'+i+suf]  === undefined )  { if ( spawner.createCreep( hxl, 'hl'+i+suf, { rally: 'army'+suf } ) === 0 ) continue; }
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
            if ( ( Game.flags['s'+suf] && Game.creeps['s'+suf] === undefined ) || ( spawner.memory.friends > 2 && !spawner.room.storage ) ) if ( spawner.createCreep( s, 's'+suf, { role: 'storage' } ) === 0 ) continue;
            var hwrole = 'sup';
            if ( !minersGood ) hwrole = 'harv';
            if ( ( Game.flags['hw'+suf] && Game.creeps['hw'+suf] === undefined ) || repairSites.length > 5 || sites.length > 0 ) if ( spawner.createCreep( hw, 'hw'+suf, { role: hwrole } ) === 0 ) continue;
            for ( var i = 0; i < 12; i++ ) {
                if ( ( Game.flags['w'+i+suf] || Game.flags['ow'+i+suf] ) && Game.creeps['w'+i+suf]  === undefined ) if ( spawner.createCreep( w, 'w'+i+suf, { role: 'worker' } ) === 0 ) continue;
                if ( ( Game.flags['v'+i+suf] || Game.flags['ov'+i+suf] ) && Game.creeps['v'+i+suf]  === undefined && spawner.room.memory.storedEnergy > 750000 + i * 50000 ) if ( spawner.createCreep( w, 'v'+i+suf, { role: 'worker' } ) === 0 ) continue;
                if ( Game.flags['ovc'+i+suf] && Game.creeps['v'+i+suf] && Game.creeps['vc'+i+suf] === undefined ) if ( spawner.createCreep( cc, 'vc'+i+suf, { role: 'sup', noExt: true } ) === 0 ) continue;
                if ( Game.flags['lw'+i+suf]  || Game.flags['olw'+i+suf] ) if ( spawner.createCreep( lw, 'lw'+i+suf, { role: 'worker' } ) === 0 ) continue;
                if ( Game.flags['lh'+i+suf]  || Game.flags['olh'+i+suf] ) if ( spawner.createCreep( lh, 'lh'+i+suf ) === 0 ) continue;
                if ( Game.flags['lg'+i+suf]  || Game.flags['olg'+i+suf] ) if ( spawner.createCreep( lg, 'lg'+i+suf ) === 0 ) continue;
                if ( Game.flags['la'+i+suf]  || Game.flags['ola'+i+suf] ) if ( spawner.createCreep( la, 'la'+i+suf ) === 0 ) continue;
                if (   Game.flags['s'+i+suf] && Game.creeps['s'+i+suf] === undefined ) if ( spawner.createCreep( s, 's'+i+suf, { role: 'storage' } ) === 0 ) continue;
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
                if ( Game.flags['b'+i+suf] && Game.creeps['b'+i+suf] === undefined ) { if ( spawner.createCreep( b, 'b'+i+suf ) === 0 ) continue; }
                if ( ( Game.flags['lc'+i+suf] || Game.flags['olc'+i+suf] ) && Game.creeps['lc'+i+suf] === undefined ) { if ( spawner.createCreep( lc, 'lc'+i+suf, { role: 'harv' } ) === 0 ) continue; }
                if ( ( Game.flags['cs'+i+suf] && Game.creeps['cs'+i+suf] === undefined ) || ( i < 1 && i < eex / 20 && spawner.memory.friends > 4 ) ) if ( spawner.createCreep( wc, 'cs'+i+suf, { role: 'sup' } ) === 0 ) continue;
            }
        } else spawner.memory.spawnLag = 0; 
    }
    cpuS = Game.getUsedCpu() - cpuS;
    if ( cpuS > 50 ) console.log( 'Spawners took ' + cpuS );
}

function rC() {
    cpuC = Game.getUsedCpu();
    for(var name in Game.creeps) {
    	var creep = Game.creeps[name];
    	var startCpu = Game.getUsedCpu();

        // console.log( creep.name + ' ' + Game.getUsedCpu() );

        // Identify Military Units
    	if ( creep.getActiveBodyparts( ATTACK ) || creep.getActiveBodyparts( RANGED_ATTACK ) || creep.getActiveBodyparts( HEAL ) ) creep.memory.mil = true; else creep.memory.mil = false;
    	
        // Skips bots under constructions, report military creeps
    	if ( creep.spawning ) {
    	    if ( Game.time / 12 == Math.floor( Game.time /12 ) && creep.memory.mil ) console.log( creep.name + ' being built!');
    	    continue;
    	}
    	
    	if ( creep.name.substring(0,1) == 'l' && creep.memory.lift && creep.carry.energy == 0 ) creep.suicide();
    	if ( Game.flags.kill && creep.pos.inRangeTo( Game.flags.kill, 0 ) ) { creep.suicide(); Game.flags.kill.remove(); }

    	// Skip bots if necessary to save cpu
    	if ( !creep.memory.mil && Game.getUsedCpu() > Game.cpuLimit - skipCpuLevel ) { Memory.skips = Memory.skips + 1; continue; } 
    	if ( !creep.memory.mil && creep.getActiveBodyparts( WORK ) == 0 && creep.fatigue > 0 ) { continue; } 

        if ( ( creep.pos.x == 49 || creep.pos.x == 0 || creep.pos.y == 49 || creep.pos.y == 0 ) && creep.pos.findInRange( FIND_MY_CREEPS, 1 ).length > 1 ) {
            if ( creep.room.memory.gridlockBeaker ) creep.room.memory.gridlockBreaker = false; else m( creep, creep );
        }

        // Hostile Creeps
        var hos = creep.room.memory.hos;
        var hostiles = hos.length;    	
        var hspawns = creep.room.find( FIND_HOSTILE_SPAWNS );
        
        // Energy calculations
        creep.memory.storedEnergy = creep.memory.storedEnergy < 0 ? creep.memory.storedEnergy * -1 : 0;
    	if ( creep.room.storage && creep.room.storage.pos.inRangeTo( creep, 1) ) creep.memory.storedEnergy = creep.memory.storedEnergy + Math.floor( creep.room.storage.store.energy / 10 );

    	// Base Calculations
    	var base = null;
    	if ( creep.room.storage !== undefined && creep.room.storage.owner.username == 'Vision' && creep.room.storage.store.energy < storageLevel ) { base = creep.room.storage;  }
    	if ( !base ) base = creep.pos.findClosestByRange( FIND_MY_SPAWNS );
    	if ( !base ) base = whatBase( creep );
    	if ( !base ) base = Game.spawns[creep.memory.spawn];
    	if ( !base ) base = Game.spawns.g;
        var suf = '';
        suf = base.name;

        if ( !creep.memory.spawn && creep.pos.findClosestByRange( FIND_MY_SPAWNS ) ) creep.memory.spawn = creep.pos.findClosestByRange( FIND_MY_SPAWNS ).name;
        if ( !creep.memory.dist ) creep.memory.dist = 1;
        var ex = 0;
        if ( Game.spawns[creep.memory.spawn]  ) ex = Game.spawns[creep.memory.spawn].memory.ex;
        creep.memory.aid = 0;
	    if ( creep.room != base.room ) creep.memory.aid = creep.memory.aid + 1;
	    if ( creep.memory.dist > 8 && creep.memory.aid < 1 ) creep.memory.aid = 1;
	    if ( creep.memory.aid < creep.memory.storedEnergy / 2000 ) creep.memory.aid = Math.floor( creep.memory.storedEnergy / 2000 );
	    if ( creep.memory.aid > 3 ) creep.memory.aid = 3;
        var rampartlevel = 1000;
        if ( base.room ) rampartlevel = base.room.controller.level * base.room.controller.level * rampartMult;

        // Unit Calculations
    	var nearestSpawner = creep.pos.findClosestByRange( FIND_MY_SPAWNS );
    	var nearestFriend = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return creep != object;  } } );
    	var nearestMiner = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role == 'miner' && creep != object;  } } );
    	var nearestEnemy = creep.pos.findClosestByRange( FIND_HOSTILE_CREEPS, { filter: function(object) { return object.hitsMax < maxHostile && ( object.getActiveBodyparts( ATTACK ) || object.getActiveBodyparts( RANGED_ATTACK ) ) && allies.indexOf( object.owner.username ) < 0;  } } );
    	var nearestMil = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.mil && creep.hitsMax > 1000 && creep != object;  } } );
	    var link = creep.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.pos.inRangeTo( creep, 1 ) && object.structureType == STRUCTURE_LINK && object.energy > 0; } } );
	    if ( link ) creep.memory.linked = true; else creep.memory.linked = false;

    	if ( nearestSpawner ) creep.memory.spr = range( creep.pos.x, creep.pos.y, nearestSpawner.pos.x, nearestSpawner.pos.y ); else creep.memory.spr = 99;
    	if ( nearestEnemy ) creep.memory.er = range( creep.pos.x, creep.pos.y, nearestEnemy.pos.x, nearestEnemy.pos.y ); else creep.memory.er = 99;
    	if ( nearestFriend ) creep.memory.fr = range( creep.pos.x, creep.pos.y, nearestFriend.pos.x, nearestFriend.pos.y ); else creep.memory.fr = 99;
    	
    	var lair = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_KEEPER_LAIR && object.ticksToSpawn < 10; } } );
    	var attlair = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_KEEPER_LAIR && object.ticksToSpawn < 60; } } );
    	if ( lair && orange( creep, lair ) < creep.memory.er ) { creep.memory.er = orange( creep, lair ); nearestEnemy = lair; }
    	if ( attlair && orange( creep, attlair ) < creep.memory.er && creep.memory.mil ) { creep.memory.er = orange( creep, attlair ); nearestEnemy = attlair; }

        if ( nearestEnemy && nearestEnemy.hitsMax > 4500 ) creep.notifyWhenAttacked( false );

    	creep.memory.moveOrder = 0;
    	creep.memory.destn = undefined;
    	if ( creep.memory.lastpos === undefined ) creep.memory.lastpos = creep.pos;
    	if ( creep.memory.returnToBase === undefined || creep.carry.energy == 0 ) creep.memory.returnToBase = false;

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
        
        // Work if possible
        if ( creep.getActiveBodyparts(WORK) > 0 ) {
            var source = creep.pos.findInRange( FIND_SOURCES, 1 );
            if ( source.length > 0 && source[0].energy > 0 ) { creep.harvest( source[0] ); creep.memory.gridlock = 0; if ( creep.memory.role == 'harv' && creep.carry.energy < creep.carryCapacity ) m( creep, creep ); } else {
                if ( creep.carry.energy > 0 ) {
                    // May I help another worker with some energy?
                    var helper = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return creep.carry.energy > creep.getActiveBodyparts( WORK ) * 2 && object.carry.energy < creep.getActiveBodyparts( WORK ) && object.getActiveBodyparts( WORK ) > 0 && object.pos.inRangeTo( creep, 1); } } );
                    if ( helper ) creep.transferEnergy( helper, creep.carry.energy / 2 );
                    
                    // Construct?
            		target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            	    if( target && creep.pos.inRangeTo( target, 1 ) && ( !creep.pos.inRangeTo( target, 0 ) || target.structureType == STRUCTURE_ROAD ) ) { creep.build( target ); if ( creep.hits == creep.hitsMax ) m( creep, creep ); creep.memory.gridlock = 0; } else {
                	    // Repair?
            	    	target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.hits < object.hitsMax / 2 && object.hits < rampartlevel / 15 && object.pos.inRangeTo( creep, 1 ); } } );
            	    	if ( target ) { m( creep, creep ); creep.memory.gridlock = 0; }  // Do enough repair to last a while on our first pass
            	    	if ( !target ) target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.hits < object.hitsMax / 2 && object.hits < rampartlevel / 5 && object.pos.inRangeTo( creep, 1 ); } } );
                	    if ( !target ) target = creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.hits < object.hitsMax - 14 && object.hits < rampartlevel && object.pos.inRangeTo( creep, 1 ); } } );
        	            if( target && creep.pos.inRangeTo( target, 1 ) ) { creep.repair( target ); creep.memory.gridlock = 0; } else {
                	        // Upgrade Controller?
                	        target = creep.room.controller;
                    	    if( target && creep.pos.inRangeTo( target, 1 ) ) { creep.upgradeController( target ); creep.memory.gridlock = 0; }
                	    }
            	    }
                } 
            }
        }
        
        // Heal if possible
        // Injured Creeps
        var inj = creep.room.find( FIND_MY_CREEPS, { filter: function(object) { return object.hits < object.hitsMax; } } );
        if ( creep.getActiveBodyparts(HEAL) > 0 && !creepAttacking ) {
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
        
        // Pick up energy if I can and should
    	if ( creep.carry.energy < creep.carryCapacity && !creep.memory.mil && ( creep.memory.role != 'miner' || creep.memory.accum ) && !( creep.memory.role == 'trans' && Game.flags['o'+creep.memory.rally] && Game.flags['o'+creep.memory.rally].room == creep.room ) ) {  
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
            if ( link && creep.memory.role != 'storage' && creep.memory.noExt === undefined && !creep.memory.share && creep.memory.role != 'harv' && creep.memory.role && link.pos.inRangeTo( creep, 1 ) && creep.carry.energy < creep.carryCapacity / 2 ) { link.transferEnergy( creep ); }    	    
    	}
    	
    	// Transfer energy if I can and should
    	if ( creep.carry.energy > 0 ) { 
            var source = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.energyCapacity==50 && object.energy < 50 && object.pos.inRangeTo( creep, 1 ); } } );

            if ( !source ) {
        	    if ( creep.memory.role == 'miner' || creep.memory.role == 'harv' || ( creep.memory.role == 'trans' && Game.flags['o'+creep.memory.rally] && Game.flags['o'+creep.memory.rally].room == creep.room ) || !creep.memory.role ) { 
        	        source = creep.pos.findClosestByRange( FIND_MY_SPAWNS, { filter: function(object) { return object.energy < 300 && object.pos.inRangeTo( creep, 1 ); } } );
        	        if ( !source && creep.room.storage && creep.pos.inRangeTo( creep.room.storage, 1) ) source = creep.room.storage;
        	        if ( !source ) source = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role == 'storage' && ( Math.abs(object.memory.storedEnergy) < creep.room.memory.tempStorageLimit || !creep.room.storage ) && object.pos.inRangeTo( creep, 1) && object != creep && !link; } } );
        	        if ( !source ) source = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return ( ( object.memory.target && object.memory.target == creep.name ) || object.memory.role == 'sup' || object.getActiveBodyparts( WORK ) > 0 ) && object.pos.inRangeTo( creep, 1) && object != creep && object.memory.role != 'harv' && ( object.memory.role != 'miner' || ( creep.memory.role == 'miner' && object.memory.accum ) ) ; } } );
        	        if ( !source ) {
                	    var storage = Game.creeps['s'+suf], slider = null;
            	        if ( base ) source = base; 
            	        if ( source.energy == 300 && storage && creep.room.storage && storage.pos.inRangeTo( creep.room.storage, 1 ) ) source = storage;
            	        if ( creep.room.storage && creep.room.storage.pos.inRangeTo( creep, 1) ) source = creep.room.storage;
            	        if ( creep.memory.role != 'harv' ) slider = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.pos.inRangeTo( creep, 1) && object.carry.energy < object.carryCapacity && object.memory.share !== undefined && !object.memory.endpoint; } } );
            	        if ( slider ) source = slider;
        	        }
        	    }
        	    if ( creep.memory.role == 'sup' && creep.getActiveBodyparts( WORK ) == 0 ) {
        	        sources = creep.pos.findInRange( FIND_MY_CREEPS, 1, { filter: function(object) { return ( object.getActiveBodyparts( WORK ) > 0 || ( creep.memory.lift && object.memory.lift && creep.memory.lift < object.memory.lift ) ) && object.pos.inRangeTo( creep, 1) && ( object.carry.energy < object.carryCapacity - 25 || object.memory.lift ) && object != creep && object.memory.role != 'miner'; } } ); 
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

        // Manage massive energy storage..
        if ( creep.memory.role == 'storage' ) {
            var spawner = creep.pos.findClosestByRange( FIND_MY_SPAWNS, { filter: function(object) { return object.energy < 300; } } );
            var heavyBuilder = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return ( ( object.memory.role == 'worker' && object.getActiveBodyparts(WORK) > 3 ) || object.memory.role == 'sup' || object.memory.lift ) && object.pos.inRangeTo( creep, 1 ); } } )
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
    	
        creep.memory.usedCpu1 = Math.floor( Game.getUsedCpu() - startCpu );
        // Movement Rules

        // Default to moving to a flagged position
        if ( creep.fatigue == 0 ) {
            if ( creep.memory.er < 10 && Game.flags['e'+creep.name] ) m( creep, Game.flags['e'+creep.name], 1 );
            if ( Game.flags[creep.name] ) { 
                m( creep, Game.flags[creep.name], 1 );
                if ( creep.pos.inRangeTo( Game.flags[creep.name], 1 ) && creep.memory.dist > 3 ) Game.flags[creep.name].memory.dist = creep.memory.dist; 
                if ( creep.pos.inRangeTo( Game.flags[creep.name], 1 ) && creep.name.substring(0,3) == 'hwx' ) Game.flags[creep.name].remove();
            }
            var evasion = 4;
            if ( creep.hits < creep.hitsMax ) evasion = 5;
            if ( Game.flags[creep.room.name] !== undefined ) evasion = 2;
            if ( ( !creep.memory.mil || creep.hits < creep.hitsMax * .6 ) && creep.memory.er < evasion ) { if ( creep.memory.er == 4 && ( creep.memory.gridlock > 0 || nearestEnemy.hitsMax > 4500 ) ) { m( creep, creep ); creep.memory.gridlock = 0; } else evade( creep, nearestEnemy ); }
            if ( creep.memory.rally && Game.flags[creep.memory.rally] && Game.flags[creep.memory.rally+'stage'] && creep.room != Game.flags[creep.memory.rally+'stage'].room && creep.room != Game.flags[creep.memory.rally].room && creep.carry.energy == 0 ) m( creep, Game.flags[creep.memory.rally+'stage'], 1 );
            if ( creep.memory.rally && Game.flags[creep.memory.rally] && Game.flags[creep.memory.rally].pos != creep.pos ) { m( creep, Game.flags[creep.memory.rally], 1 ); if ( creep.pos.inRangeTo( Game.flags[creep.memory.rally], 0 ) ) Game.flags[creep.memory.rally].memory.dist = creep.memory.dist; }
            if ( creep.memory.escort && Game.creeps[creep.memory.escort] !== undefined && creep.room == Game.creeps[creep.memory.escort].room && creep.memory.er > 7 && !creep.pos.inRangeTo( Game.creeps[creep.memory.escort], 2 ) ) { m( creep, Game.creeps[creep.memory.escort], 1 ); }
            if ( creep.memory.rally && Game.flags['o'+creep.memory.rally] && Game.flags[creep.memory.rally+'stage'] && creep.room != Game.flags[creep.memory.rally+'stage'].room && creep.room != Game.flags['o'+creep.memory.rally].room && creep.carry.energy == 0 ) m( creep, Game.flags[creep.memory.rally+'stage'], 1 );
            if ( creep.memory.rally && Game.flags['o'+creep.memory.rally] && ( creep.room != Game.flags['o'+creep.memory.rally].room || ( creep.room == Game.flags['o'+creep.memory.rally].room && ( creep.pos.x == 49 || creep.pos.x == 0 || creep.pos.y == 49 || creep.pos.y == 0 ) ) ) && creep.carry.energy == 0 ) m( creep, Game.flags['o'+creep.memory.rally], 1 );
            if ( creep.memory.noExt && Game.flags['o'+creep.name] && creep.carry.energy > 0 ) m( creep, Game.flags['o'+creep.name], 1 );
            if ( creep.memory.role == 'sup' && Game.flags['o'+creep.name] && creep.carry.energy > 0 && ( creep.room != Game.flags['o'+creep.name].room || creep.pos.x == 49 || creep.pos.x == 0 || creep.pos.y == 49 || creep.pos.y == 0 ) ) m( creep, Game.flags['o'+creep.name], 1 );
            if ( creep.memory.role == 'trans' && creep.carry.energy < creep.carryCapacity * harvFull ) creep.memory.moveOrder = 0;
        }
        
    	// Miners
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && ( creep.memory.role == 'miner' || ( creep.memory.role == 'harv' && creep.carry.energy == 0 && creep.getActiveBodyparts( WORK ) > 0 ) ) && !creep.memory.accum ) {
    	    var source = null;
    	    if ( creep.getActiveBodyparts( WORK ) < 8 ) source = creep.pos.findClosestByRange( FIND_SOURCES ); else {
    	        source = creep.pos.findClosestByRange( FIND_SOURCES, { filter: function( object ) { return object.energy > 0 && object.pos.findInRange(FIND_HOSTILE_CREEPS,6).length == 0 && ( orange( object, lair ) > 6 || orange( object, nearestMil ) < 8 ) && orange( object, creep ) < orange( object, nearestMiner ); } } ); 
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
    	
    	// Builders
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && creep.getActiveBodyparts( WORK ) > 0 && creep.getActiveBodyparts( CARRY ) > 0 ) { 
    	    var myCenter = null;
    	    if ( !Game.flags['o'+creep.name] && !Game.flags['c.'+creep.name] ) { creep.room.createFlag( Math.floor( Math.random() * 40 + 5 ), Math.floor( Math.random() * 40 + 5 ), 'c.'+creep.name ); myCenter = Game.flags['c.'+creep.name]; }
    	    if ( Game.flags['o'+creep.name] ) { if ( Game.flags['c.'+creep.name] ) Game.flags['c.'+creep.name].remove(); myCenter = Game.flags['o'+creep.name]; }
    	    if ( !myCenter && Game.flags['c.'+creep.name] ) myCenter = Game.flags['c.'+creep.name];
    	    if ( !myCenter ) myCenter = Game.spawns[creep.memory.spawn];
    	    if ( myCenter.room != creep.room ) myCenter = creep;

    	    var source = myCenter.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.hits < object.hitsMax / 2 && object.hits < rampartlevel / 18 && object.pos.inRangeTo( myCenter, 16 ); } } );
    	    if ( !source ) source = myCenter.pos.findClosestByRange( FIND_CONSTRUCTION_SITES, { filter: function(object) { return object.pos.inRangeTo( myCenter, 16 ); } } );
    	    if ( !source ) source = myCenter.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.hits < object.hitsMax / 2 && object.hits < rampartlevel / 18; } } );
    	    if ( !source ) source = myCenter.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.structureType != STRUCTURE_ROAD && object.hits < object.hitsMax && object.hits < rampartlevel / 5; } } );
    	    if ( !source ) source = myCenter.pos.findClosestByRange( FIND_CONSTRUCTION_SITES );
    	    if ( !source ) source = myCenter.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.structureType != STRUCTURE_WALL && object.hits < object.hitsMax && object.hits < rampartlevel / 1.5; } } );
    	    if ( ( creep.getActiveBodyparts( WORK ) > creep.getActiveBodyparts( MOVE ) || ( creep.getActiveBodyparts( WORK ) > 0 && creep.room.find( FIND_MY_CREEPS, { filter: function(object) { return object.getActiveBodyparts( WORK ) > object.getActiveBodyparts( MOVE ); } } ).length == 0 ) ) && creep.room.controller && creep.pos.inRangeTo( creep.room.controller, 1 ) ) source = creep.room.controller;
    	    if ( source && creep.memory.er > 4 && ( creep.carry.energy > 0 || creep.memory.role != 'sup' ) ) if ( creep.pos.inRangeTo( source , 1 ) && creep.hits == creep.hitsMax ) m( creep, creep); else m( creep, source );
    	}

        creep.memory.usedCpu2 = Math.floor( Game.getUsedCpu() - startCpu );
        // Delivery   
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && !creep.memory.mil ) { 
    	    var supplyLink = creep.pos.findClosestByRange( FIND_MY_STRUCTURES, { filter: function(object) { return object.structureType == STRUCTURE_LINK && object.energy > 0 && !object.pos.inRangeTo( creep.room.storage, 2 ) && object.pos.findInRange( FIND_MY_CREEPS, 1, { filter: function(object) { return object.getActiveBodyparts( WORK ) > 0; } } ).length == 0; } } );
            var source = null;
            if ( creep.memory.target && Game.flags[creep.memory.target] ) { source = Game.flags[creep.memory.target]; if ( creep.memory.role == 'sup' && creep.carry.energy == 0 ) source = null; }
            if ( !source && creep.memory.rally && Game.flags['o'+creep.memory.rally] && Game.flags['o'+creep.memory.rally].room != creep.room ) source = Game.flags['o'+creep.memory.rally]; 
            if ( !source && Game.flags['o'+creep.name] && Game.flags['o'+creep.name].room != creep.room ) source = Game.flags['o'+creep.name]; 
            
            // Looting
            if ( creep.carry.energy >= creep.carryCapacity * harvFull ) creep.memory.loot = null;
            if ( !source && creep.memory.loot !== null && !creep.memory.rally && creep.carry.energy < creep.carryCapacity * harvFull ) {
                if ( Game.getObjectById( creep.memory.loot ) !== null && Game.getObjectById( creep.memory.loot ).energy > 100 && orange( creep,  Game.getObjectById( creep.memory.loot ) ) < 250 ) { 
                    source = Game.getObjectById( creep.memory.loot ); 
                    if ( Game.time / 17 == Math.floor( Game.time / 17 ) ) console.log( creep.name + ' (' + creep.room.name + ') heading for ' + source.energy + ' loot in ' + source.room.name + ' range ' + orange( creep, source ) );
                } else creep.memory.loot = null;
            }

            if ( !source && creep.memory.role == 'sup' && creep.carry.energy > 0 && creep.memory.noExt !== undefined ) source = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role != 'miner' && object.getActiveBodyparts( WORK ) > 9 && object.carry.energy < object.carryCapacity - 20; } } );
            if ( !source && creep.memory.role == 'sup' && creep.carry.energy > 0 && creep.memory.noExt !== undefined ) source = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role != 'miner' && object.getActiveBodyparts( WORK ) > 9; } } );
            if ( !source && creep.memory.role == 'sup' && creep.carry.energy > 0 ) source = creep.pos.findClosestByRange( FIND_MY_CREEPS, { filter: function(object) { return object.memory.role != 'miner' && object.getActiveBodyparts( WORK ) > 0 && object.carry.energy < object.carryCapacity - 10; } } );
            
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
            
            if ( creep.memory.role == 'harv' && !source && creep.carry.energy >= creep.carryCapacity * harvFull ) creep.memory.returnToBase = true;
            if ( creep.memory.role == 'harv' && source && ( ( creep.carry.energy >= creep.carryCapacity * harvFull && orange( creep, source ) > 1 ) || ( creep.carry.energy == creep.carryCapacity && orange( creep, source ) < 2 ) ) ) creep.memory.returnToBase = true;
            if ( creep.memory.role == 'harv' && creep.memory.returnToBase ) source = altSource;
            if ( creep.memory.role == 'trans' && creep.carry.energy < creep.carryCapacity * harvFull ) source = Game.spawns[creep.memory.spawn]; 
            if ( creep.memory.role == 'trans' && creep.carry.energy >= creep.carryCapacity * harvFull && Game.flags['o'+creep.memory.rally] && Game.flags['o'+creep.memory.rally].room == creep.room && creep.room.storage ) source = creep.room.storage; 

            if ( ( !source || ( creep.memory.rally === undefined && creep.memory.target === undefined ) || ( source.room == creep.room && creep.memory.role == 'harv' && !( creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49 ) ) ) && ( creep.carry.energy < creep.carryCapacity * harvFull ) && !creep.memory.returnToBase && !creep.memory.loot ) {
                if ( creep.memory.role == 'sup' ) {
                    var energyChunk = creep.pos.findClosestByRange( creep.room.memory.allEnergy, { filter: function(object) { return object.energy > creep.carryCapacity / 3; } } );
                    if ( supplyLink ) source = supplyLink;
        	        if ( !source || ( creep.room.storage && range( creep, creep.room.storage ) - 3 < range( creep, source ) ) ) source = creep.room.storage;
                    if ( !source || ( energyChunk && range( creep, energyChunk ) < range( creep, source ) ) ) source = energyChunk;
                }
                if ( creep.memory.role == 'harv' ) {
                    var ehits = 9999;
                    var select = -1, want = -9999;
                    for ( var i = 0; i < creep.room.memory.allEnergy.length; i++ ) {
                        var thisE = creep.room.memory.allEnergy[i];
                        var enem = thisE.pos.findClosestByRange( FIND_HOSTILE_CREEPS, { filter: function( object ) { return object.hitsMax < ehits && ( object.getActiveBodyparts( ATTACK ) > 0 || object.getActiveBodyparts( RANGED_ATTACK ) > 0 ); } } );
                        if ( thisE.energy / ( orange( thisE, creep ) * .5 + 1 ) > want && !thisE.storage && thisE.energy > orange( thisE, creep ) && thisE.energy > 0 && ( thisE.energy > 1000 || creep.memory.target !== undefined || creep.memory.rally !== undefined ) && ( thisE.energy > 2000 || !creep.memory.loot ) && !( enem && thisE.pos.inRangeTo( enem, 6 ) ) && !( lair && thisE.pos.inRangeTo( lair, 6 ) ) ) { want = thisE.energy / ( orange( thisE, creep ) * .5 + 1 ); select = i; }
                    }
                    if ( want > -9999 ) { source = creep.room.memory.allEnergy[select]; creep.memory.loot = null; }
                    
                    if ( !source && ( !creep.memory.target || !Game.flags[creep.memory.target] ) && !creep.memory.rally && !creep.memory.loot ) {
                        var mpx = 0, mpy = 0, epx = 0, epy = 0;
                        for ( var e = 0; e < 5; e++ ) {
                            var bounty = 2000, bountySel = -1;
                            for ( var i = 0; i < allDrop.length; i++ ) {
                                var mpx = mapCoord( creep.room.name ).x, mpy = mapCoord( creep.room.name ).y, epx = mapCoord( allDrop[i].room.name ).x, epy = mapCoord( allDrop[i].room.name ).y;
                                if ( range( mpx, mpy, epx, epy ) <= e && allDrop[i].energy - allDrop[i].enc > bounty && !allDrop[i].pos.findInRange( FIND_HOSTILE_CREEPS, 15 ).length ) {
                                    bounty = allDrop[i].energy - allDrop[i].enc;
                                    bountySel = i;
                                }
                            }
                            if ( bountySel > -1 && orange( creep, allDrop[bountySel] ) < 250 ) { source = allDrop[bountySel]; allDrop[bountySel].enc += ( creep.carryCapacity - creep.carry.energy ); creep.memory.loot = allDrop[bountySel].id; console.log( 'Hauler ' + creep.name + ' headed to ' + allDrop[bountySel].room.name + ' for ' + allDrop[bountySel].energy + ' range ' + orange( creep, source ) ); break; }
                        }
                    }
                }
            }

            if ( creep.memory.noExt !== undefined && creep.room.storage ) if ( creep.carry.energy < creep.carryCapacity && creep.pos.inRangeTo( creep.room.storage, 1 ) ) creep.room.memory.noExtNeed = true;

            if ( nearestSpawner && creep.carry.energy > 0 && creep.memory.noExt === undefined && creep.memory.role != 'trans' && !creep.memory.target ) {
                var erange = 8 - creep.room.memory.iGotTheExt * 2;
                if ( creep.memory.role == 'sup' && creep.room.memory.iGotTheExt < 4 ) erange = erange * 4;
                var cext = creep.pos.findClosestByRange( FIND_STRUCTURES, { filter: function(object) { return object.energyCapacity==50 && object.energy < 50 && object.pos.inRangeTo( creep, erange ); } } );
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
    	        if ( source.pos.inRangeTo( creep, 1 ) && creep.memory.role == 'harv' && altSource ) { source = altSource; creep.memory.gridlock = 0; }
    	        if ( creep.memory.role == 'harv' && creep.pos.inRangeTo( source, 1 ) && creep.carry.energy > 0 && creep.carry.energy < creep.carryCapacity * harvFull && creep.hits == creep.hitsMax ) m( creep, creep );
        	    if ( ( creep.memory.er > 4 || Game.flags[creep.room.name] !== undefined ) && ( creep.hits == creep.hitsMax || creep.room.find( FIND_MY_CREEPS, { filter: function( object ) { return object.getActiveBodyparts( HEAL ) > object.hitsMax / 700; } } ).length == 0 ) ) m( creep, source ); 
    	    }
    	}
        creep.memory.usedCpu3 = Math.floor( Game.getUsedCpu() - startCpu );

        // Healers
    	if ( creep.fatigue == 0 && !creep.memory.moveOrder && creep.getActiveBodyparts( HEAL ) > creep.hitsMax / 300 || ( creep.getActiveBodyparts( HEAL ) > 0 && creep.getActiveBodyparts( RANGED_ATTACK ) == 0 ) ) {  
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
    	
        // Evade if needed
        if ( creep.fatigue == 0 && creep.memory.moveOrder === 0 && creep.memory.spr > 3 ) {
            var r = 5;
            if ( creep.memory.mil ) r = 4;
            if ( creep.memory.er <= r ) evade( creep, nearestEnemy );
        }

        // Move to a healer if needed
        if ( creep.fatigue == 0 && creep.hits < creep.hitsMax && ( !creep.memory.mil || creep.hits < creep.hitsMax * .6 ) ) {
            target = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter: function(object) { return object.getActiveBodyparts(HEAL) > object.hitsMax / 700; } } );
	        if ( target ) { creep.memory.moveOrder = 0; m( creep, target, 1 ); }
        }     

        // Warriors report to the army position, if it exists
        if ( Game.flags['o'+creep.name] ) m( creep, Game.flags['o'+creep.name], 1 );
        if ( creep.memory.rally && Game.flags['o'+creep.memory.rally] ) m( creep, Game.flags['o'+creep.memory.rally], 1 );
        if ( Game.flags.army && ( creep.getActiveBodyparts( ATTACK ) > 0 || creep.getActiveBodyparts(RANGED_ATTACK ) > 0 || creep.getActiveBodyparts( HEAL ) > creep.hitsMax / 500 ) ) m( creep, Game.flags.army, 1 );

        creep.memory.usedCpu = Math.floor( Game.getUsedCpu() - startCpu );
        if ( creep.memory.usedCpu > topUserAmount ) { topUserAmount = creep.memory.usedCpu; topUser = creep; }
        if ( creep.memory.usedCpu > 25 ) console.log( creep.name + ' ' + creep.memory.usedCpu1 + '.' + creep.memory.usedCpu2 + '.' + creep.memory.usedCpu3 + '.' + creep.memory.usedCpu + '.' + creep.memory.epathed + '  ' + creep.memory.lastMove + '  EnemyR: ' + creep.memory.er + '  BaseR: ' + creep.memory.spr + '  Grid: ' + creep.memory.gridlock + '  Hits: ' + creep.hits + '/' + creep.hitsMax );
    }
    cpuC = Game.getUsedCpu() - cpuC;
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
        if ( bypassCode && creep.pos.x > 2 && creep.pos.x < 47 && creep.pos.y > 2 && creep.pos.y < 47 ) {
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
        // if ( creep.memory.x3 == creep.pos.x && creep.memory.y3 == creep.pos.y && !creep.pos.inRangeTo( dest, 1 ) ) creep.memory.gridlock = creep.memory.gridlock + 1;
        if ( creep.memory.x1 == creep.memory.x3 && creep.memory.y1 == creep.memory.y3 && !creep.pos.inRangeTo( dest, 1 ) ) creep.memory.gridlock = creep.memory.gridlock + 1; else creep.memory.gridlock = 0;
        if ( creep.memory.gridlock > 3 || creep.memory.er < 2 || ( creep.memory.mil && creep.memory.gridlock > 0 ) ) ig = false;
        if ( creep.memory.gridlock > 2 && Math.random() < .4 ) { creep.memory.moveOrder = 1; creep.memory.pathFind = 5; return; }

        mov( creep, dest, avo, ig );
    }
}

function mov( creep, dest, avo, ig ) {
    var timeMove = Game.getUsedCpu();
    creep.memory.moveOrder = 1;
    creep.memory.epathed = false;

    // Store Distance Travelled
    if ( creep.memory.x1 != creep.pos.x || creep.memory.y1 != creep.pos.y ) if ( swamp( creep, creep.pos.x, creep.pos.y ) ) creep.memory.dist = creep.memory.dist + 8; else creep.memory.dist = creep.memory.dist + 1;

	// Save Movement Information
	creep.memory.x3 = creep.memory.x2;
	creep.memory.x2 = creep.memory.x1;
	creep.memory.x1 = creep.pos.x;
	creep.memory.y3 = creep.memory.y2;
	creep.memory.y2 = creep.memory.y1;
	creep.memory.y1 = creep.pos.y;
	if ( !creep.memory.pathFind ) creep.memory.pathFind = 0;

    var ru = 5;
    if ( creep.memory.mil || creep.memory.gridlock > 4 ) ru = 0;
    if ( !creep.memory.spr ) creep.memory.spr = 99;
    if ( creep.memory.spr < 4 && dest && orange( creep, dest ) < 4 ) ig = false;
    if ( !creep.memory.rx ) creep.memory.rx = 0;
    if ( !creep.memory.ry ) creep.memory.ry = 0;
    if ( creep.memory.rally && dest && dest.room == creep.room && ( ( dest.name && creep.memory.rally == dest.name ) && ( dest.pos.x || dest.pos.y ) && ( creep.memory.rx || creep.memory.ry ) ) ) {
        creep.memory.lastMove = creep.memory.lastMove + ' using rally code...  avo: ' + avo.length;
        if ( Game.getUsedCpu() < Game.cpuLimit - 50 ) creep.moveTo( dest.pos.x + creep.memory.rx, dest.pos.y + creep.memory.ry, { avoid: avo, reusePath: ru, ignoreCreeps: false, maxOps: maxNodes } ); else console.log( creep.name + ' aborting move for cpu...' );
    }
    else {
        var aRoom = creep.room;
        if ( dest && dest.room !== undefined ) aRoom = dest.room;
        if ( Game.flags.opt && ig && dest && dest.pos && dest.pos.x && dest.pos.y && aRoom.name !== undefined && !creep.pos.inRangeTo( dest, mappingRange ) ) emov( creep, dest ); else {
            if ( !creep.memory.mil && orange( creep, dest ) < 40 && bypassCode && creep.pos.x > 2 && creep.pos.x < 47 && creep.pos.y > 2 && creep.pos.y < 47 ) {
                creep.memory.lastMove = creep.memory.lastMove + ' using bypass code...  avo: ' + avo.length + '  Ig: ' + ig + '  dRange: ' + orange( creep, dest );
                bypass( creep, dest );
            } else {
                var tryQuick = reroute( creep, dest );
                if ( tryQuick != null ) creep.moveTo( tryQuick, { avoid: avo, reusePath: ru, ignoreCreeps: ig, maxOps: 1000 } ); else 
                    creep.moveTo( dest, { avoid: avo, reusePath: ru, ignoreCreeps: ig, maxOps: maxNodes } ); 
            }
        }
    }
    creep.memory.lastMove = creep.memory.lastMove + ' MoveTime: ' + ( Math.floor( Game.getUsedCpu() - timeMove ) );
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
        mapping++;
        var newPath = creep.pos.findPathTo( dest, { ignoreCreeps: true } ), newTag = null;
        // Store directions into map blocks
        for ( var i = 0; i < newPath.length; i++ ) {
            newTag = String.fromCharCode( newPath[i].x+48, newPath[i].y+48 );
            if ( creep.room.memory.epath[newTag] === undefined ) creep.room.memory.epath[newTag] = {};
            
            if ( i == 0 ) creep.room.memory.epath[curTag][destTag] = newPath[i].direction; 
            if ( i < newPath.length - 1 ) creep.room.memory.epath[newTag][destTag] = newPath[i+1].direction;
        }
    }
    if ( creep.move( creep.room.memory.epath[curTag][destTag] ) ) console.log( creep.name + ' problem with epathing... ' ); else creep.memory.epathed = true;
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
                    if ( range( creep.pos.x, creep.pos.y, dest.pos.x, dest.pos.y ) > range( tx, ty, dest.pos.x, dest.pos.y ) ) likeThis += 5;
                    if ( range( creep.pos.x, creep.pos.y, dest.pos.x, dest.pos.y ) < range( tx, ty, dest.pos.x, dest.pos.y ) ) likeThis -= 5;
                    if ( tx == creep.memory.x1 && ty == creep.memory.y1 ) likeThis -= 10;
                }
                if ( isCreep ) likeThis -= 50;
                if ( likeThis > fav ) { fav = likeThis; favX = tx; favY = ty; }
            }
        }
    }
    if ( fav > -90 ) { creep.move( creep.pos.getDirectionTo( favX, favY ) ); }
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
