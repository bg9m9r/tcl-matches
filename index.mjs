import axios from 'axios';
import { clear }  from "console";
import * as csv from 'fast-csv';
import fs  from "fs";
import { cwd }  from "process";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

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
                csv
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

const loadConfig = async () => {

    try
    {
        if(!fs.existsSync('./configs/config.json')) {
            console.log('no config found')
            await writeConfig()
        }
            
        var config = JSON.parse(fs.readFileSync('./configs/config.json', 'utf8'))
        teams = JSON.parse(fs.readFileSync('./configs/' + config.league + '.json', 'utf8'))
    }
    catch (e)
    {
        console.log(e)
    }
        
    var config = JSON.parse(fs.readFileSync('./configs/config.json', 'utf8'))

    var league = JSON.parse(fs.readFileSync('./configs/' + config.league + '.json', 'utf8'))

    teams = league.Teams
    platform = league.Platform

    if (config.league.includes('ITHL') && fs.existsSync('./configs/config.json')){
        fs.rmSync('./configs/config.json')
    }
}

const writeConfig = async () => {
    console.log('Which league do you want to export data for?');
    
    var leagues = fs.readdirSync('./configs').map(league => league.replace('.json', ''));

    var leagueIndex = await promptForResponse('Pick a league', leagues);

    fs.writeFileSync('./configs/config.json', JSON.stringify({ league: leagues[leagueIndex]}));
}

// returns the index from the response to the prompt
const promptForResponse = async (question, list) => {

    const rl = readline.createInterface({ input, output });
    question = question + '\n> '

    let index = 1;

    list.forEach(item => {
        console.log(index + '. ' + item);
        index++;
    });

    const answer = await rl.question(question);

    rl.close();

    return answer-1;
}

// Remove element at the given index
Array.prototype.remove = function(index) {
    this.splice(index, 1);
}

/****************************************************************************************************************** */


const main = async () => {
    //start
    console.clear()

    console.log(line)
    console.log('ITHL Stat Exporter');
    console.log(line)

    await loadConfig()

    console.log(line)

    var team1Index = await promptForResponse("Pick the first club", teams.map(team => team.name))
    const team1 = teams[team1Index]
    
    
    var enemyTeams = teams.filter(team => team.name !== teams[team1Index].name)

    console.log(line)

    var team2Index = await promptForResponse("Pick the second club", enemyTeams.map(team => team.name))
    const team2 = enemyTeams[team2Index]


    console.log(`\nYou selected ${team1.name} vs ${team2.name}`)

    await getMatches(team1.teamId, team2.teamId)

    console.log('\nDone')
}

await main()