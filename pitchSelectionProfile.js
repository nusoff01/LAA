/***** Functions used in index.html */

// input:
//  playerDataPoints - array of tuples of [name, value] representing pitch name and frequency
//  leagueAverageDataPoints - array of tuples of [name, value] representing pitch name and frequency
//  containerId - html id of container element the chart will be inserted into
// output:
//  none
function drawRadarGraph (playerPitches, leagueAveragePitches, containerId) {
    const container = d3.select(`#${containerId}`);

    const chartWidth = Math.round(container.node().getBoundingClientRect().width);
    const chartHeight = Math.round(container.node().getBoundingClientRect().height);

    const radius = Math.min(chartWidth, chartHeight) / 2;

    // add in svg if not present
    if (container.select('.chartGroup').empty()) {
        container.append('svg')
            .attr('width', chartWidth)
            .attr('height', chartHeight)
            .append('g')
            .attr('class', 'chartGroup')
            .attr('transform', `translate(${(chartWidth / 2)}, ${(chartHeight / 2)})`);
    }

    const chartGroup = container.select('.chartGroup');

    // x and y positions on a circle from (i / totalCount) around the circle, starting at the top of the circle
    const getX = (i, totalCount) => {
        const angle = (i / totalCount) * Math.PI * 2  + Math.PI;
        return radius * Math.sin(angle);
    }
    const getY = (i, totalCount) => {
        const angle = (i / totalCount) * Math.PI * 2 + Math.PI;
        return radius * Math.cos(angle);
    }


    const axisLines = chartGroup.selectAll('.axisLines')
        .data(playerPitches);
    axisLines.enter()
        .append('line')
        .attr('class', 'axisLine')
        .attr('x1', 0)
        .attr('y1', 0)
        .merge(axisLines)
        .attr('x2', (pitch, i) => {
            return getX(i, playerPitches.length);
        })
        .attr('y2', (pitch, i) => {
            return getY(i, playerPitches.length);
        });
    axisLines.exit().remove();

    const axisText = chartGroup.selectAll('.axisText')
        .data(playerPitches);
    axisText.enter()
        .append('text')
        .attr('class', 'axisText')
        .merge(axisText)
        .text(pitch => pitch[0])
        .attr('transform', (pitch, i) => {
            const x = getX(i, playerPitches.length);
            const y = getY(i, playerPitches.length);
            const rotation = 90 - (360 * (i / playerPitches.length));
            return `translate(${x},${y}) rotate(${rotation})`;
        })
        .attr('y', "-4");
    axisText.exit().remove();


    //boundary polygon
    // divide a circle into equal angles, then apply cosine and sine to the angle, 
    // and multiply by the scalar to give points

    const drawPolygon = (rawValues, polygonClass) => {
        const polygonPoints = rawValues.map((rawValue, i) => {
            const scalar = radius * rawValue
            const angle = (i / rawValues.length) * Math.PI * 2 + Math.PI;
            return [scalar * Math.sin(angle), scalar * Math.cos(angle)]; 
        });

        const boundaryPolygon = chartGroup.selectAll(`.${polygonClass}`)
            .data([polygonPoints]);
        boundaryPolygon.enter()
            .append('polygon')
            .attr('class', polygonClass)
            .merge(boundaryPolygon)
            .attr('points', (points) => {
                let polygonString = '';
                points.forEach((polygonTuple) => {
                    polygonString += `${polygonTuple[0]},${polygonTuple[1]} `;
                });
                return polygonString;
            });
        boundaryPolygon.exit().remove();
    }

    drawPolygon(playerPitches.map((pitch) => pitch[1]), 'playerPolygon')
    drawPolygon(leagueAveragePitches.map((pitch) => pitch[1]), 'leagueAveragePolygon')
}

// input:
//  playerDataPoints - array of tuples of [name, value] representing pitch name and frequency
//  leagueAverageDataPoints - array of tuples of [name, value] representing pitch name and frequency
//  containerId - html id of container element the table will be inserted into
// output:
//  none
function renderPlayerTable (player, leagueAveragePitches, tableId) {
    const table = d3.select(`#${tableId}`);

    const formatPercent = (raw) => {
        if (isNaN(raw)) {
            return "N/A";
        }
        return `${Math.round(raw * 1000) / 10}%`;
    }

    const headerRow = table.selectAll('.headerRow')
        .data([player.name]);
    headerRow.enter()
        .append('tr')
        .attr('class', 'headerRow')
        .merge(headerRow)
        .each(function (name) {
            const columns = d3.select(this).selectAll('th')
                .data(['', name, 'league average']); //empty string for an empty column
            columns.enter()
                .append('th')
                .merge(columns)
                .text(columnText => columnText);
            columns.exit().remove();
        });
    headerRow.exit().remove();

    const pitchRows = table.selectAll('.pitchRow')
        .data(leagueAveragePitches);
    pitchRows.enter()
        .append('tr')
        .attr('class', 'pitchRow')
        .merge(pitchRows)
        .each(function (pitchTuple, i) {
            const columns =  d3.select(this).selectAll('td')
                .data([pitchTuple[0], formatPercent(player.pitches[i][1]), formatPercent(pitchTuple[1])]);
            columns.enter()
                .append('td')
                .merge(columns)
                .text(columnText => columnText);
        });
}

/***** Helper functions */

const formatData = (rawData) => {
    const fieldsToNiceNamesDictionary = {
        'four_seam_pct': 'four seam',
        'sinker_pct': 'sinker',
        'cutter_pct': 'cutter',
        'slider_pct': 'slider',
        'change_up_pct': 'change up',
        'curve_pct': 'curve',
        'splitter_pct': 'splitter'
    }

    const pitchCountsDictionary = {};
    Object.values(fieldsToNiceNamesDictionary).forEach((pitch) => {
        pitchCountsDictionary[pitch] = 0;
    });
    let totalPitches = 0;

    const formatName = (rawName, team) => {
        const splitName = rawName.split(',');
        return `${splitName[1].trim()} ${splitName[0].trim()} (${team})`;
    }

    const players = rawData.map((rawPlayer) => {
        const player = {};
        player.name = formatName(rawPlayer.player_name_last_first, rawPlayer.team_abbrev);
        player.team = rawPlayer.team_abbrev;
        player.pitches = Object.keys(fieldsToNiceNamesDictionary).map((pitchField) => {
            const pitchCount = Math.round(rawPlayer[pitchField] * rawPlayer.num_pitches);
            if (!isNaN(pitchCount)) {
                pitchCountsDictionary[fieldsToNiceNamesDictionary[pitchField]] += pitchCount;
                totalPitches += pitchCount;
            }
            return [fieldsToNiceNamesDictionary[pitchField], rawPlayer[pitchField]];
        })
        return player;
    }).sort((a, b) => {
        if (a.team < b.team) {
            return -1;
        } 
        if (a.team > b.team) {
            return 1;
        }
        return 0;
    })
    return [players, pitchCountsDictionary];
}

const selectPlayer = (player, leaguePitchCounts, totalPitches) => {
    player.pitches
    .sort((a, b) => {
        if (a[1] > b[1]) {
            return -1;
        }
        if (a[1] < b[1]) {
            return 1;
        }
        return 0;
    });

    // using the order set above to pull from the league stats to create league averages
    const leagueAveragePitchSelections = player.pitches.map((pitch) => {
        const pitchName = pitch[0]
        return [pitchName, leaguePitchCounts[pitchName] / totalPitches]
    });

    renderPlayerTable(player, leagueAveragePitchSelections, 'pitchFrequencyTable')
    drawRadarGraph(player.pitches, leagueAveragePitchSelections, 'chartContainer');

}

/***** Extracting data, rendering player selection buttons, and kicking off first 
 * render of chart/table
*/

d3.csv('devtest.csv', (playersCSV) => {
    const [playerPitchSelections, pitchCountsDictionary] = formatData(playersCSV); 
    const totalPitches = Object.values(pitchCountsDictionary).reduce((runningTotalPitches, currentPitchCount) => {
        return runningTotalPitches + currentPitchCount;
    }, 0);

    const renderPlayerButtons = (selectedIndex = 0) => {
        const playerButtons = d3.select('#pitcherSelectionContainer').selectAll('button')
            .data(playerPitchSelections);
        playerButtons.enter()
            .append('button')
            .attr('class', 'playerSelectionButton')
            .text(player => player.name)
            .on('click', (player, playerIndex) => {
                selectPlayer(player, pitchCountsDictionary, totalPitches);
                renderPlayerButtons(playerIndex)
            })
            .merge(playerButtons)
            .classed('playerIsSelected', (player, playerIndex) => playerIndex === selectedIndex);
        playerButtons.exit().remove();
    }

    renderPlayerButtons();
    selectPlayer(playerPitchSelections[0], pitchCountsDictionary, totalPitches);
});
