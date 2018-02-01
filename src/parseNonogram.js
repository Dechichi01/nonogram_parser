const request = require('request')
const pdfUtil = require('pdf-to-text')
const fs = require('fs')

const nanoSolverUrl = 'http://liacs.leidenuniv.nl/~kosterswa/nono/sjoerd/result.php'
const pdfBasePath = `${__dirname}/../pdf_backups`

module.exports.buildNonogram = function sendToNonogramSolver(dirPath, fileName, extension, options, callback) {
    const filePath = `${dirPath}/${fileName}.${extension}`

    var req = request.post({ url: nanoSolverUrl, encoding: null }, function (err, resp, body) {
        if (err) {
            callback(err)
            return
        }

        const pdfBackupPath = `${pdfBasePath}/${fileName}_${options.sufix}.pdf`
        fs.writeFile(pdfBackupPath, body, null, function (err) {
            if (err) {
                callback(err)
                return
            }

            module.exports.nonogramFromPdf(pdfBackupPath, callback)
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
    form.append('weightb', 1)
    form.append('weightc', 8)
}

module.exports.nonogramFromPdf = function readPdfAndBuildNonogram(path, callback) {
    pdfUtil.pdfToText(path, function (err, data) {
        if (err) {
            callback(err)
            return
        }
        const json = buildNonogramJson(data)
        callback(null, json)
    })
}

function buildNonogramJson(data) {
    const lines = data
                    .split('\n')
                    .filter(l => l.length > 0)
                    .splice(3)
                    .slice(0, -1)

    const lengths = lines.map(l => l.length)
    const firstRowIndex = lengths.indexOf(Math.max(...lengths)) + 1
    
    //x
    const rows = lines.slice(firstRowIndex, lines.length)
    const x = []

    for (let i = 0; i < rows.length; i++) {
        const [numbers, ] = findAllNumbersAndIndexes(rows[i])
        x.push(numbers)
    }

    const columnsRows = lines.splice(0, firstRowIndex)
    const bottomColumnRow = processColumnRow(columnsRows[ columnsRows.length - 1])
    const otherColumnsRows = columnsRows.slice(0, -1)

    const [bottomColumnNumbers, bottomColumnIndexes] = findAllNumbersAndIndexes(bottomColumnRow)

    const columnsCount = bottomColumnNumbers.length

    allColumnsNumbers = []

    //bottomColumnRow, bottomColumnNumbers, bottomColumnIndexes, otherColumnRow, length) {
    otherColumnsRows.forEach(cr => {
        const processedRow = processColumnRow(cr)
        const otherColumNumbers = buildColumnRow(bottomColumnRow, bottomColumnNumbers, bottomColumnIndexes, processedRow, columnsCount)
        allColumnsNumbers.push(otherColumNumbers)
    });

    allColumnsNumbers.push(bottomColumnNumbers)

    const y = Array(columnsCount)
    
    for (let i = 0; i < columnsCount; i++) {
        const set = []
        for (let j = 0; j < allColumnsNumbers.length; j++) {
            const columnNumbers = allColumnsNumbers[j];
            set.push(columnNumbers[i])
        }
        y[i] = set
    }

    return { x, y }
}

function countSpaces(str) {
    let index = 0
    while(str[index] === " ") {
        index++
    }

    return index + 1
}

function findAllNumbersAndIndexes(str) {
    const numbers = []
    const indexes = []
    let minIndex = -1

    const strCopy = str.slice(0)
    while(str.length > 0) {
        const match = str.match(/\d+|-/)[0]
        if (!match) {
            return numbers
        }

        if (match === "-") {
            match = "0"
        }

        numbers.push(parseInt(match, 10))
        minIndex = getIndexOnString(strCopy, match[0], minIndex)
        indexes.push(minIndex)

        const index = str.indexOf(match[0])
        str = str.slice(index + match.length)
    }

    return [numbers, indexes]
}

function getIndexOnString(str, char, minIndex) {
    const isSpaceOrUndefined = c => {
        return !c || c === " "
    }

    const allIndexes = str.split('').map((c, i) => c === char && (str[i-1] === " " || !str[i-1]) ? i : '').filter(String)
    return allIndexes.find(e => e > minIndex)
}

function processColumnRow(columnRow) {
    for (let i = 0; i < columnRow.length; i++) {
        const c = columnRow[i]
        const otherC = columnRow[i + 2]
        if (c && otherC && c !== " " && otherC !== " ") {//remove wrongly added spaces during pdf parse
            columnRow = columnRow.replaceAt(i+1, otherC)
            columnRow = columnRow.replaceAt(i+2, " ")
            
        }
    }

    return columnRow
}

function buildColumnRow(bottomColumnRow, bottomColumnNumbers, bottomColumnIndexes, otherColumnRow, length) {
    const retVal = Array(length).fill(0)
    const [otherCRNumbers, otherCRIndexes] = findAllNumbersAndIndexes(otherColumnRow)

    otherCRIndexes.forEach((strIndex, i) => {
        var chosenIndex = -1
        if (bottomColumnRow[strIndex] !== " ") {
            chosenIndex = strIndex
        } else if (bottomColumnRow[strIndex - 1] !== " ") {
            chosenIndex = strIndex - 1
        } else if (bottomColumnRow[strIndex + 1] !== " ") {
            chosenIndex = strIndex + 1
        }

        if (chosenIndex < 0 || isNaN(parseInt(bottomColumnRow[chosenIndex]))) {
            throw(`Error building column row: \n${bottomColumnRow} \n${otherColumnRow}`)
        }

        const bottomColumnIndex = bottomColumnIndexes.indexOf(chosenIndex)
        retVal[bottomColumnIndex] = otherCRNumbers[i]
    });

    return retVal
}

String.prototype.replaceAt=function(index, char) {
    var a = this.split("");
    a[index] = char;
    return a.join("");
}