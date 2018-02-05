const Promise = require('bluebird')
const request = require('request')
const pdfUtil = require('pdf-to-text')
const fs = require('fs')

const nanoSolverUrl = 'http://liacs.leidenuniv.nl/~kosterswa/nono/sjoerd/result.php'
const pdfBasePath = `${__dirname}/../pdf_backups`

module.exports.buildNonogram = function sendToNonogramSolver(dirPath, fileName, extension, options) {
    return new Promise((resolve) => {
        console.log('Sending request: ', fileName, options.sufix)
        const filePath = `${dirPath}/${fileName}.${extension}`

        var req = request.post({ url: nanoSolverUrl, encoding: null }, function (err, resp, body) {
            if (err) {
                resolve()
                console.log(err)
                return
            }

            const pdfBackupPath = `${pdfBasePath}/${fileName}_${options.sufix}.pdf`
            fs.writeFile(pdfBackupPath, body, null, function (err) {
                if (err) {
                    resolve()
                    console.log(err)
                    return
                }

                resolve()
            })
        })

        var form = req.form()
        form.append('upload_image', fs.createReadStream(`${__dirname}/../${filePath}`))

        form.append('height', options.height)
        if (options.edgeDetection) {
            form.append('edge', 1)
        }
        form.append('button', 'make the puzzle')
        form.append('otherlogo', 'n')
        form.append('repeat', 4)
        form.append('keepgoing', 20)
        form.append('choosemethod', 2)
        form.append('fillpercentage', options.fillPercent)
        form.append('threshold', 125)
        form.append('stepsize', 1)
        form.append('weighta', 8)
        form.append('weightb', 50)
        form.append('weightc', 0)
    })
}

module.exports.nonogramFromPdf = function readPdfAndBuildNonogram(path) {
    return new Promise(resolve => {
        console.log('Parsing pdf: ', path)
        const fullPath = `${pdfBasePath}/${path}`
        pdfUtil.pdfToText(fullPath, function (err, data) {
            if (err) {
                console.log(err)
                resolve(null)
            }
            const json = buildNonogramJson(data)
            resolve(json)
        })
    })
}

function buildNonogramJson(data) {
    const lines = data
        .split('\n')
        .filter(l => l.length > 0)
        .splice(3)
        .slice(0, -1)
        //.map(l => processColumnRow(l))

    console.log(lines)
    const lengths = lines.map(l => l.replace(/\s/g, '').length)
    const firstRowIndex = lengths.lastIndexOf(Math.max(...lengths)) + 1

    const rowCount = lines.length - firstRowIndex;
    const [columNumbers, ] = findAllNumbersAndIndexes(lines[firstRowIndex-1])
    const columnCount = columNumbers.length

    const rows = lines
                    .slice(firstRowIndex, lines.length)
                    .map(l => processColumnRow(l, columnCount, false))

    const columnsRows = lines
                    .splice(0, firstRowIndex)
                    .map(l => processColumnRow(l, rowCount, true))

    //x
    let x = []

    for (let i = 0; i < rows.length; i++) {
        const [numbers,] = findAllNumbersAndIndexes(rows[i])
        x.push(numbers)
    }

    x = x.map(arr => arr.filter(e => e > 0))

    
    const bottomColumnRow = columnsRows[columnsRows.length - 1]
    const otherColumnsRows = columnsRows.slice(0, -1)

    const [bottomColumnNumbers, bottomColumnIndexes] = findAllNumbersAndIndexes(bottomColumnRow)

    const columnsCount = bottomColumnNumbers.length

    allColumnsNumbers = []

    //bottomColumnRow, bottomColumnNumbers, bottomColumnIndexes, otherColumnRow, length) {
    otherColumnsRows.forEach(cr => {
        const otherColumNumbers = buildColumnRow(bottomColumnRow, bottomColumnNumbers, bottomColumnIndexes, cr, columnsCount)
        allColumnsNumbers.push(otherColumNumbers)
    });

    allColumnsNumbers.push(bottomColumnNumbers)

    let y = Array(columnsCount)

    for (let i = 0; i < columnsCount; i++) {
        const set = []
        for (let j = 0; j < allColumnsNumbers.length; j++) {
            const columnNumbers = allColumnsNumbers[j];
            set.push(columnNumbers[i])
        }
        y[i] = set
    }

    y = y.map(arr => arr.filter(e => e > 0))
    return { x, y }
}

function countSpaces(str) {
    let index = 0
    while (str[index] === " ") {
        index++
    }

    return index + 1
}

function findAllNumbersAndIndexes(str) {
    const numbers = []
    const indexes = []
    let minIndex = -1

    const strCopy = str.slice(0)

    while (str.length > 0) {
        let baseMatch = str.match(/\d+|-/)
        if (!baseMatch) {
            return [numbers, indexes]
        }

        baseMatch = baseMatch[0]
        const match = baseMatch === "-" ? "0" : baseMatch

        numbers.push(parseInt(match, 10))
        minIndex = getIndexOnString(strCopy, baseMatch[0], minIndex)
        indexes.push(minIndex)

        const index = str.indexOf(baseMatch[0])
        str = str.slice(index + baseMatch.length)
    }

    return [numbers, indexes]
}

function getIndexOnString(str, char, minIndex) {
    const isSpaceOrUndefined = c => {
        return !c || c === " "
    }

    const allIndexes = str.split('').map((c, i) => c === char && (str[i - 1] === " " || !str[i - 1]) ? i : '').filter(String)
    return allIndexes.find(e => e > minIndex)
}

function processColumnRow(columnRow, maxCount, isColumn) {
    const [columnRowNumbers, ] = findAllNumbersAndIndexes(columnRow)
    const numberCount = columnRowNumbers.length

    for (let i = 0; i < columnRow.length; i++) {
        const c = columnRow[i]
        const otherC = columnRow[i + 2]
        if (c && otherC && c === "1") {//remove wrongly added spaces during pdf parse
            const result = `${c}${otherC}`
            if (parseInt(result, 10) <= maxCount) {
                let tempColumnRow = columnRow.replaceAt(i + 1, otherC)
                tempColumnRow = tempColumnRow.replaceAt(i + 2, " ")
                
                const [tempColumnRowNumbers, ] = findAllNumbersAndIndexes(tempColumnRow)
                const sum = tempColumnRowNumbers.reduce((a, b) => a + b, 0) + tempColumnRowNumbers.length - 1;

                if (sum <= maxCount || isColumn === true) {
                    columnRow = tempColumnRow
                }
            }
        }
    }

    return columnRow
}

function buildColumnRow(bottomColumnRow, bottomColumnNumbers, bottomColumnIndexes, otherColumnRow, length) {
    const retVal = Array(length).fill(0)
    const [otherCRNumbers, otherCRIndexes] = findAllNumbersAndIndexes(otherColumnRow)

    const isSpaceOrUndefined = c => {
        return c === " " || !c
    }

    otherCRIndexes.forEach((strIndex, i) => {
        var chosenIndex = -1
        if (!isSpaceOrUndefined(bottomColumnRow[strIndex])) {
            chosenIndex = strIndex
        } else if (!isSpaceOrUndefined(bottomColumnRow[strIndex - 1])) {
            chosenIndex = strIndex - 1
        } else if (!isSpaceOrUndefined(bottomColumnRow[strIndex + 1])) {
            chosenIndex = strIndex + 1
        } else if (!isSpaceOrUndefined(bottomColumnRow[strIndex - 2])) {
            chosenIndex = strIndex - 2
        }

        if (chosenIndex < 0 || isNaN(parseInt(bottomColumnRow[chosenIndex]))) {
            throw (`Error building column row: \n${bottomColumnRow} \n${otherColumnRow} \n
                ${otherCRNumbers}, ${otherCRIndexes} \n
                ${strIndex}, ${i} \n
                ${bottomColumnRow[strIndex]}, ${bottomColumnRow[strIndex - 1]}, ${bottomColumnRow[strIndex + 1]}`)
        }

        const bottomColumnIndex = bottomColumnIndexes.indexOf(chosenIndex)
        retVal[bottomColumnIndex] = otherCRNumbers[i]
    });

    return retVal
}

String.prototype.replaceAt = function (index, char) {
    var a = this.split("");
    a[index] = char;
    return a.join("");
}