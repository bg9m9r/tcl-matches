const axios = require('axios').default;
const fastcsv = require('fast-csv');
const fs = require('fs');
const readlineSync = require('readline-sync')


var teams = []
var platform = ''
const line = '\n------------------------\n'

var matchFound = false

var positions = {
    "leftWing": "LW",
    "center": "C",
    "rightWing": "RW",
    "defenseMen": "D",
    "goalie": "G"
}

const getMatches = async (team1Id, team2Id) => {
    try {
        const uri = `https://proclubs.ea.com/api/nhl/clubs/matches?clubIds=${team1Id}&platform=${platform}&matchType=club_private`
        const res = await axios.get(uri, {headers: {'Referer': 'www.ea.com'}, })
        const data = res.data

        console.log(uri)

        data
        .filter(match => match.clubs[team2Id])
        .map(match => {
            
            for (const teamId in match.players) {

                const teamPlayers = match.players[teamId]
                const matchStats = []
                const ws = fs.createWriteStream('./stats/' + match.matchId + " - " + match.clubs[teamId].details.name + ".csv")

                for (const playerId in teamPlayers){

                    var player = teamPlayers[playerId]

                    var skaterPos = player.position !== 'goalie' ? 1 : 0
                    var goaliePos = skaterPos === 0 ? 1 : 0
                    var centerPos = player.position === 'center' ? 1 : 0
                    var wingPos = player.position === 'leftWing' || player.position === 'rightWing' ? 1 : 0
                    var defPos = player.position === 'defenseMen' ? 1 : 0

                    matchStats.push({
                        playername: player.playername,
                        position: positions[player.position],
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
                        gldsaves: player.gldsaves,
                        sgp: skaterPos,
                        ggp: goaliePos,
                        cgp: centerPos,
                        wgp: wingPos,
                        dgp: defPos
                    })
                }
                // write
                fastcsv
                .write(matchStats, { headers: true })
                .pipe(ws)

                matchFound = true

                console.log('File created: ' + match.matchId + " - " + match.clubs[teamId].details.name + ".csv")
            }
        })

        if (!matchFound) 
            console.log('No matches found')

    } catch (e) {

        console.error(e)
    }
}

const loadConfig = () => {

    try
    {
        if(!fs.existsSync('./configs/config.json')) {
            console.log('no config found')
            writeConfig()
        }
            
        var config = JSON.parse(fs.readFileSync('./configs/config.json', 'utf8'))
        teams = JSON.parse(fs.readFileSync('./configs/' + config.league + '.json', 'utf8'))
    }
    catch (e)
    {
        console.log(e)
        writeConfig()
    }
        
    var config = JSON.parse(fs.readFileSync('./configs/config.json', 'utf8'))

    if(!fs.existsSync('./configs/' + config.league + '.json')){
        fs.rmSync('./configs/config.json')
        console.log('no config found')
        writeConfig()

        config = JSON.parse(fs.readFileSync('./configs/config.json', 'utf8'))
    }

    var league = JSON.parse(fs.readFileSync('./configs/' + config.league + '.json', 'utf8'))

    teams = league.Teams
    platform = league.Platform

    if (config.league.includes('ITHL') && fs.existsSync('./configs/config.json')){
        fs.rmSync('./configs/config.json')
    }

}

const writeConfig = () => {
    console.log('Which league do you want to export data for?')
    
    var leagues = fs.readdirSync('./configs').map(league => league.replace('.json', ''))
    var leagueIndex = readlineSync.keyInSelect(leagues, 'League', { cancel: false })

    
    fs.writeFileSync('./configs/config.json', JSON.stringify({ league: leagues[leagueIndex]}))
    
}

/****************************************************************************************************************** */


const main = async () => {
    //start
    console.clear()

    console.log(line)
    console.log('TCL Hockey Stat Exporter');
    console.log(line)

    loadConfig()

    console.log('Pick team 1')
    var team1Index = readlineSync.keyInSelect(teams.map(team => team.name), 'Team 1?', { cancel: false })

    console.log(line)

    var enemyTeams = teams.filter(team => team.name !== teams[team1Index].name)
    console.log('Pick team 2')
    var team2Index = readlineSync.keyInSelect(enemyTeams.map(team => team.name), 'Team 2?', { cancel: false })

    const team1 = teams[team1Index]
    const team2 = enemyTeams[team2Index]


    console.log(`\nYou selected ${team1.name} vs ${team2.name}`)

    await getMatches(team1.teamId, team2.teamId)

    console.log('\nDone')
}

main()