const fs = require('fs')
const pngToJpg = require('png-to-jpeg')

const imagesPngPath = `${__dirname}/../images_png`
const imagesJpgPath = `${__dirname}/../images_jpg`

function convertAll() {
    fs.readdir(imagesPngPath, (err, files) => {
        if (err) {
            console.log(err)
            return
        }

        files.forEach(f => {
            try {
                const nameAndExt = f.split('.')
                const fileName = nameAndExt[0]
                const extension = nameAndExt[1]

                const fLower = f.toLowerCase()
                if (fLower.indexOf('png') < 0 || fLower.indexOf('gif') >= 0) {
                    return
                }

                const imagePath = `${imagesPngPath}/${f}`
                const newImagePath = `${imagesJpgPath}/${fileName}.jpg`

                const buffer = fs.readFileSync(imagePath)
                    pngToJpg({ quality: 100 })(buffer).then(output => fs.writeFileSync(newImagePath, output))
            } catch (err) {
                console.log('->', f)
            }
        });

    })
}

convertAll()

