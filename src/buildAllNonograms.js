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
        fillPercent: 15,
    },
    hard: {
        sufix: 'hard',
        height: 15,
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

            nonogramParser.buildNonogram(path, fileName, extension, imageOptions.easy, cb1(imageOptions.easy.sufix))
            await utils.sleep(sleepTimeMs)

            nonogramParser.buildNonogram(path, fileName, extension, imageOptions.hard, cb2(imageOptions.hard.sufix))
            await utils.sleep(sleepTimeMs)
        })
    })
}

buildAllNonograms(dirRelativePath)