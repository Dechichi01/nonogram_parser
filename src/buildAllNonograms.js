const fs = require('fs')
const nonogramParser = require('./parseNonogram.js')
const utils = require('./utils.js')

const nonogramsPath = `${__dirname}/../nonograms`
const dirRelativePath = process.argv[2]
const sleepTimeMs = 1000

const imageOptions = {
    easy: {
        sufix: 'easy',
        height: 10,
        edgeDetection: false,
        fillPercent: 15,
    },
    easy_edge: {
        sufix: 'easy_edge',
        height: 15,
        edgeDetection: true,
        fillPercent: 15,
    },
    hard: {
        sufix: 'hard',
        height: 15,
        edgeDetection: false,
        fillPercent: 25,
    },
    hard_edge: {
        sufix: 'hard_edge',
        height: 15,
        edgeDetection: true,
        fillPercent: 25,
    },
}

function buildAllNonograms(path) {
    const images = []

    fs.readdir(path, (err, files) => {
        if (err) {
            console.log(err)
            return
        }
        
        files.forEach(async (f, i) => {
            const nameAndExt = f.split('.')
            const fileName = nameAndExt[0]
            const extension = nameAndExt[1]

            const imageObj = {
                id: fileName,
                nonograms: {},
            }

            const cb1 = (sufix) => (err,json) => {
                if (err) {
                    console.log(err)
                    return
                }
                imageObj.nonograms[sufix] = json
            }

            const cb2 = (sufix) => (err, json) => {
                cb1(sufix)(err, json)
                images.push(imageObj)
                
                console.log('Finished building nanogram for image: ' + f)
                if (images.length == files.length) {
                    const imagesJson = JSON.stringify(images, null, '\t')
                    const imagesPath = `${nonogramsPath}/images.json` 
                    fs.writeFile(imagesPath, imagesJson, function (err) {
                        if (err) {
                            console.log(err)
                            return
                        }
                    })
                }
            }

            const optionsKeys = Object.keys(imageOptions)
            const length = optionsKeys.length
            for (let i = 0; i < length; i++) {
                const options = imageOptions[optionsKeys[i]]

                const cb = i === optionsKeys.length - 1 ? cb2 : cb1
                nonogramParser.buildNonogram(path, fileName, extension, options, cb(options.sufix))
                await utils.sleep(sleepTimeMs)
            }
        })
    })
}

buildAllNonograms(dirRelativePath)