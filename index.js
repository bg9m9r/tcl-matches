const axios = require('axios').default;
const fastcsv = require('fast-csv');
const fs = require('fs');
const readlineSync = require('readline-sync')

const teams = [
    { teamId: 212913, name: 'Yale' },
    { teamId: 299408, name: 'Harvard' },
    { teamId: 207396, name: 'Notre Dame' },
    { teamId: 251658, name: 'Wisconsin' },
    { teamId: 209340, name: 'Denver' },
    { teamId: 294582, name: 'Michigan' },
    { teamId: 231072, name: 'Penn State' },
    { teamId: 323453, name: 'Boston University' },
]

const line = '\n------------------------\n'




const getMatches = async (team1Id, team2Id) => {
    try {
        const uri = `https://proclubs.ea.com/api/nhl/clubs/matches?clubIds=${team1Id}&platform=ps4&matchType=club_private`
        const res = await axios.get(uri, {headers: {'Referer': 'www.ea.com'}, })
        const data = res.data

        data
        .filter(match => match.clubs[team2Id])
        .map(match => {
            console.log('Match ' + match.matchId + ' ' + match.clubs[team1Id].details.name + ' vs ' + match.clubs[team2Id].details.name)

            for (const teamId in match.players) {

                const teamPlayers = match.players[teamId]
                const matchStats = []
                const ws = fs.createWriteStream(match.matchId+"-"+match.clubs[team1Id].details.name+ " vs " + match.clubs[team2Id].details.name +".csv");


                for (const playerId in teamPlayers){

                    var player = teamPlayers[playerId]

                        matchStats.push({
                            playername: player.playername,
                            skgoals: player.skgoals, 
                            skassists: player.skassists,
                            glsaves: player.glsaves,
                            glgaa: player.glgaa,
                            skshots: player.skshots,
                            skhits: player.skhits, 
                            skpim: player.skpim, 
                            skgiveaways: player.skgiveaways, 
                            sktakeaways: player.sktakeaways, 
                            skpasses: player.skpasses, 
                            skpassattempts: player.skpassattempts, 
                            skinterceptions: player.skinterceptions, 
                            skppg: player.skppg, 
                            skshg: player.skshg, 
                            skgwg: player.skgwg, 
                            ratingOffense: player.ratingOffense, 
                            ratingDefense: player.ratingDefense, 
                            ratingTeamplay: player.ratingTeamplay, 
                            position: player.position, 
                            skplusmin: player.skplusmin, 
                            skpkclearzone: player.skpkclearzone, 
                            skpenaltiesdrawn: player.skpenaltiesdrawn, 
                            skfow: player.skfow, 
                            skfol: player.skfol, 
                            skpossession: player.skpossession, 
                            skbs: player.skbs, 
                            skdeflections: player.skdeflections, 
                            glshots: player.glshots, 
                            glsavepct: player.glsavepct, 
                            glbrkshots: player.glbrkshots, 
                            glbrksaves: player.glbrksaves, 
                            gldsaves: player.gldsaves
                        })
                }
                // write
                fastcsv
                .write(matchStats, { headers: true })
                .pipe(ws); 
                
            }
        })

    } catch (e) {

        console.error(e)
    }
}

//start
console.clear()

console.log(line)
console.log('TCL Hockey Stat Exporter');
console.log(line)

console.log('Pick team 1')
var team1Index = readlineSync.keyInSelect(teams.map(team => team.name), 'Team 1?', { cancel: false })

console.log(line)

var enemyTeams = teams.filter(team => team.name !== teams[team1Index].name)
console.log('Pick team 2')
var team2Index = readlineSync.keyInSelect(enemyTeams.map(team => team.name), 'Team 2?', { cancel: false })

const team1 = teams[team1Index]
const team2 = enemyTeams[team2Index]


console.log(`\nYou selected ${team1.name} vs ${team2.name}`)

getMatches(team1.teamId, team2.teamId)