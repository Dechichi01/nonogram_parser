const fs = require('fs')
const nonogramParser = require('./parseNonogram.js')
const utils = require('./utils.js')

const dirRelativePath = process.argv[2]

const imageOptions = {
    easy: {
        sufix: 'easy',
        height: 10,
        edgeDetection: false,
        fillPercent: 15,
    },
    easy_edge: {
        sufix: 'easy_edge',
        height: 10,
        edgeDetection: true,
        fillPercent: 15,
    },
    medium: {
        sufix: 'medium',
        height: 10,
        edgeDetection: false,
        fillPercent: 25,
    },
    medium_edge: {
        sufix: 'medium_edge',
        height: 10,
        edgeDetection: true,
        fillPercent: 25,
    },
    hard: {
        sufix: 'hard',
        height: 15,
        edgeDetection: false,
        fillPercent: 35,
    },
    hard_edge: {
        sufix: 'hard_edge',
        height: 15,
        edgeDetection: true,
        fillPercent: 35,
    },
}

function buildAllNonograms(path) {
    fs.readdir(path, async (err, files) => {
        if (err) {
            console.log(err)
            return
        }

        for (let i = 0; i < files.length; i++) {
            const f = files[i]
            const nameAndExt = f.split('.')
            const fileName = nameAndExt[0]
            const extension = nameAndExt[1]

            if (extension !== 'jpg') {
                continue
            }

            await nonogramParser.buildNonogram(path, fileName, extension, imageOptions.easy)
            await nonogramParser.buildNonogram(path, fileName, extension, imageOptions.easy_edge)
            await nonogramParser.buildNonogram(path, fileName, extension, imageOptions.medium)
            await nonogramParser.buildNonogram(path, fileName, extension, imageOptions.medium_edge)
            await nonogramParser.buildNonogram(path, fileName, extension, imageOptions.hard)
            await nonogramParser.buildNonogram(path, fileName, extension, imageOptions.hard_edge)
        }
    })
}

//buildAllNonograms(dirRelativePath)