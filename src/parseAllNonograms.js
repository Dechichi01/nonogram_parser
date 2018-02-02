const fs = require('fs')
const nonogramParser = require('./parseNonogram.js')

const nonogramsPath = `${__dirname}/../nonograms`
const dirRelativePath = process.argv[2]

function parseAll(path) {
    const images = []

    fs.readdir(path, async (err, files) => {
        if (err) {
            console.log(err)
            return
        }

        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const fileAndExt = f.split(".")
            const extension = fileAndExt[1]
            
            if (extension !== 'pdf') {
                continue
            }

            const sufixRg = /_easy|_medium|_hard/
            const parts = fileAndExt[0].split(sufixRg)
            const match = fileAndExt[0].match(sufixRg) || ['']
            const fileName = parts[0]
            const fileSufix = match[0].slice(1).concat(parts[1])

            const json = await nonogramParser.nonogramFromPdf(f)
            
            if (!json) {
                continue
            }

            let imageObj = images.find(m => m.id === fileName)
            if (!imageObj) {
                imageObj = {
                    id: fileName,
                    nonograms: {}
                }

                images.push(imageObj)
            }

            imageObj.nonograms[fileSufix] = json
        }

        const imagesStr = JSON.stringify(images, null, 4)
        fs.writeFile(`${nonogramsPath}/images.json`, imagesStr, (err) => {
            if (err) {
                console.log(err)
            }
        })
    })
}

parseAll(dirRelativePath)
